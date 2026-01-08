### big_simulation_umea.py

"""
@module big_simulation_umea
"""


import time
from city import City 
from simulator import Simulator
from routes import UMEA_ROUTES
from redisbroadcast import ScooterBroadcaster
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
    special_behavior_one,
    park_in_nearest_charging_zone,
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

NUM_BATCHES = 5  # Umeå specific


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()
    
    rbroadcast = ScooterBroadcaster()
    scooters = []

    umea_city = City.from_api("Umeå")
    print(f"Loaded zones: {list(umea_city.zones.keys())} with speed limits: {umea_city.speed_limits}")

    ordered_routes = list(UMEA_ROUTES.items())

    # First route batch (SIDs 1001+)
    next_sid = add_first_route_batch(
        scooters=scooters,
        rbroadcast=rbroadcast,
        ordered_routes=ordered_routes,
        start_sid=1001,
        special_battery_level=22
    )

    simulator = Simulator(
        scooters=scooters,
        routes=UMEA_ROUTES,
        city=umea_city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios={}
    )

    # Apply hardcoded custom scenarios
    # simulator.custom_scooter_scenarios[1002] = park_in_nearest_charging_zone(required_trips=1)
    simulator.custom_scooter_scenarios[1001] = special_behavior_one
    simulator.custom_scooter_scenarios[1003] = breakdown_after_seconds(seconds=20)

    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)

    print(f"{len(scooters)} route-based scooters active in Umeå (first batch)")

    # Stationary in zones (continuing SIDs, max 1500)
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=1500
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Umeå")

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