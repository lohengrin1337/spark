"""
@module small_simulation_karlskrona
"""

import time
from routes import KARLSKRONA_ROUTES
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
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

NUM_BATCHES = 1  # Karlskrona specific
SCOOTERS_PER_SPECIAL_ZONE = 5


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()

    simulator, scooters, ordered_routes, next_sid = setup_city_simulation(
        city_name="Karlskrona",
        routes=KARLSKRONA_ROUTES,
        start_sid=1501,
        user_id_min=3001,
        user_id_max=4000,
        user_pool_max=None,
        special_battery_level=19.8
    )

    # Apply hardcoded custom scenarios
    #simulator.custom_scooter_scenarios[1501] = park_in_nearest_charging_zone(required_trips=1)
    #simulator.custom_scooter_scenarios[1504] = breakdown_after_seconds(seconds=25)

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

    print(f"{len(scooters)} route-based scooters active in Karlskrona (first batch)")

    # Stationary in zones
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=2000,
        scooters_per_zone=SCOOTERS_PER_SPECIAL_ZONE
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Karlskrona")

    # Incremental batches
    run_incremental_batches(
        simulator=simulator,
        scooters=scooters,
        ordered_routes=ordered_routes,
        next_sid=next_sid,
        num_batches=NUM_BATCHES,
        special_battery_level=19.8,
        max_sid=2000
    )


if __name__ == "__main__":
    run()
