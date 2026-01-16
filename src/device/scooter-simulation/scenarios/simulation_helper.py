"""
@module simulation_helper

Shared helper functions for city simulation scripts.

Provides modular, DRY logic for:
- Base simulator setup (city, routes, user pool)
- Loading route-assigned scooters in deterministic spread batches
- Adding stationary scooters in parking/charging zones
- Running the simulation tick loop
"""

import time
import random
import bisect
from scooter import Scooter
from config import UPDATE_INTERVAL

from api import update_bike_status_and_position, fetch_users
from utils import calculate_distance_in_m

from admin_listener import AdminStatusListener
from rental_listener import RentalEventListener


# Config constants

SCOOTERS_PER_SPECIAL_ZONE = 1  # scooters per individual charging/parking-zone, defaults to 1, 
                               # can be (and is) set script-specific

ZONE_SCOOTER_MARGIN = 0.000030


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# DB activation / initial sync helpers
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def activate_scooter_in_db(scooter, status):
    """
    One-time activation with status + position update to db, for all the scooters
    introduced into the simulation. This provides both accurate status and up to date
    first positional data. 
    
    The hardcoded single position (with the default onService status)
    for each city, introduced during seeding, can conceptually be thought of as the position
    of the service center/hq.

    Keeps the seeded unused scooters out of circulation, letting them rest and repair.
    """
    ok = update_bike_status_and_position(
        bike_id=scooter.id,
        new_status=status,
        lat=scooter.lat,
        lng=scooter.lng
    )
    if not ok:
        print(f"[Seed] WARNING: Failed to activate scooter {scooter.id} as '{status}' @ ({scooter.lat}, {scooter.lng})")
    return ok


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Simulator listeners
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def setup_simulator_listeners(simulator):
    """
    Create and return the standard listeners for a simulator instance.
    Extracted to reduce duplication across city simulation scripts.
    """
    admin_listener = AdminStatusListener(simulator)
    rental_listener = RentalEventListener(simulator)
    return admin_listener, rental_listener


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Per-scooter behavior overrides
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def stationary_behavior(scooter, elapsed_time):
    """Override: fixed position, no movement, never finishes route."""
    return {
        "lat": scooter.lat,
        "lng": scooter.lng,
        "speed_kmh": 0.0,
        "route_finished": False,
        "activity": "idle"
    }


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Simulation user pool helpers (DB canonical users, per-city ID range)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def build_simulation_user_pool(
    city_label,
    user_id_min,
    user_id_max,
    max_users=None
):
    """
    Build a simulation user pool with db-fetched users/customers filtered based on explicit ID-range.

    Real users interact with the system normally via web clients, and for rentals, specifically via
    the user app.

    The user_id_min/user_id_max-variables define the allowed pool range.

    The max_users lets one cap/tune the pool size to be used, default is the full user pool for
    each city.

    Note: The users in the system are not strictly tied to one city, and can rent scooters in each if
    they so choose, but for the purpose of increased perceived simulation clarity, this
    faux-differentiation is made.
    """
    all_users = fetch_users()

    filtered_users = []

    for user in all_users:
        user_id = user.get("user_id")
        if user_id is None:
            continue

        if user_id_min <= user_id <= user_id_max:
            user_name = user.get("user_name") or f"{city_label} User {user_id}"
            filtered_users.append({
                "user_id": user_id,
                "user_name": user_name
            })

    if not filtered_users:
        print(
            f"[Users] WARNING: No simulation users found in range {user_id_min}-{user_id_max}. "
            f"Simulator may use fallback Simulated User if a rental occur."
        )
        return []

    if max_users is not None and max_users > 0 and len(filtered_users) > max_users:
        random.seed(42)
        random.shuffle(filtered_users)
        filtered_users = filtered_users[:max_users]

    return filtered_users


def apply_simulation_user_pool(
    simulator,
    city_label,
    user_id_min,
    user_id_max,
    max_users=None
):
    """
    Overwrite simulator.user_pool with the filtered simulation user pool..
    """
    pool = build_simulation_user_pool(
        city_label=city_label,
        user_id_min=user_id_min,
        user_id_max=user_id_max,
        max_users=max_users
    )

    simulator.user_pool = pool

    print(
        f"[Users] Simulation user pool loaded for {city_label}: "
        f"{len(pool)} users (range {user_id_min}-{user_id_max})"
    )


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Internal helpers: keep simulator registration coherent and reusable
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def _register_new_scooter_in_simulator(
    simulator,
    scooter,
    route_id,
    waypoint_index=0,
    trip_counter_value=0,
    special_behavior=None,
    rental_id=None
):
    """
    Registers a newly introduced scooter into a simulator instance.
    """
    # Route is optional - stationary-by-default scooters do not require a route.
    if route_id is not None:
        simulator.scooter_to_route[scooter.id] = route_id

    simulator.trip_counter[scooter.id] = trip_counter_value
    simulator.next_waypoint_index[scooter.id] = {"route_index": waypoint_index}
    simulator.last_position[scooter.id] = (scooter.lat, scooter.lng)
    simulator.last_travel_direction[scooter.id] = None
    simulator.per_scooter_special_behavior[scooter.id] = special_behavior

    simulator.rentals[scooter.id] = {
        "active": False,
        "rental_id": rental_id,
        "user_id": None,
        "user_name": None,
        "start_zone": "free",
        "end_zone": "free",
    }
    simulator.external_rentals[scooter.id] = {
        "active": False,
        "rental_id": None,
        "user_id": None,
        "user_name": None,
    }



def select_scooter_route_entry_point(route_waypoints, entry_position, city=None):
    """
    Select where along a route a newly introduced scooter should be placed
    and how the simulator should continue the route from that position.

    Entry positions: start, middle, end.
    """

    route_length = len(route_waypoints)

    # Enter at index-start
    if route_length < 2 or entry_position == "start":
        latitude, longitude = route_waypoints[0]
        next_waypoint_index = 0
        trip_counter_value = 0
        return latitude, longitude, next_waypoint_index, trip_counter_value

    # Enter at the end of the route (route considered already completed once)
    if entry_position == "end":
        latitude, longitude = route_waypoints[-1]

        if city is not None:
            valid_entry_point = None

            for lat, lng in reversed(route_waypoints):
                z = city.classify_zone(lat, lng)
                if z == "slow":
                    valid_entry_point = (lat, lng)
                    break

            if valid_entry_point is None:
                for lat, lng in reversed(route_waypoints):
                    z = city.classify_zone(lat, lng)
                    if z != "outofbounds":
                        valid_entry_point = (lat, lng)
                        break

            if valid_entry_point is not None:
                latitude, longitude = valid_entry_point

        next_waypoint_index = 0
        trip_counter_value = 1
        return latitude, longitude, next_waypoint_index, trip_counter_value

    # Enter in the middle of the route
    middle_waypoint_index = route_length // 2

    # If the route is too short to have a meaningful middle, fall back to start
    if route_length < 3:
        latitude, longitude = route_waypoints[0]
        next_waypoint_index = 0
        trip_counter_value = 0
        return latitude, longitude, next_waypoint_index, trip_counter_value

    latitude, longitude = route_waypoints[middle_waypoint_index]

    # Advance to the next waypoint so movement continues forward
    next_waypoint_index = min(middle_waypoint_index + 1, route_length - 1)
    trip_counter_value = 0

    return latitude, longitude, next_waypoint_index, trip_counter_value


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Spread helpers (distance-based, deterministic, robust)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def _spread_position_sequence(max_items):
    """
    Generate spread positions in priority order:
    0, 1, 1/2, 1/4, 3/4, 1/8, 3/8, 5/8, 7/8, ...
    """
    if max_items <= 0:
        return []

    positions = []
    positions.append(0.0)

    if len(positions) >= max_items:
        return positions

    positions.append(1.0)

    if len(positions) >= max_items:
        return positions

    denominator = 2
    while len(positions) < max_items:
        step = 1.0 / denominator
        position = step
        while position < 1.0 and len(positions) < max_items:
            positions.append(position)
            position += 2 * step
        denominator *= 2

    return positions


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Route entry point helpers (distance-based)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def select_scooter_route_entry_point_distance(
    route_waypoints,
    position,
    city=None,
    cumulative_distances=None,
    total_distance_meters=None
):
    """
    Select where along a route a newly introduced scooter should be placed using a position-based
    point along the polyline.

    Falls back cleanly for short/faulty routes.
    """
    route_length = len(route_waypoints)

    # Handle one entry array
    if route_length < 2:
        latitude, longitude = route_waypoints[0]
        next_waypoint_index = 0
        trip_counter_value = 0
        return latitude, longitude, next_waypoint_index, trip_counter_value

    # Clamp position to [0, 1]
    if position <= 0.0:
        latitude, longitude = route_waypoints[0]
        next_waypoint_index = 0
        trip_counter_value = 0
        return latitude, longitude, next_waypoint_index, trip_counter_value

    if position >= 1.0:
        return select_scooter_route_entry_point(route_waypoints, "end", city=city)

    # Compute cumulative arc-length (meters) along the route polyline
    if cumulative_distances is None or total_distance_meters is None:
        cumulative_distances = [0.0]
        total_distance_meters = 0.0

        for index in range(1, route_length):
            previous_point = route_waypoints[index - 1]
            current_point = route_waypoints[index]
            segment_length_meters = calculate_distance_in_m(previous_point, current_point)
            total_distance_meters += segment_length_meters
            cumulative_distances.append(total_distance_meters)

    # Zero-length route fallback
    if total_distance_meters <= 0.0:
        latitude, longitude = route_waypoints[0]
        next_waypoint_index = 0
        trip_counter_value = 0
        return latitude, longitude, next_waypoint_index, trip_counter_value

    # Target distance along the route
    target_distance_meters = position * total_distance_meters

    # Find the segment that contains the target distance
    segment_end_index = bisect.bisect_left(cumulative_distances, target_distance_meters, 1)

    # Fallback for safety (should not happen)
    if segment_end_index <= 0 or segment_end_index >= route_length:
        return select_scooter_route_entry_point(route_waypoints, "end", city=city)

    segment_start_index = segment_end_index - 1

    segment_start_distance = cumulative_distances[segment_start_index]
    segment_end_distance = cumulative_distances[segment_end_index]
    segment_length = segment_end_distance - segment_start_distance

    segment_start_lat, segment_start_lng = route_waypoints[segment_start_index]
    segment_end_lat, segment_end_lng = route_waypoints[segment_end_index]

    # Interpolate within the chosen segment
    if segment_length <= 0.0:
        latitude, longitude = segment_start_lat, segment_start_lng
    else:
        fraction_along_segment = (target_distance_meters - segment_start_distance) / segment_length
        latitude = segment_start_lat + (segment_end_lat - segment_start_lat) * fraction_along_segment
        longitude = segment_start_lng + (segment_end_lng - segment_start_lng) * fraction_along_segment

    # Continue movement forward from the segment end waypoint
    next_waypoint_index = min(segment_end_index, route_length - 1)
    trip_counter_value = 0

    return latitude, longitude, next_waypoint_index, trip_counter_value


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Route-assigned scooter batch loading (setup-phase)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def load_route_assigned_scooters_in_batches(
    simulator,
    scooters,
    ordered_routes,
    next_sid,
    num_batches,
    special_battery_route=3,
    special_battery_level=22,
    max_sid=None,
    route_waypoint_cache=None
):
    """
    Load route-assigned scooters into the simulation in batches using spread positions.

    Each batch introduces one scooter per route, positioned along that route by a
    spread sequence (0.0 (start), 1.0 (end), 0.5 (middle), 0.25 (quarter way), etc).
    
    For each introduced scooter this function:
    - Creates the Scooter instance in the simulation
    - Activates it properly in the DB (status + position updates)
    - Registers it in the simulator (route assignment + waypoint continuation state)

    Returns (updated_next_sid, batches_added).
    """
    if num_batches <= 0:
        return next_sid, 0

    positions = _spread_position_sequence(num_batches)

    batches_added = 0
    current_sid = next_sid

    for position in positions:
        new_scooters = []
        scooter_initialization_state = []

        for route_index, route_coordinates in ordered_routes:
            if len(route_coordinates) < 1:
                continue

            if max_sid is not None and current_sid > max_sid:
                break

            battery_level = special_battery_level if route_index == special_battery_route else 100

            cached = None
            if route_waypoint_cache is not None:
                cached = route_waypoint_cache.get(route_index)

            if cached is not None and cached.get("num_waypoints") == len(route_coordinates):
                cumulative_distances = cached.get("cumulative_distances_m")
                total_distance_meters = cached.get("total_distance_m")

                latitude, longitude, waypoint_index, trip_counter_value = select_scooter_route_entry_point_distance(
                    route_coordinates,
                    position,
                    city=simulator.city,
                    cumulative_distances=cumulative_distances,
                    total_distance_meters=total_distance_meters
                )
            else:
                latitude, longitude, waypoint_index, trip_counter_value = select_scooter_route_entry_point_distance(
                    route_coordinates,
                    position,
                    city=simulator.city
                )

            scooter = Scooter(
                sid=current_sid,
                lat=latitude,
                lng=longitude,
                battery=battery_level,
                rbroadcast=simulator.rbroadcast
            )

            # Introduced into simulation
            scooter.status = "available"
            activate_scooter_in_db(scooter, "available")

            new_scooters.append(scooter)
            scooter_initialization_state.append((route_index, waypoint_index, trip_counter_value))
            current_sid += 1

        if not new_scooters:
            break

        scooters.extend(new_scooters)

        for scooter, (route_id, waypoint_index, trip_counter_value) in zip(
            new_scooters, scooter_initialization_state
        ):
            _register_new_scooter_in_simulator(
                simulator=simulator,
                scooter=scooter,
                route_id=route_id,
                waypoint_index=waypoint_index,
                trip_counter_value=trip_counter_value,
                special_behavior=None,
                rental_id=None
            )

        batches_added += 1
        print(
            f"Loaded batch {batches_added}/{num_batches} (position: {position:.4f}): "
            f"now {len(scooters)} scooters active"
        )

        if max_sid is not None and current_sid > max_sid:
            break

    return current_sid, batches_added


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# City simulation base setup (no scooters introduced here)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def setup_city_simulation(
    city_name,
    routes,
    start_sid,
    user_id_min,
    user_id_max,
    user_pool_max=None
):
    """
    Setup a city simulation in a low-level, readable way, whilst also making the process
    more dry.

    Creates:
    - City from API
    - Broadcaster
    - scooters list
    - ordered_routes
    - Simulator instance
    - Per-city simulation user pool (filtered by user_id range)

    Returns:
    (simulator, scooters, ordered_routes, next_sid)
    """
    from city import City
    from simulator import Simulator
    from redisbroadcast import ScooterBroadcaster

    rbroadcast = ScooterBroadcaster()
    scooters = []

    city = City.from_api(city_name)
    print(f"Loaded zones: {list(city.zones.keys())} with speed limits: {city.speed_limits}")

    ordered_routes = list(routes.items())

    next_sid = start_sid

    simulator = Simulator(
        scooters=scooters,
        routes=routes,
        city=city,
        rbroadcast=rbroadcast,
        custom_scooter_scenarios={}
    )

    # Apply city-specific simulation pool
    apply_simulation_user_pool(
        simulator=simulator,
        city_label=city_name,
        user_id_min=user_id_min,
        user_id_max=user_id_max,
        max_users=user_pool_max
    )

    return simulator, scooters, ordered_routes, next_sid


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Now supplanted outdated route batch helper
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def add_first_route_batch(
    scooters,
    rbroadcast,
    ordered_routes,
    start_sid,
    special_battery_route=3,
    special_battery_level=22
):
    """
    Create and activate one scooter per route.
    """
    current_sid = start_sid

    for route_index, route_coordinates in ordered_routes:
        if len(route_coordinates) < 1:
            continue

        start_latitude, start_longitude = route_coordinates[0]
        battery_level = special_battery_level if route_index == special_battery_route else 100

        scooter = Scooter(
            sid=current_sid,
            lat=start_latitude,
            lng=start_longitude,
            battery=battery_level,
            rbroadcast=rbroadcast
        )

        # Introduced into simulation
        scooter.status = "available"
        activate_scooter_in_db(scooter, "available")

        scooters.append(scooter)
        current_sid += 1

    return current_sid


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Stationary scooter placement helpers (parking/charging zones)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def add_stationary_scooters(scooters, simulator, current_sid, max_sid, scooters_per_zone=SCOOTERS_PER_SPECIAL_ZONE):
    """
    Add stationary scooters in parking/charging zones in tight clustering.
    """
    random.seed(42)

    added = 0
    for zone_type in ['parking', 'charging']:
        zone_polygons = simulator.city.zones.get(zone_type, [])
        for zone_polygon in zone_polygons:
            zone_centroid = zone_polygon.centroid
            for _ in range(scooters_per_zone):
                if current_sid > max_sid:
                    return current_sid, added

                latitude = zone_centroid.y + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)
                longitude = zone_centroid.x + random.uniform(-ZONE_SCOOTER_MARGIN, ZONE_SCOOTER_MARGIN)

                scooter = Scooter(
                    sid=current_sid,
                    lat=latitude,
                    lng=longitude,
                    battery=100,
                    rbroadcast=simulator.rbroadcast
                )

                # Introduced into simulation
                if zone_type == "charging":
                    scooter.status = "charging"
                    activate_scooter_in_db(scooter, "charging")
                else:
                    scooter.status = "available"
                    activate_scooter_in_db(scooter, "available")

                scooters.append(scooter)

                _register_new_scooter_in_simulator(
                    simulator=simulator,
                    scooter=scooter,
                    route_id=None,
                    waypoint_index=0,
                    trip_counter_value=0,
                    special_behavior=None,
                    rental_id=None
                )

                added += 1
                current_sid += 1

    return current_sid, added


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Clean Minimalistic Runtime loop (tick-based)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def run_simulation_by_tick(
    simulator,
    scooters
):
    """
    The final, actual runtime loop that advances the simulator tick() by tick() (UPDATE_INTERVAL).
    """
    try:
        while True:
            simulator.tick()
            for scooter in scooters:
                scooter.publish()

            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        print("Stopped.")
