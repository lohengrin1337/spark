"""
@module karlskrona-first-simulation

Entry point for the modest smaller Kalrkrona scooter simulation.

Initializes the scooters, routes, and city zones for the given simulation, and
then starts the main simulation loop.

Advances the scooter positions, updates status and battery, and publishes state to
Redis at each tick ( == UPDATE_INTERVAL).

Now uses real polygon-based zones loaded from the database via the existing API,
replacing crude circular charging zones with accurate city, parking, charging, and slow areas.

"""

import time
from scooter import Scooter
from city import City 
from simulator import Simulator
from routes import KARLSKRONA_ROUTES
from redisbroadcast import ScooterBroadcaster
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response   
from behavior import (
    special_behavior_one,
    park_in_nearest_charging_zone,
    park_in_nearest_parking_zone,
    breakdown_after_seconds
)

from admin_listener import AdminStatusListener
from rental_listener import RentalEventListener


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Create scooter instances for the simulation with proper initial state(s)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def init_scooters(rbroadcast):
    """
    Create scooter instances at the start of each route.
    Uses the first coordinate of each route as the initial position.
    Assigns a battery level and Redis broadcaster.
    """
    scooters = []
    for route_index, route_coords in KARLSKRONA_ROUTES.items():
        start_lat, start_lng = route_coords[0]

        # Special scenario: scooter for route 3 starts at 22% battery to test charging
        battery_level = 19.8 if route_index == 3 else 100

        scooters.append(Scooter(
            # Each scooter is assigned a 'sid', i.e scooter-id, equal to the route index it starts on.
            sid=route_index + 1500,
            lat=start_lat,
            lng=start_lng,
            battery=battery_level,
            rbroadcast=rbroadcast
        ))
    return scooters


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Start the simulation, updating scooter positions, status, battery, and publishing
# to/through Redis.
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def run():
    """
    Execute the actual simulatory process (in this case, ticking alngg in perpetuity).
    """
    print("Simulation starting…", flush=True)

    wait_for_backend_response()
    
    rbroadcast = ScooterBroadcaster()
    scooters = init_scooters(rbroadcast)

    print("Loading Umeå city zones from API...")
    karlskrona_city = City.from_api("Karlskrona")
    print(f"Loaded zones: {list(karlskrona_city.zones.keys())} with speed limits: {karlskrona_city.speed_limits}")

    custom_scooter_scenarios = {}

    # Example: Scooter 5 park in nearest charging zone after 1 trip
    custom_scooter_scenarios[201] = park_in_nearest_charging_zone(required_trips=1)

    # Example: Scooter 3 first charging zone after 2 trips
    # custom_scooter_scenarios[101] = special_behavior_one

    # Example: Scooter 2 breakdown after 10 minutes
    custom_scooter_scenarios[204] = breakdown_after_seconds(max_runtime_seconds=25)

    # Example: All even scooters parks at nearest parking after 2 trips
    # for scooter in scooters:
    #     if scooter.id % 2 == 0:
    #         custom_scooter_scenarios[scooter.id] = park_in_nearest_parking_zone(required_trips=2)

    simulator = Simulator(
        scooters=scooters,
        routes=KARLSKRONA_ROUTES,
        city=karlskrona_city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios=custom_scooter_scenarios  # Multiple independent scenarios
    )

    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)

    print(f"{len(scooters)} scooters now active in Karlskrona")

    try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()
            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        admin_listener.close()
        rental_listener.close()
        print("Stopped.")


if __name__ == "__main__":
    run()