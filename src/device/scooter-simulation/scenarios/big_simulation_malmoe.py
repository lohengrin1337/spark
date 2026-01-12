"""
@module big_simulation_malmoe
"""

import time
from routes import MALMOE_ROUTES
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response
from behavior import (
    special_behavior_one,
    breakdown_after_seconds
)
from simulation_helper import (
    setup_city_simulation,
    add_stationary_scooters,
    run_incremental_batches,
    setup_simulator_listeners,
    BATCH_DELAY
)

NUM_BATCHES = 1  # Malmö specific


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()

    simulator, scooters, ordered_routes, next_sid = setup_city_simulation(
        city_name="Malmö",
        routes=MALMOE_ROUTES,
        start_sid=1,
        user_id_min=1,
        user_id_max=2000,
        user_pool_max=None,
        special_battery_level=22
    )

    # Apply route-based custom scenarios
    sid = 1
    for route_index, _ in ordered_routes:
        if route_index == 2:
            simulator.custom_scooter_scenarios[sid] = breakdown_after_seconds(seconds=20)
        if route_index == 3:
            simulator.custom_scooter_scenarios[sid] = special_behavior_one
        sid += 1

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

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
        special_battery_level=22,
        max_sid=1000
    )


if __name__ == "__main__":
    run()
