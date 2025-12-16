"""
@module first-simulation

Entry point for the scooter simulation.

It is executed at container startup, to launch the first simulation attempt.

(...'python first-simulation.py' in docker-compose.yml)

Initializes the scooters, routes, and charging zones for the given simulation, and
then starts the main simulation loop.

Advances the scooter positions, updates status and battery, and publishes state to
Redis at each tick ( == UPDATE_INTERVAL).

Hopefully we can achieve greater, cleaner decoupling later, so that the simulator can run independently
in an evem more straightforward manner, with different inputs, enabling convenient creation of new,
clean, complementary simulation scenarios.
"""

import time
from scooter import Scooter
from simulator import Simulator
from routes import MALMOE_ROUTES
from redisbroadcast import ScooterBroadcaster
from config import UPDATE_INTERVAL
from helpers import wait_for_backend_response
from behavior import special_malmoe_behavior_one
"""
These will soon be supplanted by properly fetched ones from the db.
"""
CHARGING_ZONES = [
    (55.5979654,12.9972124, 30),
    (55.6040, 12.9950, 25),
]
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Create scooter instances for the simulation with proper initial state(s)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def init_scooters(rbroadcast):
    """
    Create scooter instances at the start of each route.
    Uses the first coordinate of each route as the initial position.
    Assigns a battery level and Redis client.
    """
    scooters = []
    for route_index, route_coords in MALMOE_ROUTES.items():
        start_lat, start_lon = route_coords[0]

        # Special scenario: scooter for route 3 starts at 22% battery to test charging
        battery_level = 22 if route_index == 3 else 100

        scooters.append(Scooter(
            # Each scooter is assigned a 'sid', i.e scooter-id, equal to the route index it starts on.
            sid=route_index,
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

    simulator = Simulator(
        scooters=scooters,
        routes=MALMOE_ROUTES,
        charging_zones=CHARGING_ZONES,
        rbroadcast=rbroadcast,
        on_trip_completed=special_malmoe_behavior_one
    )

    print(f"{len(scooters)} scooters now active")

    try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()
            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    run()