### simulation_helper.py

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


# Config constants
BATCH_DELAY = 18  # seconds between batches

SPREAD_MODES = ['start', 'middle', 'end']

SCOOTERS_PER_ZONE = 10  # scooters per individual charging/parking-zone
ZONE_SCOOTER_MARGIN = 0.000030


def stationary_behavior(scooter, elapsed_time):
    """Override: fixed position, no movement, never finishes route."""
    return {
        "lat": scooter.lat,
        "lon": scooter.lon,
        "speed_kmh": 0.0,
        "route_finished": False,
        "activity": "idle"
    }


def add_first_route_batch(scooters, rbroadcast, ordered_routes, start_sid,
                          special_battery_route=3, special_battery_level=22):
    """
    Add the initial route-based batch with sequential SIDs (Scooter IDs) starting from start_sid.
    Returns the next available SID after this batch.
    """
    current_sid = start_sid

    for route_index, route_coords in ordered_routes:
        if len(route_coords) < 1:
            continue
        lat, lon = route_coords[0]
        battery_level = special_battery_level if route_index == special_battery_route else 100

        scooter = Scooter(
            sid=current_sid,
            lat=lat,
            lon=lon,
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
        polys = simulator.city.zones.get(zone_type, [])
        for poly in polys:
            cent = poly.centroid
            for _ in range(SCOOTERS_PER_ZONE):
                if current_sid > max_sid:
                    return current_sid, added
                lat = cent.y + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)
                lon = cent.x + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)

                scooter = Scooter(
                    sid=current_sid,
                    lat=lat,
                    lon=lon,
                    battery=100,
                    rbroadcast=simulator.rbroadcast
                )
                scooter.status = "available"

                scooters.append(scooter)

                simulator.scooter_to_route[current_sid] = dummy_route_id
                simulator.trip_counter[current_sid] = 0
                simulator.next_waypoint_index[current_sid] = {"route_index": 0}
                simulator.last_position[current_sid] = (lat, lon)
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


def run_incremental_batches(simulator, scooters, ordered_routes, next_sid, num_batches,
                          special_battery_route=3, special_battery_level=22):
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
                mode_idx = batches_started % 3
                mode = SPREAD_MODES[mode_idx]

                new_scooters = []
                state_list = []
                current_sid = next_sid

                for route_index, route_coords in ordered_routes:
                    if len(route_coords) < 1:
                        continue

                    battery_level = special_battery_level if route_index == special_battery_route else 100

                    if mode == 'start' or len(route_coords) < 2:
                        lat, lon = route_coords[0]
                        waypoint_idx = 0
                        trip_c = 0
                    elif mode == 'end':
                        lat, lon = route_coords[-1]
                        waypoint_idx = 0
                        trip_c = 1
                    else:
                        if len(route_coords) < 3:
                            lat, lon = route_coords[0]
                            waypoint_idx = 0
                            trip_c = 0
                        else:
                            mid_idx = len(route_coords) // 2
                            lat, lon = route_coords[mid_idx]
                            waypoint_idx = mid_idx + 1
                            waypoint_idx = min(waypoint_idx, len(route_coords) - 1)
                            trip_c = 0

                    scooter = Scooter(
                        sid=current_sid,
                        lat=lat,
                        lon=lon,
                        battery=battery_level,
                        rbroadcast=simulator.rbroadcast
                    )
                    new_scooters.append(scooter)
                    state_list.append((route_index, waypoint_idx, trip_c))
                    current_sid += 1

                scooters.extend(new_scooters)

                for s, (route_id, w_idx, t_c) in zip(new_scooters, state_list):
                    simulator.scooter_to_route[s.id] = route_id
                    simulator.trip_counter[s.id] = t_c
                    simulator.next_waypoint_index[s.id] = {"route_index": w_idx}
                    simulator.last_position[s.id] = (s.lat, s.lon)
                    simulator.last_travel_direction[s.id] = None
                    simulator.per_scooter_special_behavior[s.id] = None
                    simulator.rentals[s.id] = {
                        "rental_id": None, "start_ts": None, "user_id": None, "user_name": None,
                        "start_zone": "free", "end_zone": "free"
                    }
                    simulator.external_rentals[s.id] = {
                        "active": False, "rental_id": None, "user_id": None, "user_name": None, "start_ts": None
                    }

                next_sid = current_sid
                batches_started += 1
                next_batch_time += BATCH_DELAY
                print(f"Started batch {batches_started}/{num_batches} (mode: {mode}): now {len(scooters)} scooters active")

            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        print("Stopped.")