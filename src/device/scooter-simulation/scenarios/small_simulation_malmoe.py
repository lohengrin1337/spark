### big_simulation_malmoe.py

"""
@module big_simulation_malmoe
"""

import time
from city import City 
from simulator import Simulator
from routes import MALMOE_ROUTES
from redisbroadcast import ScooterBroadcaster
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response
from behavior import (
    special_behavior_one,
    breakdown_after_seconds
)
from admin_listener import AdminStatusListener
from rental_listener import RentalEventListener
from simulation_helper import (
    add_first_route_batch,
    add_stationary_scooters,
    run_incremental_batches,
    BATCH_DELAY
)

NUM_BATCHES = 1  # Malmö specific


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()
    
    rbroadcast = ScooterBroadcaster()
    scooters = []

    malmo_city = City.from_api("Malmö")
    print(f"Loaded zones: {list(malmo_city.zones.keys())} with speed limits: {malmo_city.speed_limits}")

    ordered_routes = list(MALMOE_ROUTES.items())

    # First route batch
    next_sid = add_first_route_batch(
        scooters=scooters,
        rbroadcast=rbroadcast,
        ordered_routes=ordered_routes,
        start_sid=1,
        special_battery_level=22
    )

    simulator = Simulator(
        scooters=scooters,
        routes=MALMOE_ROUTES,
        city=malmo_city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios={}
    )

    # Apply route-based custom scenarios
    sid = 1
    for route_index, _ in ordered_routes:
        if route_index == 2:
            simulator.custom_scooter_scenarios[sid] = breakdown_after_seconds(seconds=20)
        if route_index == 3:
            simulator.custom_scooter_scenarios[sid] = special_behavior_one
        sid += 1

    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)

    print(f"{len(scooters)} route-based scooters active in Malmö (first batch)")

    # Stationary in zones
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=1000
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Malmö")

    # Incremental batches
    run_incremental_batches(
        simulator=simulator,
        scooters=scooters,
        ordered_routes=ordered_routes,
        next_sid=next_sid,
        num_batches=NUM_BATCHES,
        special_battery_level=22
    )


if __name__ == "__main__":
    run()