"""
@module utils

Provides utility functions for the scooter simulation.

"""

import math
from typing import Tuple

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Calculate distance in meters
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def calculate_distance_in_m(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Boilerplate calculatory-code, above my paygrade, but uses the havergrade-formula to
    calculate and return the great-circle distance in metres between two lat/lon points.

    More than accurate enough for our purposes.

    Used in simulation, speed calculations, and geofencing logic. Very helpful.
    
    (https://en.wikipedia.org/wiki/Haversine_formula)

    @return == Distance in meters as a float.
    """
    EARTH_RADIUS_M = 6_371_000  # ~Earth radius in meters

    lat1_rad, lon1_rad = math.radians(coord1[0]), math.radians(coord1[1])
    lat2_rad, lon2_rad = math.radians(coord2[0]), math.radians(coord2[1])

    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    haversine = (math.sin(delta_lat / 2) ** 2 +
                 math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)

    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(haversine))

