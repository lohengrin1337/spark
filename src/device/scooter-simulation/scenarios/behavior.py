"""
@module behavior

Shared special scenario behaviors for individual scooters.

This module contains callback functions that can be injected into the Simulator
via custom_scooter_scenarios. Each function receives (scooter, simulator)
and implements custom logic - for example, permanently parking a scooter in a
charging/parking zone after a certain number of trips, or simulating a breakdown
after x seconds.

Each function is isolated and only affects the scooter it's called for/on.
This way the core Simulator is kept clean while still allowing varied, per-scooter
based special scenarios in the simulation.
"""
from api import update_bike_status
from shapely.geometry import Point
import time

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Original: Scooter #3 parks forever in the first charging zone after 2 trips
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def special_behavior_one(scooter, simulator):
    """
    After 2 trips, scooter #3 parks permanently at the true center of the first charging zone.
    """
    trip_count = simulator.trip_counter[scooter.id]
    if scooter.id != 3 or trip_count < 2:
        return False

    city = simulator.city
    charging_polygons = city.zones.get('charging', [])

    if not charging_polygons:
        print("Warning: No charging zones loaded — scooter 3 continues normally")
        return False

    charging_polygon = charging_polygons[0]
    center = charging_polygon.centroid
    center_lat = center.y
    center_lng = center.x

    scooter.lat = center_lat
    scooter.lng = center_lng
    scooter.speed_kmh = 0
    scooter.end_trip(in_charging_zone=True)

    def park_and_charge(scooter, elapsed_time):
        """Keep position fixed — do NOT return 'activity' to allow charging status"""
        return {
            "lat": scooter.lat,
            "lng": scooter.lng,
            "speed_kmh": 0.0
        }

    simulator.per_scooter_special_behavior[scooter.id] = park_and_charge

    print(f"Scooter 3 parked in FIRST charging zone at ({center_lat:.8f}, {center_lng:.8f})")

    return True


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# NEW: Park in the NEAREST charging zone after N trips
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def park_in_nearest_charging_zone(required_trips=2):
    """
    Factory: returns a behavior that parks a scooter in the nearest charging zone
    after completing `required_trips`.
    """
    def behavior(scooter, simulator):
        trip_count = simulator.trip_counter[scooter.id]
        if trip_count < required_trips:
            return False

        city = simulator.city
        charging_polygons = city.zones.get('charging', [])

        if not charging_polygons:
            print(f"Warning: No charging zones — scooter {scooter.id} continues normally")
            return False

        current_point = Point(scooter.lng, scooter.lat)

        nearest_polygon = min(
            charging_polygons,
            key=lambda poly: current_point.distance(poly.centroid)
        )

        center = nearest_polygon.centroid
        park_lat = center.y
        park_lng = center.x

        scooter.lat = park_lat
        scooter.lng = park_lng
        scooter.speed_kmh = 0.0
        scooter.end_trip(in_charging_zone=True)

        def permanent_parking(scooter, elapsed_time):
            """Keep position fixed — do NOT return 'activity' to allow charging status"""
            return {
                "lat": scooter.lat,
                "lng": scooter.lng,
                "speed_kmh": 0.0
            }

        simulator.per_scooter_special_behavior[scooter.id] = permanent_parking

        print(f"Scooter {scooter.id} parked in NEAREST charging zone "
              f"at ({park_lat:.8f}, {park_lng:.8f})")

        return True

    return behavior


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Park in the nearest parking zone after N trips
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def park_in_nearest_parking_zone(required_trips=2):
    """
    Parks a scooter in the nearest parking zone after completing `required_trips`.
    """
    def behavior(scooter, simulator):
        trip_count = simulator.trip_counter[scooter.id]
        if trip_count < required_trips:
            return False

        city = simulator.city
        parking_polygons = city.zones.get('parking', [])

        if not parking_polygons:
            print(f"Warning: No parking zones - scooter {scooter.id} continues normally")
            return False

        current_point = Point(scooter.lng, scooter.lat)

        nearest_polygon = min(
            parking_polygons,
            key=lambda poly: current_point.distance(poly.centroid)
        )

        center = nearest_polygon.centroid
        park_lat = center.y
        park_lng = center.x

        scooter.lat = park_lat
        scooter.lng = park_lng
        scooter.speed_kmh = 0.0
        scooter.end_trip(in_charging_zone=False)

        def permanent_parking(scooter, elapsed_time):
            """Keep position fixed — do NOT return 'activity'"""
            return {
                "lat": scooter.lat,
                "lng": scooter.lng,
                "speed_kmh": 0.0
            }

        simulator.per_scooter_special_behavior[scooter.id] = permanent_parking

        print(f"Scooter {scooter.id} parked in NEAREST parking zone "
              f"at ({park_lat:.8f}, {park_lng:.8f})")

        return True

    return behavior


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Breakdown / need service after X seconds of runtime
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def breakdown_after_seconds(seconds=300):
    """
    Scooter breaks down ("needService") after approximately `seconds` of
    simulation time.
    """
    start_time = time.time()

    def behavior(scooter, simulator):
        elapsed = time.time() - start_time

        if elapsed >= seconds:
            if scooter.status != "needService":
                success = update_bike_status(scooter.id, "needService")
                if success:
                    scooter.status = "needService"

            scooter.speed_kmh = 0.0

            def broken_down(scooter, elapsed_time):
                """Scooter is broken - will not move again until serviced."""
                return {
                    "lat": scooter.lat,
                    "lng": scooter.lng,
                    "speed_kmh": 0.0,
                    "activity": "idle"
                }

            simulator.per_scooter_special_behavior[scooter.id] = broken_down

            print(
                f"Scooter {scooter.id} broke down after ~{int(elapsed)}s — "
                f"status canonized as needService"
            )

            return True

        return False

    return behavior
