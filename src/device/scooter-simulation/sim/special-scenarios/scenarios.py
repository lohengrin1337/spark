# scenarios/malmoe_demo.py (or wherever you run it)

def special_malmoe_behavior_one(scooter, trip_count, simulator):
    if scooter.id == 3 and trip_count >= 2 and simulator.charging_zones:
        cz_lat, cz_lon, _ = simulator.charging_zones[0]
        scooter.lat = cz_lat
        scooter.lon = cz_lon
        scooter.speed_kmh = 0
        print(f"Scooter 3 parked in charging zone after {trip_count} trips")
        return True
    return False