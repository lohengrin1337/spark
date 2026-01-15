"""
@module big_simulation_umea
"""


import time
from routes import UMEA_ROUTES
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
    special_behavior_one,
    park_in_nearest_charging_zone,
    breakdown_after_seconds
)
from simulation_helper import (
    setup_city_simulation,
    add_stationary_scooters,
    run_incremental_batches,
    setup_simulator_listeners,
    BATCH_DELAY
)

NUM_BATCHES = 4  # Umeå specific
SCOOTERS_PER_SPECIAL_ZONE = 12


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()

    simulator, scooters, ordered_routes, next_sid = setup_city_simulation(
        city_name="Umeå",
        routes=UMEA_ROUTES,
        start_sid=1001,
        user_id_min=2001,
        user_id_max=3000,
        user_pool_max=None,
        special_battery_level=22
    )

    # Apply hardcoded custom scenarios
    # simulator.custom_scooter_scenarios[1002] = park_in_nearest_charging_zone(required_trips=1)
    # simulator.custom_scooter_scenarios[1001] = special_behavior_one
    # simulator.custom_scooter_scenarios[1003] = breakdown_after_seconds(seconds=20)

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

    print(f"{len(scooters)} route-based scooters active in Umeå (first batch)")

    # Stationary in zones (continuing SIDs, max 1500)
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=1500,
        scooters_per_zone=SCOOTERS_PER_SPECIAL_ZONE
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Umeå")

    # Incremental batches
    run_incremental_batches(
        simulator=simulator,
        scooters=scooters,
        ordered_routes=ordered_routes,
        next_sid=next_sid,
        num_batches=NUM_BATCHES,
        special_battery_level=22,
        max_sid=1500
    )


if __name__ == "__main__":
    run()
