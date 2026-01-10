### big_simulation_karlskrona

"""
@module big_simulation_karlskrona
"""

import time
from city import City 
from simulator import Simulator
from routes import KARLSKRONA_ROUTES
from redisbroadcast import ScooterBroadcaster
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
    park_in_nearest_charging_zone,
    breakdown_after_seconds
)

from admin_listener import AdminStatusListener
from rental_listener import RentalEventListener
from simulation_helper import (
    add_first_route_batch,
    add_stationary_scooters,
    run_incremental_batches,
    setup_simulator_listeners,
    BATCH_DELAY
)

NUM_BATCHES = 1  # Karlskrona specific


def run():
    print("Simulation starting…", flush=True)

    wait_for_backend_response()
    
    rbroadcast = ScooterBroadcaster()
    scooters = []

    karlskrona_city = City.from_api("Karlskrona")
    print(f"Loaded zones: {list(karlskrona_city.zones.keys())} with speed limits: {karlskrona_city.speed_limits}")

    ordered_routes = list(KARLSKRONA_ROUTES.items())

    # First route batch
    next_sid = add_first_route_batch(
        scooters=scooters,
        rbroadcast=rbroadcast,
        ordered_routes=ordered_routes,
        start_sid=1501,
        special_battery_level=19.8
    )

    simulator = Simulator(
        scooters=scooters,
        routes=KARLSKRONA_ROUTES,
        city=karlskrona_city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios={}
    )

    # Apply hardcoded custom scenarios
    simulator.custom_scooter_scenarios[1501] = park_in_nearest_charging_zone(required_trips=1)
    simulator.custom_scooter_scenarios[1504] = breakdown_after_seconds(seconds=25)

    admin_listener, rental_listener = setup_simulator_listeners(simulator)

    print(f"{len(scooters)} route-based scooters active in Karlskrona (first batch)")

    # Stationary in zones
    next_sid, added = add_stationary_scooters(
        scooters=scooters,
        simulator=simulator,
        current_sid=next_sid,
        max_sid=2000
    )
    print(f"Added {added} stationary scooters in zones: now {len(scooters)} total active in Karlskrona")

    # Incremental batches
    run_incremental_batches(
        simulator=simulator,
        scooters=scooters,
        ordered_routes=ordered_routes,
        next_sid=next_sid,
        num_batches=NUM_BATCHES,
        special_battery_level=19.8
    )


if __name__ == "__main__":
    run()