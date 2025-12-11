"""
@module behavior

Special scenario behaviors for individual scooters.

This module contains callback functions that can be injected into the Simulator
via 'on_trip_completed'. When a scooter finishes a trip, these functions get a
chance to take over and implement custom logic - for example, permanently parking
a scooter in a charging zone after a certain number of trips.

Each function is completely isolated and only affects the scooter it's called for/on.
This way the core Simulator is kept clean while still (hopefully) allowing varied, per-scooter
based special scenarios in the simulation.
"""


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Example: Scooter #3 parks forever in charging zone after 2 trips
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def special_malmoe_behavior_one(scooter, trip_count, simulator):
    """
    After completing 2 trips, scooter #3 is permanently parked in the first
    charging zone and starts charging - and it never moves again during the simulation.
    """
    if scooter.id == 3 and trip_count >= 2 and simulator.charging_zones:
        charging_zone_lat, charging_zone_lon, _ = simulator.charging_zones[0]
        scooter.lat = charging_zone_lat
        scooter.lon = charging_zone_lon
        scooter.speed_kmh = 0

        def stand_still(scooter):
            """ Park scooter indefinitely."""
            return {
                "lat": scooter.lat,
                "lon": scooter.lon,
                "speed_kmh": 0,
                "activity": "idle"  # Scooter.tick() auto-detects charging if in zone
            }

        # Apply special behaviour to only this specific scooter
        simulator.per_scooter_special_behavior[scooter.id] = stand_still

        print("Scooter 3 is now permanently parked and charging in this simulation")
        return True
    return False