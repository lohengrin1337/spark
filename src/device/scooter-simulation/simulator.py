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
from api import fetch_users, create_rental, complete_rental, update_bike_status
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
        self.last_position = {scooter.id: (scooter.lat, scooter.lon) for scooter in scooters}

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

        # Current rental state per scooter
        self.rentals = {
            scooter.id: {
                "rental_id": None,
                "start_ts": None,
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
                "start_ts": None,
            }
            for scooter in scooters
        }

        # User pool - has now been supplanted by actual db-fetched users
        # (Generic JohnDoe-generated users are used as fallback if API fails)
        self.user_pool = fetch_users()

        # Admin status updates arrive from a background thread.
        # To keep the simulator deterministic and avoid race conditions.  Queue them
        # and then apply them at the start of each tick().
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
    def _update_bike_status_db_first(self, scooter_id, new_status):
        """
        Best-effort canonical status update.
        Ensures DB is updated before applying locally.
        """
        try:
            success = update_bike_status(scooter_id, new_status)
            if success:
                print(f"[Simulator] Status updated: scooter {scooter_id} -> '{new_status}'")
            else:
                print(f"[Simulator] WARNING: Status update failed: scooter {scooter_id} -> '{new_status}'")
        except Exception as e:
            print(f"[Simulator] WARNING: Status update threw: scooter {scooter_id} -> '{new_status}' | {e}")



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
                    "lon": scooter.lon,
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

    def _force_complete_active_rental_at_current_position(self, scooter, current_time, end_zone="admin_forced"):
        """
        Force-completes any active rental at the current position.
        """
        rental_state = self.rentals[scooter.id]
        if rental_state["rental_id"] is None:
            return

        print(f"Forcing completion of active rental {rental_state['rental_id']} due to admin UI-event.")

        rental_state["end_zone"] = end_zone
        path_coordinates = self.rbroadcast.load_coords(rental_state["rental_id"])

        if path_coordinates:
            path_coordinates[-1]["spd"] = 0.0

        complete_rental(
            rental_id=rental_state["rental_id"],
            end_point={"lat": float(scooter.lat), "lon": float(scooter.lon)},
            end_zone=end_zone,
            route=path_coordinates,
        )

        self._publish_completed_rental(
            scooter,
            rental_state,
            current_time,
            path_coordinates,
        )

        self._return_user_to_pool(rental_state)
        self._reset_rental_state(rental_state)

    def _find_scooter_by_id(self, scooter_id):
        """
        Scooter finder by id.
        """
        for s in self.scooters:
            if s.id == scooter_id:
                return s
        try:
            sid_int = int(scooter_id)
            for s in self.scooters:
                if s.id == sid_int:
                    return s
        except Exception:
            pass
        try:
            sid_str = str(scooter_id)
            for s in self.scooters:
                if str(s.id) == sid_str:
                    return s
        except Exception:
            pass
        return None

    def _drain_and_apply_admin_updates(self, current_time):
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

        critical_statuses = {"deactivated", "needService"}

        for sid, (new_status, ts) in last_by_scooter.items():
            scooter = self._find_scooter_by_id(sid)
            if not scooter:
                print(f"[Simulator] WARNING: Admin update for unknown scooter {sid}")
                continue

            old_status = scooter.status
            print(f"[Simulator] Applying admin status update: scooter {scooter.id} -> '{new_status}' (was '{old_status}')")

            # DB-first
            self._update_bike_status_db_first(scooter.id, new_status)

            # Apply locally
            scooter.status = new_status

            if new_status in critical_statuses:
                # Force-complete any active rental once, then lock permanently
                rental_state = self.rentals[scooter.id]
                if rental_state["rental_id"] is not None:
                    self._force_complete_active_rental_at_current_position(
                        scooter,
                        current_time,
                        end_zone="admin_forced"
                    )
                self._apply_admin_lock(scooter.id)
            else:
                self._remove_admin_lock(scooter.id)

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Apply queued rental lifecycle events (backend/app initiated rentals)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _drain_and_apply_rental_events(self, current_time):
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
                    "start_ts": current_time,
                })

                # Reflect active locally so frontend does not show "available" while external rental runs.

                # DB update is handled by backend.
                if scooter.status not in NON_RENTABLE_STATUSES and scooter.id not in self.deactivated_scooters:
                    scooter.status = "active"

                # Mirror rental id locally for logging only (do NOT call create_rental here)
                rental_state = self.rentals[scooter.id]
                rental_state["rental_id"] = rental_id
                rental_state["start_ts"] = current_time
                rental_state["user_id"] = user_id
                rental_state["user_name"] = user_name
                rental_state["start_zone"] = self.classify_zone_at_point(scooter.lat, scooter.lon)
                rental_state["end_zone"] = "free"

                # Start fresh route logging for this rental
                self.rbroadcast.clear_coords(rental_id)
                self.rbroadcast.log_coord(rental_id, scooter.lat, scooter.lon, 0.0)

                # Movement: external rentals are stationary by default - route-following is disabled below.)

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
                    "start_ts": None,
                })

                # Clear simulator-local rental state - backend already completed it canonically.
                self._reset_rental_state(self.rentals[scooter.id])

                # If nothing else locks this scooter, return it to a rentable local state.
                # Actual determinative db-state remains backend-owned.
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

        route_id = self.scooter_to_route[scooter_id]
        base_route = self.routes[route_id]

        return base_route if trip_count % 2 == 0 else base_route[::-1]

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Main simulation ticker - manages the heartbeat(s) that drive the simulation of the fleet
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def tick(self):
        current_time = time.time()

        # Apply queued inputs deterministically at the start of the tick
        self._drain_and_apply_admin_updates(current_time)
        self._drain_and_apply_rental_events(current_time)

        for scooter in self.scooters:
            scooter_id = scooter.id
            prev_lat, prev_lon = self.last_position[scooter_id]
            current_route = self.get_route_for_trip(scooter_id)

            external_mode = self.external_rentals[scooter_id]["active"]
            external_rental_id = self.external_rentals[scooter_id]["rental_id"]


            # Battery logic for locking at sub-20%. External rentals can still run while scooter is stationary.
            if scooter.battery < LOW_BATTERY_THRESHOLD and scooter.id not in self.deactivated_scooters:
                def lock_due_to_low_battery(scooter, elapsed_time):
                    return {
                        "lat": scooter.lat,
                        "lon": scooter.lon,
                        "speed_kmh": 0.0,
                        "route_finished": False,
                        "activity": "needCharging"
                    }

                self.per_scooter_special_behavior[scooter.id] = lock_due_to_low_battery
                self.deactivated_scooters.add(scooter.id)
                self.battery_locked_scooters.add(scooter.id)
                scooter.status = "needCharging"
                print(f"DEBUG: Scooter {scooter.id} locked due to low battery ({scooter.battery}%)")

            # External rental mode:
            # - Do not move scooter along route
            # - Do not auto-start/auto-end rentals
            # - However: keep publishing scooter state
            # - keep logging coords under the external rental id
            if external_mode and external_rental_id:
                movement_update = {
                    "lat": scooter.lat,
                    "lon": scooter.lon,
                    "speed_kmh": 0.0,
                    "activity": "active",  # Rental is active externally; keep activity consistent
                    "route_finished": False
                }

                # Zone classification (still useful for UI)
                current_zone = self.city.classify_zone(scooter.lat, scooter.lon)

                # Speed limits irrelevant here (stationary), but keep the structure intact
                movement_update["speed_kmh"] = 0.0

                # Charging detection
                in_charging_zone = self._is_in_charging_zone(scooter)

                print(f"DEBUG EXTERNAL RENTAL: scooter {scooter.id} | rental_id={external_rental_id} | activity=active | current_status={scooter.status}")

                # Update physical state (battery drain may still apply depending on Scooter.tick implementation)
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
                    scooter.lon,
                    scooter.speed_kmh,
                )

                # Remember position for next tick
                self.last_position[scooter_id] = (scooter.lat, scooter.lon)

                # Publish state
                publish_payload = {
                    "id": scooter.id,
                    "lat": round(scooter.lat, 7),
                    "lon": round(scooter.lon, 7),
                    "bat": round(scooter.battery, 1),
                    "st": scooter.status,
                    "spd": scooter.speed_kmh,
                    "inChargingZone": in_charging_zone
                }
                scooter.rbroadcast.broadcast_state(publish_payload)
                continue

            # Resolve movement: special behavior wins, otherwise follow route
            movement_update = self._resolve_movement_for_scooter(scooter, current_route)

            # Apply new position FIRST - critical for accurate zone detection this tick
            new_lat = movement_update["lat"]
            new_lon = movement_update["lon"]
            scooter.lat = new_lat
            scooter.lon = new_lon

            # Classify zone using the UPDATED position
            current_zone = self.city.classify_zone(scooter.lat, scooter.lon)

            # OUT OF BOUNDS: Permanent deactivation - lock position permanently
            if current_zone == 'outofbounds':
                scooter.status = "deactivated"

                # Canonical status update should happen once when we first apply the lock.
                if scooter.id not in self.outofbounds_locked_scooters:
                    self._update_bike_status_db_first(scooter_id, "deactivated")

                if scooter.id not in self.deactivated_scooters:
                    def permanent_lock(scooter, elapsed_time):
                        """Special override: scooter is out of bounds - deactivated, awaiting pickup."""
                        return {
                            "lat": scooter.lat,
                            "lon": scooter.lon,
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
                    if rental_state["rental_id"] is not None:
                        print(f"Forcing completion of active rental {rental_state['rental_id']} due to out-of-bounds")

                        rental_state["end_zone"] = "outofbounds"
                        path_coordinates = self.rbroadcast.load_coords(rental_state["rental_id"])

                        complete_rental(
                            rental_id=rental_state["rental_id"],
                            end_point={"lat": float(scooter.lat), "lon": float(scooter.lon)},
                            end_zone="outofbounds",
                            route=path_coordinates,
                        )

                        self._publish_completed_rental(
                            scooter,
                            rental_state,
                            current_time,
                            path_coordinates,
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

            print(f"DEBUG CHARGING: scooter {scooter.id} | in_charging_zone={in_charging_zone} | activity={final_activity} | current_status={scooter.status}")

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
                prev_lon=prev_lon,
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
            self.last_position[scooter_id] = (scooter.lat, scooter.lon)

            # Publish with inChargingZone flag for immediate frontend visual feedback
            publish_payload = {
                "id": scooter.id,
                "lat": round(scooter.lat, 7),
                "lon": round(scooter.lon, 7),
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
        Otherwise → normal route-following movement.
        """
        scooter_id = scooter.id
        special_behavior = self.per_scooter_special_behavior.get(scooter_id)

        if special_behavior is not None:
            result = special_behavior(scooter, UPDATE_INTERVAL)
            if result is not None:
                return {
                    "lat": result.get("lat", scooter.lat),
                    "lon": result.get("lon", scooter.lon),
                    "speed_kmh": result.get("speed_kmh", 0.0),
                    "route_finished": result.get("route_finished", False),
                }

        # Normal route movement
        return self.compute_update(scooter, route)
   
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental lifecycle logic - now persists to real DB via API
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _handle_rental_tick(self, scooter, prev_lat, prev_lon, route_finished, current_time):
        scooter_id = scooter.id
        rental_state = self.rentals[scooter_id]

        # If scooter is under external rental control, do not auto-start/auto-end rentals here.
        if self.external_rentals[scooter_id]["active"]:
            return

        # ___ START RENTAL ___
        if self.can_start_rental(scooter):
            rental_state["rental_id"] = self._new_rental_id()
            rental_state["start_ts"] = current_time
            rental_state["start_zone"] = self.classify_zone_at_point(prev_lat, prev_lon)

            self._assign_user(rental_state)

            real_data = create_rental(
                customer_id=rental_state["user_id"],
                bike_id=scooter_id,
                start_point={"lat": float(scooter.lat), "lon": float(scooter.lon)},
                start_zone=rental_state["start_zone"],
            )

            real_id = real_data.get("rental_id") if isinstance(real_data, dict) else None
            if real_id:
                rental_state["rental_id"] = real_id

            # Canonical status update to active (only if rentable)
            if scooter.status not in NON_RENTABLE_STATUSES:
                self._update_bike_status_db_first(scooter_id, "active")

            self.rbroadcast.clear_coords(rental_state["rental_id"])
            # Log first coordinate with 0 speed (realistic start)
            self.rbroadcast.log_coord(
                rental_state["rental_id"],
                scooter.lat,
                scooter.lon,
                0.0  # Start from standstill
            )

        # ___ LOG COORDINATES ___
        if scooter.status == "active" and rental_state["rental_id"]:
            self.rbroadcast.log_coord(
                rental_state["rental_id"],
                scooter.lat,
                scooter.lon,
                scooter.speed_kmh,
            )

        # ___ END RENTAL ___
        if not route_finished:
            return

        rental_id = rental_state["rental_id"]
        if not rental_id:
            return

        rental_state["end_zone"] = self.classify_zone_at_point(scooter.lat, scooter.lon)
        path_coordinates = self.rbroadcast.load_coords(rental_id)

        # Ensure last coordinate has 0 speed (realistic stop)
        if path_coordinates:
            path_coordinates[-1]["spd"] = 0.0

        complete_rental(
            rental_id=rental_id,
            end_point={"lat": float(scooter.lat), "lon": float(scooter.lon)},
            end_zone=rental_state["end_zone"],
            route=path_coordinates,
        )

        self._publish_completed_rental(
            scooter,
            rental_state,
            current_time,
            path_coordinates,
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
        duration_seconds = int(current_time - rental_state["start_ts"])

        self.rbroadcast.publish_completed({
            "type": "completed_rental",
            "rental_id": rental_state["rental_id"],
            "scooter_id": scooter.id,
            "duration_s": duration_seconds,
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
        in_charging = self._is_in_charging_zone(scooter)
        scooter.end_trip(in_charging_zone=in_charging)


    def _reset_rental_state(self, rental_state):
        """
        Clear per-rental state for next trip
        """
        rental_state.update({
            "rental_id": None,
            "start_ts": None,
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

        distance_to_target = calculate_distance_in_m((scooter.lat, scooter.lon), target_point)
        max_distance_this_tick = NOMINAL_MAX_SPEED_MPS * UPDATE_INTERVAL

        if distance_to_target <= max_distance_this_tick:
            new_lat, new_lon = target_point
            route_state["route_index"] += 1
            route_finished = route_state["route_index"] >= len(route)
            if route_finished:
                route_state["route_index"] = 0
        else:
            fraction = max_distance_this_tick / distance_to_target
            new_lat = scooter.lat + (target_point[0] - scooter.lat) * fraction
            new_lon = scooter.lon + (target_point[1] - scooter.lon) * fraction
            route_finished = False

        distance_traveled_meters = calculate_distance_in_m((scooter.lat, scooter.lon), (new_lat, new_lon))
        raw_speed_kmh = distance_traveled_meters / UPDATE_INTERVAL * 3.6

        previous_travel_direction = self.last_travel_direction[scooter_id]
        current_travel_direction = math.atan2(new_lon - scooter.lon, new_lat - scooter.lat)

        if previous_travel_direction is not None:
            travel_direction_change = abs(current_travel_direction - previous_travel_direction)
            travel_direction_change = min(travel_direction_change, abs(math.pi * 2 - travel_direction_change))
            turn_slowdown = 1 - min(travel_direction_change / math.pi, 0.4)
            raw_speed_kmh *= turn_slowdown

        self.last_travel_direction[scooter_id] = current_travel_direction
        final_speed_kmh = round(raw_speed_kmh, 2)

        return {
            "lat": new_lat,
            "lon": new_lon,
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
        return self.city.is_inside(scooter.lat, scooter.lon, 'charging')


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Geo-based zone-classification helper - now powered by City with real polygons
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def classify_zone_at_point(self, lat, lon):
        """
        Classifies a point using polygon priority:
        charging -> parking -> city (free) -> slow -> outofbounds
        """
        return self.city.classify_zone(lat, lon)
    
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
        if rental_state["rental_id"] is not None:
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
