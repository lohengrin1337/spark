"""
@module umea-first-simulation

Entry point for the modest smaller Umeå scooter simulation.

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
from routes import UMEA_ROUTES
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
    for route_index, route_coords in UMEA_ROUTES.items():
        start_lat, start_lon = route_coords[0]

        # Special scenario: scooter for route 3 starts at 22% battery
        battery_level = 22 if route_index == 3 else 100

        scooters.append(Scooter(
            # Each scooter is assigned a 'sid', i.e scooter-id, equal to the route index it starts on.
            sid=route_index + 1000,
            lat=start_lat,
            lon=start_lon,
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
    Execute the actual simulatory process (in this case, ticking along in perpetuity).
    """
    print("Simulation starting…", flush=True)

    wait_for_backend_response()
    
    rbroadcast = ScooterBroadcaster()
    scooters = init_scooters(rbroadcast)

    print("Loading Umeå city zones from API...")
    umea_city = City.from_api("Umeå")
    print(f"Loaded zones: {list(umea_city.zones.keys())} with speed limits: {umea_city.speed_limits}")

    # Build a dictionary of per-scooter custom scenarios
    custom_scooter_scenarios = {}

    # Example: Scooter 5 parks in nearest charging zone after 1 trip
    custom_scooter_scenarios[102] = park_in_nearest_charging_zone(required_trips=1)

    # Example: Scooter 3 to first charging zone after 2 trips
    custom_scooter_scenarios[101] = special_behavior_one

    # Example: Scooter 2 breaks down after 10 minutes
    custom_scooter_scenarios[103] = breakdown_after_seconds(max_runtime_seconds=20)

    # Example: All even scooters → nearest parking after 2 trips
    # for scooter in scooters:
    #     if scooter.id % 2 == 0:
    #         custom_scooter_scenarios[scooter.id] = park_in_nearest_parking_zone(required_trips=2)

    simulator = Simulator(
        scooters=scooters,
        routes=UMEA_ROUTES,
        city=umea_city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios=custom_scooter_scenarios
    )

    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)

    print(f"{len(scooters)} scooters now active in Umeå")

    try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()
            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        admin_listener.close()
        print("Stopped.")


if __name__ == "__main__":
    run()