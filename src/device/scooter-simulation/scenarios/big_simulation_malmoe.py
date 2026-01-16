"""
@module small_simulation_malmoe
"""

import time
from scenarios.routes.v1.routes import MALMOE_ROUTES
from scenarios.routes.v1.cache.route_waypoint_cache import ROUTE_WAYPOINT_CACHE_BY_CITY
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
    park_in_nearest_charging_zone,
    breakdown_after_seconds
)
from simulation_helper import (
    setup_city_simulation,
    load_route_assigned_scooters_in_batches,
    add_stationary_scooters,
    run_simulation_by_tick,
    setup_simulator_listeners
)

NUM_BATCHES = 6  # Malmö specific
SCOOTERS_PER_SPECIAL_ZONE = 24


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()

    simulator, scooters, ordered_routes, next_sid = setup_city_simulation(
        city_name="Malmö",
        routes=MALMOE_ROUTES,
        start_sid=1,
        user_id_min=1,
        user_id_max=2000,
        user_pool_max=None
    )

    # Apply hardcoded custom scenarios
    #simulator.custom_scooter_scenarios[1501] = park_in_nearest_charging_zone(required_trips=1)
    #simulator.custom_scooter_scenarios[1504] = breakdown_after_seconds(seconds=25)

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

    # Route-assigned scooters (spread batches)
    next_sid, _ = load_route_assigned_scooters_in_batches(
        simulator=simulator,
        scooters=scooters,
        ordered_routes=ordered_routes,
        next_sid=next_sid,
        num_batches=NUM_BATCHES,
        special_battery_level=21.8,
        max_sid=1000,
        route_waypoint_cache=ROUTE_WAYPOINT_CACHE_BY_CITY.get("Malmö")
    )

    print(f"{len(scooters)} route-based scooters active in Malmö (spread batches)")

    # Stationary in zones
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=1000,
        scooters_per_zone=SCOOTERS_PER_SPECIAL_ZONE
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Malmö")

    # Start and run the completed simulation scenario now constructed
    run_simulation_by_tick(simulator=simulator, scooters=scooters)


if __name__ == "__main__":
    run()
