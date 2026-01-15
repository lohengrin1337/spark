"""
@module medium_simulation_malmoe
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

NUM_BATCHES = 3  # Malmö specific
SCOOTERS_PER_SPECIAL_ZONE = 10


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

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

    print(f"{len(scooters)} route-based scooters active in Malmö (first batch)")

    # Stationary in zones
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=1000,
        scooters_per_zone=SCOOTERS_PER_SPECIAL_ZONE
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
