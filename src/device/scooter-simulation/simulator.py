"""
@module simulator

The core simulation engine, that makes the scooters tick.

Orchestrates movement along routes, manages rentals in relation to the activity,
tracks trip counts, and enables specific per-scooter scenarios via clean, injected callbacks.

Keeps the physical Scooter class pure and unaware of routes or rentals,
while allowing for decoupled, realistic and system critical scenarios to play out.
"""

import time
import secrets
import string
import random
import math
import threading
from collections import deque
from api import fetch_users, create_rental, complete_rental, update_bike_status_and_position
from utils import calculate_distance_in_m
from config import UPDATE_INTERVAL, NOMINAL_MAX_SPEED_MPS, LOW_BATTERY_THRESHOLD, NON_RENTABLE_STATUSES
from redisbroadcast import ScooterBroadcaster


class Simulator:
    """
    Simulator handles scooter movement along predefined routes, manages rentals, and is capable of
    bein injected with scooter-specific special scenarios.
    
    Each trip is treated as an independent rental. For the return-trip, the route
    coordinates are read backwards, so the scooter follows the exact same path in reverse.
    
    Routes are hardcoded at this point to ensure the scooter doesn't cut through buildings or
    obstacles.

    Uses a City object with database fetched zones for accurate zone detection
    (charging, parking, city/free, slow/reduced, out-of-bounds).

    Automatically enforces:
    • "reduced" status and 5 km/h limit in slow zones
    • "deactivated" status and full stop when out of bounds

    Note: Scooter state updates are notably absent from this code, as that logic, and the associated
    state broadcasting functionality, is contained and injected into the scooter instances themselves,
    and will be sent (published) to the backend (and forwarded to the frontend) on every tick(),
    in symbiosis, in the simulation script(s), in this fashion:

        try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()
            time.sleep(UPDATE_INTERVAL)

        except KeyboardInterrupt:
            print("Stopped.")
    """

    def __init__(self, scooters, routes, city, rbroadcast=None, custom_scooter_scenarios=None):
        self.scooters = scooters
        self.routes = routes
        self.city = city
        self.rbroadcast = rbroadcast

         # Map route to scooter
        self.scooter_to_route = {
            scooter.id: route_id
            for scooter, route_id in zip(scooters, routes.keys())
        }


        # Registry for per-scooter custom scenarios (scooter_id -> callback)
        # Allows multiple scooters to have independent behaviors efficiently
        self.custom_scooter_scenarios = custom_scooter_scenarios or {}

        # How many full trips has each scooter completed?
        self.trip_counter = {scooter.id: 0 for scooter in scooters}

        # Heading for this position in the route (index of the next waypoint)
        self.next_waypoint_index = {scooter.id: {"route_index": 0} for scooter in scooters}

        # Last known position (used for smoothing out transitions in speed)
        self.last_position = {scooter.id: (scooter.lat, scooter.lng) for scooter in scooters}

        # Last travel_direction (for realistic slowdown in turns)
        self.last_travel_direction = {scooter.id: None for scooter in scooters}

        # Scooter special behaviours:

        # Custom movement override per scooter (replaces route-following when set)
        self.per_scooter_special_behavior = {scooter.id: None for scooter in scooters}

        # Special override status to set deactivated/in need of service scooters movement to zero
        self.deactivated_scooters = set()

        # Locking categories
        self.admin_locked_scooters = set()
        self.battery_locked_scooters = set()
        self.outofbounds_locked_scooters = set()

        # Battery locks that should be applied after the current rental ends
        self.pending_battery_lock = set()

        # Track which charging-related status (charging / chargingLow) this simulator last wrote to DB
        self.last_db_charging_status = {}

        # Current rental state per scooter
        # "active" is the canonical control-flag (rental_id is an identifier, not control flow)
        self.rentals = {
            scooter.id: {
                "active": False,
                "rental_id": None,
                "user_id": None,
                "user_name": None,
                "start_zone": "free",
                "end_zone": "free",
            }
            for scooter in scooters
        }

        # External rentals (initiated by backend/user app).
        # When active, the simulator must not start/end rentals for that scooter,
        # and must not route-move it.
        # It should however keep publishing state and logging coords.
        self.external_rentals = {
            scooter.id: {
                "active": False,
                "rental_id": None,
                "user_id": None,
                "user_name": None,
            }
            for scooter in scooters
        }

        # User pool - has now been supplanted by actual db-fetched users
        # (Generic JohnDoe-generated users are used as fallback if API fails)
        self.user_pool = fetch_users()

        # Admin status updates arrive from a background thread.
        # They are queued and appied at the start of each tick().
        self._admin_lock = threading.Lock()
        self._admin_updates = deque()

        # Rental lifecycle events arrive from a background thread.
        # Same pattern: queue, then apply at tick boundary.
        self._rental_event_lock = threading.Lock()
        self._rental_events = deque()

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Admin status updates (thread-safe)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def enqueue_admin_status_update(self, scooter_id, new_status):
        """
        Thread-safe enqueing of admin updates from AdminStatusListener.
        """
        with self._admin_lock:
            self._admin_updates.append((scooter_id, new_status, time.time()))

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental event (thread-safe)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def enqueue_rental_event(self, payload):
        """
        Thread-safe enqueing of rental lifecycle events from RentalEventListener.

        Example expected payloads:
          - { "type": "rental_started", "rental_id": "...", "scooter_id": 123, "user_id": ..., "user_name": ... }
          - { "type": "rental_ended", "rental_id": "...", "scooter_id": 123 }
        """
        with self._rental_event_lock:
            self._rental_events.append(payload)


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Bike status update helper (DB-first)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _update_bike_status_position_db_first(self, scooter, new_status):
        """
        Canonical status + positional bike update.
        Ensures DB is updated before applying the status-change locally.
        """
        try:
            success = update_bike_status_and_position(
                scooter.id,
                new_status,
                scooter.lat,
                scooter.lng
            )
            if success:
                print(f"[Simulator] Status and position updated: scooter {scooter.id} -> '{new_status}' @ ({scooter.lat}, {scooter.lng})")
            else:
                print(f"[Simulator] WARNING: Status+position update failed: scooter {scooter.id} -> '{new_status}'")
        except Exception as e:
            print(f"[Simulator] WARNING: Status+position update threw: scooter {scooter.id} -> '{new_status}' | {e}")


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Charging status update helper (DB-first)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _sync_charging_status_db_first(self, scooter, in_charging_zone):
        """
        Canonical charging status update (charging / chargingLow), DB-first.
        Ensures DB is updated before applying the status-change locally.
        """
        # Never mark charging while actively rented
        if scooter.status == "active":
            self.last_db_charging_status.pop(scooter.id, None)
            return

        # Admin or out-of-bounds owns the status
        if scooter.id in self.admin_locked_scooters or scooter.id in self.outofbounds_locked_scooters:
            self.last_db_charging_status.pop(scooter.id, None)
            return

        last_written = self.last_db_charging_status.get(scooter.id)

        if in_charging_zone:
            next_charging_status = (
                "chargingLow"
                if scooter.battery < LOW_BATTERY_THRESHOLD
                else "charging"
            )

            if last_written != next_charging_status:
                self._update_bike_status_position_db_first(scooter, next_charging_status)
                scooter.status = next_charging_status
                self.last_db_charging_status[scooter.id] = next_charging_status
            return

        # We previously set charging / chargingLow and now left the zone === restore correct non-charging state
        if last_written in ("charging", "chargingLow"):
            if scooter.battery < LOW_BATTERY_THRESHOLD:
                self._update_bike_status_position_db_first(scooter, "needCharging")
                scooter.status = "needCharging"
            else:
                self._update_bike_status_position_db_first(scooter, "available")
                scooter.status = "available"

            self.last_db_charging_status.pop(scooter.id, None)


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Admin hooks (used internally when applying queued admin updates)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _apply_admin_lock(self, scooter_id):
        """
        Apply a permanent lock in place (stops movement immediately in places).
        """
        if scooter_id not in self.deactivated_scooters:
            def permanent_lock(scooter, elapsed_time):
                return {
                    "lat": scooter.lat,
                    "lng": scooter.lng,
                    "speed_kmh": 0.0,
                    "activity": scooter.status,
                    "route_finished": False
                }

            self.per_scooter_special_behavior[scooter_id] = permanent_lock
            self.deactivated_scooters.add(scooter_id)
            self.admin_locked_scooters.add(scooter_id)

        else:
            # Already locked (battery/out-of-bounds). Still mark as admin-owned to prevent removal bugs.
            self.admin_locked_scooters.add(scooter_id)

    def _remove_admin_lock(self, scooter_id):
        """
        Remove any existing admin lock (used for non-critical status updates).
        """
        if scooter_id not in self.admin_locked_scooters:
            return

        self.admin_locked_scooters.remove(scooter_id)

        # Only remove the movement override if the override was admin-owned.
        # If battery/out-of-bounds is owning the lock, do not disturb it.
        if scooter_id in self.battery_locked_scooters or scooter_id in self.outofbounds_locked_scooters:
            return

        if scooter_id in self.deactivated_scooters:
            self.per_scooter_special_behavior[scooter_id] = None
            self.deactivated_scooters.remove(scooter_id)

    def _apply_battery_lock(self, scooter):
        """
        Apply low-battery lock immediately (immobilize + mark needCharging), DB-first.
        Safe to call multiple times - will not operate if already locked for any reason.
        """
        if scooter.id in self.deactivated_scooters:
            return

        def lock_due_to_low_battery(scooter, elapsed_time):
            return {
                "lat": scooter.lat,
                "lng": scooter.lng,
                "speed_kmh": 0.0,
                "route_finished": False,
                "activity": "needCharging"
            }

        self.per_scooter_special_behavior[scooter.id] = lock_due_to_low_battery
        self.deactivated_scooters.add(scooter.id)
        self.battery_locked_scooters.add(scooter.id)

        # Canonical status update should happen before when we apply the needCharging-lock-status.
        self._update_bike_status_position_db_first(scooter, "needCharging")

        scooter.status = "needCharging"
        print(f"DEBUG: Scooter {scooter.id} locked due to low battery ({scooter.battery}%)")


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental completion helper (shared for normal/forced/out-of-bounds)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _complete_rental_and_publish(self, scooter, rental_state, end_zone, current_time):
        """
        Complete rental via API, then publish summary to Redis.
        """
        rental_id = rental_state.get("rental_id")
        if not rental_state.get("active") or not rental_id:
            return None

        rental_state["end_zone"] = end_zone
        path_coordinates = self.rbroadcast.load_coords(rental_id)

        # Ensure last coordinate has 0 speed (realistic stop)
        if path_coordinates:
            path_coordinates[-1]["spd"] = 0.0

        complete_rental(
            rental_id=rental_id,
            end_point={"lat": float(scooter.lat), "lng": float(scooter.lng)},
            end_zone=end_zone,
            route=path_coordinates,
        )

        self._publish_completed_rental(
            scooter,
            rental_state,
            current_time,
            path_coordinates,
        )

        return path_coordinates


    def _force_complete_active_rental_at_current_position(self, scooter, current_time, end_zone="admin_forced"):
        """
        Force-completes any active rental at the current position.
        """
        rental_state = self.rentals[scooter.id]
        if not rental_state["active"]:
            return

        print(f"Forcing completion of active rental {rental_state['rental_id']} due to admin UI-event.")

        self._complete_rental_and_publish(
            scooter,
            rental_state,
            end_zone=end_zone,
            current_time=current_time
        )

        self._return_user_to_pool(rental_state)
        self._reset_rental_state(rental_state)



    def _find_scooter_by_id(self, scooter_id):
        """
        Locate a scooter in the simulator by its ID, tolerating int/str mismatches.
        """
        # First try direct comparison
        for scooter in self.scooters:
            if scooter.id == scooter_id:
                return scooter

        # Fallback: compare as integers
        try:
            target_id_int = int(scooter_id)
            for scooter in self.scooters:
                if scooter.id == target_id_int:
                    return scooter
        except (TypeError, ValueError):
            pass

        # Fallback: compare as strings
        try:
            target_id_str = str(scooter_id)
            for scooter in self.scooters:
                if str(scooter.id) == target_id_str:
                    return scooter
        except Exception:
            pass

        return None

    def _apply_queued_admin_status_updates(self, current_time):
        """
        Apply all queued admin updates deterministically at the start of tick().
        """
        with self._admin_lock:
            updates = list(self._admin_updates)
            self._admin_updates.clear()

        if not updates:
            return

        last_by_scooter = {}
        for sid, status, ts in updates:
            last_by_scooter[sid] = (status, ts)

        critical_statuses = {"deactivated", "needService", "onService"}

        for sid, (new_status, ts) in last_by_scooter.items():
            scooter = self._find_scooter_by_id(sid)
            if not scooter:
                print(f"[Simulator] WARNING: Admin update for unknown scooter {sid}")
                continue

            old_status = scooter.status
            print(f"[Simulator] Applying admin status update: scooter {scooter.id} -> '{new_status}' (was '{old_status}')")

            # Guard: never allow forcing "available" while a rental is active (sim-owned or external).
            # Revert DB to the current (old) status to avoid DB/simulator divergence.
            if new_status == "available":
                sim_rental_active = self.rentals[scooter.id]["active"]
                ext_rental_active = self.external_rentals[scooter.id]["active"]
                if sim_rental_active or ext_rental_active:
                    print(
                        f"[Simulator] WARNING: Rejecting admin status 'available' for scooter {scooter.id} "
                        f"because rental is active (sim={sim_rental_active}, external={ext_rental_active}). "
                        f"Reverting DB to '{old_status}'."
                    )
                    self._update_bike_status_position_db_first(scooter, old_status)
                    continue

            # DB-first
            self._update_bike_status_position_db_first(scooter, new_status)

            # Apply locally
            scooter.status = new_status

            if new_status in critical_statuses:
                # Force-complete any active rental once, then lock permanently
                rental_state = self.rentals[scooter.id]
                if rental_state["active"]:
                    self._force_complete_active_rental_at_current_position(
                        scooter,
                        current_time,
                        end_zone="admin_forced"
                    )
                self._apply_admin_lock(scooter.id)
            else:
                if new_status == "available":
                    # Return it to normal simulation flow
                    # Clear all locking, battery/outofbounds logic will re-assert itself as it should
                    self.outofbounds_locked_scooters.discard(scooter.id)
                    self.battery_locked_scooters.discard(scooter.id)
                    self.pending_battery_lock.discard(scooter.id)

                    if scooter.id in self.deactivated_scooters:
                        self.deactivated_scooters.discard(scooter.id)
                        self.per_scooter_special_behavior[scooter.id] = None

                    # Reset charging tracking so next tick can re-sync cleanly.
                    self.last_db_charging_status.pop(scooter.id, None)

                self._remove_admin_lock(scooter.id)


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Apply queued rental lifecycle events (backend/app initiated rentals)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _apply_external_rental_events(self, current_time):
        """
        Apply queued rental lifecycle events deterministically at the start of tick().

        NOTE:
        Backend is still the owner of the creation/completion o external rentals.
        Simulator only enters/exits "external rental" mode in relation to the scooter and logged
        coords.
        """
        with self._rental_event_lock:
            events = list(self._rental_events)
            self._rental_events.clear()

        if not events:
            return

        last_by_scooter = {}
        for payload in events:
            sid = payload.get("scooter_id")
            last_by_scooter[sid] = payload

        for sid, payload in last_by_scooter.items():
            scooter = self._find_scooter_by_id(sid)
            if not scooter:
                print(f"[Simulator] WARNING: Rental event for unknown scooter {sid}: {payload}")
                continue

            event_type = payload.get("type")
            rental_id = payload.get("rental_id")

            if event_type == "rental_started":
                user_id = payload.get("user_id")
                user_name = payload.get("user_name")

                print(f"[Simulator] External rental started: scooter {scooter.id} rental {rental_id}")

                # Enter external rental mode
                self.external_rentals[scooter.id].update({
                    "active": True,
                    "rental_id": rental_id,
                    "user_id": user_id,
                    "user_name": user_name,
                })

                # Reflect active locally so frontend does not show "available" while external rental runs.

                # DB update is handled by backend.
                if scooter.status not in NON_RENTABLE_STATUSES and scooter.id not in self.deactivated_scooters:
                    scooter.status = "active"

                # Start fresh route logging for this rental
                self.rbroadcast.clear_coords(rental_id)
                self.rbroadcast.log_coord(rental_id, scooter.lat, scooter.lng, 0.0)

                # Movement: external rentals are sim-stationary by default - route-following is disabled below.)

            elif event_type == "rental_ended":
                # Exit external rental mode
                active = self.external_rentals[scooter.id].get("active")
                current_rental_id = self.external_rentals[scooter.id].get("rental_id")

                print(f"[Simulator] External rental ended: scooter {scooter.id} rental {rental_id}")

                if active and current_rental_id and current_rental_id != rental_id:
                    print(f"[Simulator] WARNING: External rental id mismatch on end: expected {current_rental_id} got {rental_id}")

                self.external_rentals[scooter.id].update({
                    "active": False,
                    "rental_id": None,
                    "user_id": None,
                    "user_name": None,
                })

                # If battery is low (or we deferred this during external rental), lock now
                if scooter.id in self.pending_battery_lock or scooter.battery < LOW_BATTERY_THRESHOLD:
                    self.pending_battery_lock.discard(scooter.id)
                    self._apply_battery_lock(scooter)
                    continue  # keep it non-rentable

                # If nothing else locks this scooter, return it to a rentable local state.
                if scooter.id not in self.deactivated_scooters and scooter.status not in NON_RENTABLE_STATUSES:
                    scooter.status = "available"

            else:
                print(f"[Simulator] Ignoring unknown rental event type: {event_type}")

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Generate a unique rental-ID (superfluous, but keeping for now)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _new_rental_id(self):
        """Generates a 10-character random rental ID."""
        return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(10))
    

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # "Back again"-logic: forward on even trips, reversed on odd (in practice, based on
    # completed trip counter's number, starting at 0)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def get_route_for_trip(self, scooter_id):
        trip_count = self.trip_counter[scooter_id]

        route_id = self.scooter_to_route.get(scooter_id)
        if route_id is None:
            return None

        base_route = self.routes.get(route_id)
        if not base_route:
            return None

        return base_route if trip_count % 2 == 0 else base_route[::-1]


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Main simulation ticker - manages the heartbeat(s) that drive the simulation of the fleet
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def tick(self):
        current_time = time.time()

        # Apply queued inputs deterministically at the start of the tick
        self._apply_queued_admin_status_updates(current_time)
        self._apply_external_rental_events(current_time)

        for scooter in self.scooters:
            scooter_id = scooter.id
            prev_lat, prev_lng = self.last_position[scooter_id]

            external_mode = self.external_rentals[scooter_id]["active"]
            external_rental_id = self.external_rentals[scooter_id]["rental_id"]


            # Battery logic for locking at sub-20%
            if scooter.battery < LOW_BATTERY_THRESHOLD and scooter.id not in self.deactivated_scooters:
                sim_rental_active = self.rentals[scooter.id]["active"]
                ext_rental_active = self.external_rentals[scooter.id]["active"]

                if sim_rental_active or ext_rental_active or scooter.status == "active":
                    # Allow ride to finish, but ensure it won't become rentable afterwards
                    self.pending_battery_lock.add(scooter.id)
                else:
                    # Not rented -> lock immediately
                    self._apply_battery_lock(scooter)

            # External rental mode:
            # - Do not move scooter along route
            # - Do not auto-start/auto-end rentals
            # - However: keep publishing scooter state
            # - keep logging coords under the external rental id
            if external_mode and external_rental_id:
                in_charging_zone = self._is_in_charging_zone(scooter)

                self._sync_charging_status_db_first(scooter, in_charging_zone)

                print(f"DEBUG EXTERNAL RENTAL: scooter {scooter.id} | rental_id={external_rental_id} | activity=active | current_status={scooter.status}")

                # Update physical state
                scooter.tick(
                    activity="active",
                    speed_kmh=0.0,
                    in_charging_zone=in_charging_zone,
                    elapsed_time=UPDATE_INTERVAL
                )

                # Log coordinates every tick under external rental
                self.rbroadcast.log_coord(
                    external_rental_id,
                    scooter.lat,
                    scooter.lng,
                    scooter.speed_kmh,
                )

                # Remember position for next tick
                self.last_position[scooter_id] = (scooter.lat, scooter.lng)

                # Publish state
                publish_payload = {
                    "id": scooter.id,
                    "lat": round(scooter.lat, 7),
                    "lng": round(scooter.lng, 7),
                    "bat": round(scooter.battery, 1),
                    "st": scooter.status,
                    "spd": scooter.speed_kmh,
                    "inChargingZone": in_charging_zone
                }
                scooter.rbroadcast.broadcast_state(publish_payload)
                continue


            # Only route-move when a sim-owned rental is active (standing still is default)
            current_route = None
            if self.rentals[scooter_id]["active"] and scooter_id in self.scooter_to_route:
                current_route = self.get_route_for_trip(scooter_id)


            # Resolve movement: special behavior wins, otherwise route-follow when present, else stand still
            movement_update = self._resolve_movement_for_scooter(scooter, current_route)

            # Apply new position first - critical for accurate zone detection this tick
            scooter.lat = movement_update["lat"]
            scooter.lng = movement_update["lng"]

            # Classify zone using the updates position
            current_zone = self.city.classify_zone(scooter.lat, scooter.lng)

            # OUT OF BOUNDS: Permanent deactivation - lock position permanently
            if current_zone == 'outofbounds':
                scooter.status = "deactivated"

                # Canonical status update should happen after first applying the lock
                if scooter.id not in self.outofbounds_locked_scooters:
                    self._update_bike_status_position_db_first(scooter, "deactivated")

                if scooter.id not in self.deactivated_scooters:
                    def permanent_lock(scooter, elapsed_time):
                        """Special override: scooter is out of bounds - deactivated, awaiting pickup."""
                        return {
                            "lat": scooter.lat,
                            "lng": scooter.lng,
                            "speed_kmh": 0.0,
                            "activity": "deactivated",
                            "route_finished": False
                        }

                    self.per_scooter_special_behavior[scooter.id] = permanent_lock
                    self.deactivated_scooters.add(scooter.id)
                    self.outofbounds_locked_scooters.add(scooter.id)

                    print(f"Scooter {scooter.id} permanently deactivated - out of bounds")

                    # Force-complete any active rental (sim-owned only)
                    rental_state = self.rentals[scooter.id]
                    if rental_state["active"]:
                        print(f"Forcing completion of active rental {rental_state['rental_id']} due to out-of-bounds")

                        self._complete_rental_and_publish(
                            scooter,
                            rental_state,
                            end_zone="outofbounds",
                            current_time=current_time
                        )

                        self._return_user_to_pool(rental_state)
                        self._reset_rental_state(rental_state)

                else:
                    # Ensure the out-of-bounds reason is recorded even if already locked by another reason.
                    self.outofbounds_locked_scooters.add(scooter.id)


            # Apply movement override for deactivated scooters
            if scooter.id in self.deactivated_scooters:
                movement_update = self.per_scooter_special_behavior[scooter.id](scooter, UPDATE_INTERVAL)

            # Speed limits for slow/parking/charging zones (DB-driven)
            intended_speed = movement_update["speed_kmh"]
            speed_limited_zones = ['slow', 'parking', 'charging']
            if current_zone in speed_limited_zones:
                db_limit = self.city.get_speed_limit(current_zone)
                max_allowed_kmh = db_limit if db_limit is not None else 5.0
                final_speed = min(intended_speed, max_allowed_kmh)
            else:
                final_speed = intended_speed

            # Slow zone: "reduced" status and activity for scooters (symbolized with red marker in map view)
            if current_zone == 'slow':
                scooter.status = "reduced"
                final_activity = "reduced"  # Red marker in frontend
            else:
                final_activity = movement_update.get("activity", "idle")

            movement_update["speed_kmh"] = final_speed

            # Charging detection
            in_charging_zone = self._is_in_charging_zone(scooter)

            self._sync_charging_status_db_first(scooter, in_charging_zone)

            # Update physical state
            scooter.tick(
                activity=final_activity,
                speed_kmh=movement_update["speed_kmh"],
                in_charging_zone=in_charging_zone,
                elapsed_time=UPDATE_INTERVAL
            )

            # Handle rental - safe fallback
            route_finished = movement_update.get("route_finished", False)
            self._handle_rental_tick(
                scooter=scooter,
                prev_lat=prev_lat,
                prev_lng=prev_lng,
                route_finished=route_finished,
                current_time=current_time
            )
            # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            # CUSTOM SCENARIOS
            # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  
             
            # Efficiently execute registered custom scenario for this scooter only
            scenario = self.custom_scooter_scenarios.get(scooter.id)
            if scenario:
                scenario(scooter, simulator=self)

            # Remember position for next tick
            self.last_position[scooter_id] = (scooter.lat, scooter.lng)

            # Publish with inChargingZone flag for immediate frontend visual feedback
            publish_payload = {
                "id": scooter.id,
                "lat": round(scooter.lat, 7),
                "lng": round(scooter.lng, 7),
                "bat": round(scooter.battery, 1),
                "st": scooter.status,
                "spd": scooter.speed_kmh,
                "inChargingZone": in_charging_zone
            }
            scooter.rbroadcast.broadcast_state(publish_payload)



    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Decide how a scooter should move this given tick
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~            
    def _resolve_movement_for_scooter(self, scooter, route):
        """
        Returns movement update for one tick.
        If a special behavior is active for this scooter → use it.
        Otherwise → normal route-following movement (when route is present).
        """
        scooter_id = scooter.id
        special_behavior = self.per_scooter_special_behavior.get(scooter_id)

        if special_behavior is not None:
            result = special_behavior(scooter, UPDATE_INTERVAL)
            if result is not None:
                return {
                    "lat": result.get("lat", scooter.lat),
                    "lng": result.get("lng", scooter.lng),
                    "speed_kmh": result.get("speed_kmh", 0.0),
                    "route_finished": result.get("route_finished", False),
                    "activity": result.get("activity", "idle")
                }

        # No route present === stand still by default
        if not route:
            return {
                "lat": scooter.lat,
                "lng": scooter.lng,
                "speed_kmh": 0.0,
                "activity": "idle",
                "route_finished": False
            }

        # Normal route movement
        return self.compute_update(scooter, route)
   

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental lifecycle logic - now persists to real DB via API
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _handle_rental_tick(self, scooter, prev_lat, prev_lng, route_finished, current_time):
        scooter_id = scooter.id
        rental_state = self.rentals[scooter_id]

        # If scooter is under external rental control, do not auto-start/auto-end rentals here.
        if self.external_rentals[scooter_id]["active"]:
            return

        # ~~~~~START RENTAL~~~~~
        if self.can_start_rental(scooter):
            rental_state["active"] = True
            rental_state["rental_id"] = self._new_rental_id()
            rental_state["start_zone"] = self.classify_zone_at_point(prev_lat, prev_lng)

            self._assign_user(rental_state)

            real_data = create_rental(
                customer_id=rental_state["user_id"],
                bike_id=scooter_id,
                start_point={"lat": float(scooter.lat), "lng": float(scooter.lng)},
                start_zone=rental_state["start_zone"],
            )

            real_id = real_data.get("rental_id") if isinstance(real_data, dict) else None
            if real_id:
                rental_state["rental_id"] = real_id

            # Canonical status update to active (only if rentable)
            if scooter.status not in NON_RENTABLE_STATUSES:
                self._update_bike_status_position_db_first(scooter, "active")

            self.rbroadcast.clear_coords(rental_state["rental_id"])
            # Log first coordinate with 0 speed (realistic start)
            self.rbroadcast.log_coord(
                rental_state["rental_id"],
                scooter.lat,
                scooter.lng,
                0.0  # Start from standstill
            )

        # ~~~~~LOG COORDINATES~~~~~
        if scooter.status == "active" and rental_state["active"] and rental_state["rental_id"]:
            self.rbroadcast.log_coord(
                rental_state["rental_id"],
                scooter.lat,
                scooter.lng,
                scooter.speed_kmh,
            )

        # ~~~~~END RENTAL~~~~~
        if not route_finished:
            return

        if not rental_state["active"]:
            return

        if not rental_state["rental_id"]:
            return

        rental_state["end_zone"] = self.classify_zone_at_point(scooter.lat, scooter.lng)

        self._complete_rental_and_publish(
            scooter,
            rental_state,
            end_zone=rental_state["end_zone"],
            current_time=current_time
        )

        self._return_user_to_pool(rental_state)
        self._finalize_trip(scooter, rental_state)


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental helpers
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _assign_user(self, rental_state):
        """
        Assign a user from the pool or fall back to a simulated user
        """
        if self.user_pool:
            user = random.choice(self.user_pool)
            self.user_pool.remove(user)
        else:
            user = {"user_id": 1, "user_name": "Simulated User"}

        rental_state["user_id"] = user["user_id"]
        rental_state["user_name"] = user["user_name"]


    def _publish_completed_rental(self, scooter, rental_state, current_time, coords):
        """
        Publish completed rental summary to Redis
        """
        self.rbroadcast.publish_completed({
            "type": "completed_rental",
            "rental_id": rental_state["rental_id"],
            "scooter_id": scooter.id,
            "coords": coords,
            "user_id": rental_state.get("user_id"),
            "user_name": rental_state.get("user_name"),
            "start_zone": rental_state.get("start_zone"),
            "end_zone": rental_state.get("end_zone"),
        })


    def _return_user_to_pool(self, rental_state):
        """
        Make user available for future simulated rentals
        """
        if rental_state.get("user_id") is not None:
            self.user_pool.append({
                "user_id": rental_state["user_id"],
                "user_name": rental_state["user_name"],
            })


    def _finalize_trip(self, scooter, rental_state):
        """
        Update trip count and end or continue simulation
        """
        scooter_id = scooter.id
        next_trip_count = self.trip_counter[scooter_id] + 1

        self.trip_counter[scooter_id] = next_trip_count
        self._reset_rental_state(rental_state)

        # If we dipped below threshold during the ride, lock now that rental is over
        if scooter.id in self.pending_battery_lock or scooter.battery < LOW_BATTERY_THRESHOLD:
            self.pending_battery_lock.discard(scooter.id)
            self._apply_battery_lock(scooter)

        in_charging = self._is_in_charging_zone(scooter)
        scooter.end_trip(in_charging_zone=in_charging)


    def _reset_rental_state(self, rental_state):
        """
        Clear per-rental state for next trip
        """
        rental_state.update({
            "active": False,
            "rental_id": None,
            "user_id": None,
            "user_name": None,
            "start_zone": "free",
            "end_zone": "free",
        })


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Normal route - next movement on tick
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def compute_update(self, scooter, route):
        """
        Calculates the scooter's next position, speed, and activity for this tick
        when following a normal route (no special behavior override).

        It:

        * Moves smoothly toward the next waypoint at constant max-speed on straights
        * Detects when a full route is finished (triggers rental end)
        * Applies realistic slowdown during turns

        This is the default, reasonably realistic movement every scooter uses
        unless a special per-scooter scenario overrides it.

        Uses some helpful boilerplate constructions, and the calculate_distance_in_m-function
        brought in from utils.py, for the calculations.
        """
        scooter_id = scooter.id
        route_state = self.next_waypoint_index[scooter_id]
        current_index = route_state["route_index"]
        target_point = route[current_index]

        distance_to_target = calculate_distance_in_m((scooter.lat, scooter.lng), target_point)
        max_distance_this_tick = NOMINAL_MAX_SPEED_MPS * UPDATE_INTERVAL

        if distance_to_target <= max_distance_this_tick:
            new_lat, new_lng = target_point
            route_state["route_index"] += 1
            route_finished = route_state["route_index"] >= len(route)
            if route_finished:
                route_state["route_index"] = 0
        else:
            fraction = max_distance_this_tick / distance_to_target
            new_lat = scooter.lat + (target_point[0] - scooter.lat) * fraction
            new_lng = scooter.lng + (target_point[1] - scooter.lng) * fraction
            route_finished = False

        distance_traveled_meters = calculate_distance_in_m((scooter.lat, scooter.lng), (new_lat, new_lng))
        raw_speed_kmh = distance_traveled_meters / UPDATE_INTERVAL * 3.6

        previous_travel_direction = self.last_travel_direction[scooter_id]
        current_travel_direction = math.atan2(new_lng - scooter.lng, new_lat - scooter.lat)

        if previous_travel_direction is not None:
            travel_direction_change = abs(current_travel_direction - previous_travel_direction)
            travel_direction_change = min(travel_direction_change, abs(math.pi * 2 - travel_direction_change))
            turn_slowdown = 1 - min(travel_direction_change / math.pi, 0.4)
            raw_speed_kmh *= turn_slowdown

        self.last_travel_direction[scooter_id] = current_travel_direction
        final_speed_kmh = round(raw_speed_kmh, 2)

        return {
            "lat": new_lat,
            "lng": new_lng,
            "speed_kmh": final_speed_kmh,
            "activity": "active" if final_speed_kmh > 0 else "idle",
            "route_finished": route_finished
        }


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Charging zone detection - now uses accurate polygon from City object
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _is_in_charging_zone(self, scooter):
        """
        Returns true if scooter is found to be in charging zone and not active.
        """
        if scooter.status == "active":
            return False
        return self.city.is_inside(scooter.lat, scooter.lng, 'charging')


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Geo-based zone-classification helper - now powered by City with real polygons
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def classify_zone_at_point(self, lat, lng):
        """
        Classifies a point using polygon priority:
        charging -> parking -> city (free) -> slow -> outofbounds
        """
        return self.city.classify_zone(lat, lng)
    

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Can start rental?-check
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def can_start_rental(self, scooter):
        """
        Determines if a scooter is eligible to start a new rental.
        """
        rental_state = self.rentals[scooter.id]

        # External rentals - simulator must never auto-start.
        if self.external_rentals[scooter.id]["active"]:
            return False

        # Already rented? Denied.
        if rental_state["active"]:
            return False

        # Route missing? Denied.
        if scooter.id not in self.scooter_to_route:
            return False

        # Battery <20%? Denied.
        if scooter.battery < LOW_BATTERY_THRESHOLD:
            return False

        # Status prevents rentals (deactivated, out of bounds, etc.)
        if scooter.status in NON_RENTABLE_STATUSES:
            return False

        # For misspellings/old names (to be removed)
        if scooter.status in ("needsCharging", "needsService"):
            return False

        return True
