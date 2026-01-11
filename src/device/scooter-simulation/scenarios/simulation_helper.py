"""
@module simulation_helper

Shared helper functions for the city simulation scripts.

Provides modular, DRY logic for:
- Adding the first route-based batch
- Adding stationary scooters in parking/charging zones
- Running the insert batch loop

Configurable constants for easy tuning.
"""

import time
import random
from scooter import Scooter
from config import UPDATE_INTERVAL

from admin_listener import AdminStatusListener
from rental_listener import RentalEventListener


# Config constants
BATCH_DELAY = 18  # seconds between batches

SPREAD_MODES = ['start', 'middle', 'end']

SCOOTERS_PER_ZONE = 10  # scooters per individual charging/parking-zone
ZONE_SCOOTER_MARGIN = 0.000030


def setup_simulator_listeners(simulator):
    """
    Create and return the standard listeners for a simulator instance.
    Extracted to reduce duplication across city simulation scripts.
    """
    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)
    return admin_listener, rental_listener


def stationary_behavior(scooter, elapsed_time):
    """Override: fixed position, no movement, never finishes route."""
    return {
        "lat": scooter.lat,
        "lng": scooter.lng,
        "speed_kmh": 0.0,
        "route_finished": False,
        "activity": "idle"
    }


def add_first_route_batch(
    scooters,
    rbroadcast,
    ordered_routes,
    start_sid,
    special_battery_route=3,
    special_battery_level=22
):
    """
    Add the initial route-based batch with sequential SIDs (Scooter IDs) starting from start_sid.
    Returns the next available SID after this batch.
    """
    current_sid = start_sid

    for route_index, route_coordinates in ordered_routes:
        if len(route_coordinates) < 1:
            continue

        start_latitude, start_longitude = route_coordinates[0]
        battery_level = special_battery_level if route_index == special_battery_route else 100

        scooter = Scooter(
            sid=current_sid,
            lat=start_latitude,
            lng=start_longitude,
            battery=battery_level,
            rbroadcast=rbroadcast
        )
        scooters.append(scooter)
        current_sid += 1

    return current_sid


def add_stationary_scooters(scooters, simulator, current_sid, max_sid):
    """
    Add stationary scooters in parking/charging zones in tight clustering.
    Returns (new_current_sid, added_count)
    """
    random.seed(42)
    dummy_route_id = max(simulator.routes.keys(), default=0) + 1
    simulator.routes[dummy_route_id] = [(0.0, 0.0)]

    added = 0
    for zone_type in ['parking', 'charging']:
        zone_polygons = simulator.city.zones.get(zone_type, [])
        for zone_polygon in zone_polygons:
            zone_centroid = zone_polygon.centroid
            for _ in range(SCOOTERS_PER_ZONE):
                if current_sid > max_sid:
                    return current_sid, added

                latitude = zone_centroid.y + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)
                longitude = zone_centroid.x + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)

                scooter = Scooter(
                    sid=current_sid,
                    lat=latitude,
                    lng=longitude,
                    battery=100,
                    rbroadcast=simulator.rbroadcast
                )
                scooter.status = "available"

                scooters.append(scooter)

                simulator.scooter_to_route[current_sid] = dummy_route_id
                simulator.trip_counter[current_sid] = 0
                simulator.next_waypoint_index[current_sid] = {"route_index": 0}
                simulator.last_position[current_sid] = (latitude, longitude)
                simulator.last_travel_direction[current_sid] = None
                simulator.per_scooter_special_behavior[current_sid] = stationary_behavior
                simulator.rentals[current_sid] = {
                    "rental_id": "dummy_stationary",
                    "start_ts": None,
                    "user_id": None,
                    "user_name": None,
                    "start_zone": "free",
                    "end_zone": "free",
                }
                simulator.external_rentals[current_sid] = {
                    "active": False,
                    "rental_id": None,
                    "user_id": None,
                    "user_name": None,
                    "start_ts": None,
                }

                added += 1
                current_sid += 1

    return current_sid, added


def run_incremental_batches(
    simulator,
    scooters,
    ordered_routes,
    next_sid,
    num_batches,
    special_battery_route=3,
    special_battery_level=22
):
    """
    Main loop with incremental batch addition.
    """
    batches_started = 1
    next_batch_time = time.time() + BATCH_DELAY

    try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()

            if batches_started < num_batches and time.time() >= next_batch_time:
                spread_mode_index = batches_started % 3
                spread_mode = SPREAD_MODES[spread_mode_index]

                new_scooters = []
                scooter_initialization_state = []
                current_sid = next_sid

                for route_index, route_coordinates in ordered_routes:
                    if len(route_coordinates) < 1:
                        continue

                    battery_level = special_battery_level if route_index == special_battery_route else 100

                    if spread_mode == 'start' or len(route_coordinates) < 2:
                        latitude, longitude = route_coordinates[0]
                        waypoint_index = 0
                        trip_counter_value = 0
                    elif spread_mode == 'end':
                        latitude, longitude = route_coordinates[-1]
                        waypoint_index = 0
                        trip_counter_value = 1
                    else:
                        middle_index = len(route_coordinates) // 2
                        if len(route_coordinates) < 3:
                            latitude, longitude = route_coordinates[0]
                            waypoint_index = 0
                            trip_counter_value = 0
                        else:
                            latitude, longitude = route_coordinates[middle_index]
                            waypoint_index = middle_index + 1
                            waypoint_index = min(waypoint_index, len(route_coordinates) - 1)
                            trip_counter_value = 0

                    scooter = Scooter(
                        sid=current_sid,
                        lat=latitude,
                        lng=longitude,
                        battery=battery_level,
                        rbroadcast=simulator.rbroadcast
                    )
                    new_scooters.append(scooter)
                    scooter_initialization_state.append((route_index, waypoint_index, trip_counter_value))
                    current_sid += 1

                scooters.extend(new_scooters)

                for scooter, (route_id, waypoint_index, trip_counter_value) in zip(
                    new_scooters, scooter_initialization_state
                ):
                    simulator.scooter_to_route[scooter.id] = route_id
                    simulator.trip_counter[scooter.id] = trip_counter_value
                    simulator.next_waypoint_index[scooter.id] = {"route_index": waypoint_index}
                    simulator.last_position[scooter.id] = (scooter.lat, scooter.lng)
                    simulator.last_travel_direction[scooter.id] = None
                    simulator.per_scooter_special_behavior[scooter.id] = None
                    simulator.rentals[scooter.id] = {
                        "rental_id": None, "start_ts": None, "user_id": None, "user_name": None,
                        "start_zone": "free", "end_zone": "free"
                    }
                    simulator.external_rentals[scooter.id] = {
                        "active": False, "rental_id": None, "user_id": None, "user_name": None, "start_ts": None
                    }

                next_sid = current_sid
                batches_started += 1
                next_batch_time += BATCH_DELAY
                print(
                    f"Started batch {batches_started}/{num_batches} (mode: {spread_mode}): "
                    f"now {len(scooters)} scooters active"
                )

            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        print("Stopped.")
