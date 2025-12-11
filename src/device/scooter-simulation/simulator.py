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
from api import fetch_users
from utils import calculate_distance_in_m
from config import UPDATE_INTERVAL, NOMINAL_SPEED_MPS
from redisbroadcast import ScooterBroadcaster


class Simulator:
    """
    Simulator handles scooter movement along predefined routes, manages rentals, and is capable of
    injecting special scenarios.
    
    (The first one being a scooter stops after 2 trips and starts charging inside a designated charging zone).

    Each trip is treated as an independent rental. For the return-trip, the route
    coordinates are read backwards, so the scooter follows the exact same path in reverse.
    
    Routes are hardcoded at this point to ensure the scooter doesn't cut through buildings or
    obstacles.
    """

    def __init__(self, scooters, routes, charging_zones=None, rbroadcast: ScooterBroadcaster = None,
                 on_trip_completed=None):
        self.scooters = scooters
        self.routes = routes
        self.charging_zones = charging_zones or []
        self.rbroadcast = rbroadcast

        self.on_trip_completed = on_trip_completed

        # How many full trips has each scooter completed?
        self.trip_counter = {scooter.id: 0 for scooter in scooters}

        # Heading for this position in the route (index of the next waypoint)
        self.next_waypoint_index = {scooter.id: {"route_index": 0} for scooter in scooters}

        # Last known position (used for smoothing out transitions in speed)
        self.last_position = {scooter.id: (scooter.lat, scooter.lon) for scooter in scooters}

        # Last travel_direction (for realistic slowdown in turns)
        self.last_travel_direction = {scooter.id: None for scooter in scooters}

        # Scooter special behaviours:

        # Custom movement override per scooter (replaces route-following entirely when set)
        self.per_scooter_special_behavior = {scooter.id: None for scooter in scooters}

        # Current rental state per scooter
        self.rentals = {
            scooter.id: {
                "rental_id": None,
                "start_ts": None,
                "user_id": None,
                "user_name": None,
            }
            for scooter in scooters
        }

        # User pool - has now been supplanted by actual db-fetched users
        # (Generic JohnDoe-generated users are used as fallback if API fails)
        self.user_pool = fetch_users()

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Generate a unique rental-ID
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
        base_route = self.routes[scooter_id]
        return base_route if trip_count % 2 == 0 else base_route[::-1]


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Main simulation ticker - manages the heartbeat(s) that drive the simulation of the fleet
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def tick(self):
        current_time = time.time()

        for scooter in self.scooters:
            scooter_id = scooter.id
            prev_lat, prev_lon = self.last_position[scooter_id]
            current_route = self.get_route_for_trip(scooter_id)

            # Resolve movement: special behavior wins, otherwise follow route
            movement_update = self._resolve_movement_for_scooter(scooter, current_route)

            # Apply new position
            scooter.lat = movement_update["lat"]
            scooter.lon = movement_update["lon"]

            # Update physical state: battery, status, charging detection
            in_charging_zone = self._is_in_charging_zone(scooter)
            scooter.tick(
                activity=movement_update["activity"],
                speed_kmh=movement_update["speed_kmh"],
                in_charging_zone=in_charging_zone,
                elapsed_time=UPDATE_INTERVAL
            )

            # Handle rental start/end and trip completion
            self._handle_rental_tick(
                scooter, prev_lat, prev_lon,
                {"route_finished": movement_update.get("route_finished", False)},
                current_time
            )

            # Remember position for next tick (smooth out speed)
            self.last_position[scooter_id] = (scooter.lat, scooter.lon)

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
                    "activity": result.get("activity", "idle"),
                    "route_finished": result.get("route_finished", False),
                }

        # Normal route movement
        return self.compute_update(scooter, route)

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental lifecycle logic
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    
    def _handle_rental_tick(self, scooter, prev_lat, prev_lon, update, current_time):
        scooter_id = scooter.id
        rental_state = self.rentals[scooter_id]

        # Start a new rental
        if scooter.status == "active" and rental_state["rental_id"] is None:
            rental_state["rental_id"] = self._new_rental_id()
            rental_state["start_ts"] = current_time

            if self.user_pool:
                user = random.choice(self.user_pool)
                rental_state["user_id"] = user["user_id"]
                rental_state["user_name"] = user["user_name"]
                self.user_pool.remove(user)
            else:
                rental_state["user_id"] = None
                rental_state["user_name"] = None

            self.rbroadcast.clear_coords(rental_state["rental_id"])
            self.rbroadcast.log_coord(rental_state["rental_id"], scooter.lat, scooter.lon, scooter.speed_kmh)

        # Log position during active rental
        if rental_state["rental_id"] is not None and scooter.status == "active":
            self.rbroadcast.log_coord(rental_state["rental_id"], scooter.lat, scooter.lon, scooter.speed_kmh)

        # End rental when route is finished
        if update.get("route_finished", False):
            rental_id = rental_state["rental_id"]
            if rental_id:
                duration_seconds = int(current_time - rental_state["start_ts"])
                path_coordinates = self.rbroadcast.load_coords(rental_id)

                completed_rental = {
                    "type": "completed_rental",
                    "rental_id": rental_id,
                    "scooter_id": scooter_id,
                    "duration_s": duration_seconds,
                    "coords": path_coordinates,
                    "user_id": rental_state.get("user_id"),
                    "user_name": rental_state.get("user_name"),
                }
                self.rbroadcast.publish_completed(completed_rental)

                if rental_state.get("user_id") is not None:
                    self.user_pool.append({
                        "user_id": rental_state["user_id"],
                        "user_name": rental_state["user_name"]
                    })

            # Let scenario take over after trip ends (e.g. charge scooter indefinitely) - if it returns True,
            next_trip_count = self.trip_counter[scooter_id] + 1
            if self.on_trip_completed and self.on_trip_completed(scooter, next_trip_count, self):
                self.trip_counter[scooter_id] = next_trip_count
                rental_state["rental_id"] = rental_state["start_ts"] = rental_state["user_id"] = rental_state["user_name"] = None
                return

            # ...otherwise a normal scooter trip ending ensues
            self.trip_counter[scooter_id] = next_trip_count
            rental_state["rental_id"] = None
            rental_state["start_ts"] = None
            rental_state["user_id"] = None
            rental_state["user_name"] = None
            scooter.end_trip()


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Normal route - next movement on tick
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def compute_update(self, scooter, route):
        """
        Calculates the scooter's next position, speed, and activity for this tick
        when following a normal route (no special behavior override).

        It:

        * Moves smoothly toward the next waypoint at constant speed
        * Detects when a full route is finished (triggers rental end)
        * Applies realistic slowdown during sharp turns

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
        max_distance_this_tick = NOMINAL_SPEED_MPS * UPDATE_INTERVAL

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
    # Charging zone detection
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def _is_in_charging_zone(self, scooter):
        """
        Returns true if scooter is found to be in charging zone and not active.
        """
        if scooter.status == "active":
            return False
        for charging_zone_lat, charging_zone_lon, radius in self.charging_zones:
            if calculate_distance_in_m((scooter.lat, scooter.lon), (charging_zone_lat, charging_zone_lon)) <= radius:
                return True
        return False