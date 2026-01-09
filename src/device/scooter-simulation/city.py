"""
@module city

Holds the City class and related helpers for working with real geographic zones in the simulator.

Loads zone polygons directly from the backend database (via API), builds Shapely geometries,
and provides fast, reliable point-in-polygon checks and zone classification.

Used by the simulator (injected into it) to determine:
- Where a bike currently is (free, slow, parking, charging, outofbounds)
- Whether it's inside the city boundary
- Correct speed limit per zone type
"""

import requests
from shapely.geometry import Point
from shapely.wkt import loads as wkt_loads


class City:
    """
    Represents a single city and its complete set of geographic zones, including a method to
    populate it from the database.

    Stores real-world polygons (as Shapely geometries) for all zone types and provides fast,
    reliable point-in-polygon testing. Used by the simulator to classify bike positions,
    enforce speed limits, detect specific zone and out-of-bounds movement, and identify valid
    parking/charging areas.
    """

    def __init__(self, name, zones_wkt):
        self.name = name
        self.zones = {
            'city': [],
            'slow': [],
            'parking': [],
            'charging': []
        }
        self.speed_limits = {}

        for zone in zones_wkt:
            zone_type = zone['zone_type'].lower()
            wkt = zone['coordinates_wkt']

            if zone_type not in self.zones:
                continue

            try:
                poly = wkt_loads(wkt)
                if poly.is_valid and not poly.is_empty:
                    self.zones[zone_type].append(poly)
                else:
                    print(f"Warning: Skipping invalid or empty polygon for {zone_type} zone in {name}")
            except Exception as e:
                print(f"Warning: Invalid WKT for {zone_type} zone in {name}: {e}")

            if 'speed_limit' in zone and zone['speed_limit'] is not None:
                self.speed_limits[zone_type] = zone['speed_limit']

    def is_inside(self, lat, lon, zone_type):
        """
        Return True if the point (lat, lon) is inside any polygon of the given zone_type.
        """
        zone_type = zone_type.lower()
        if zone_type not in self.zones:
            return False
        
        point = Point(lon, lat)
        
        for poly in self.zones[zone_type]:
            if poly.contains(point) or poly.touches(point):
                return True
        return False

    def classify_zone(self, lat, lon):
        """ 
        Classify the current position into the correct zone type
        (priority: charging > parking > city > slow --->outofbounds).
        """
        if self.is_inside(lat, lon, 'charging'):
            return 'charging'
        if self.is_inside(lat, lon, 'parking'):
            return 'parking'
        if self.is_inside(lat, lon, 'city'):
            return 'free'
        if self.is_inside(lat, lon, 'slow'):
            return 'slow'
        return 'outofbounds'

    def is_in_city_boundary(self, lat, lon):
        """ 
        Simple check if the point is inside the overall city boundary. 
        """
        return self.is_inside(lat, lon, 'city')

    def get_speed_limit(self, zone_type):
        """ 
        Return the cset speed limit for a zone type, if any. 
        """
        return self.speed_limits.get(zone_type.lower())

    @classmethod
    def from_api(cls, city_name, api_base_url="http://system:3000/api/v1/cities"):
        """
        Load all zones for a city directly from the backend API and instantiate a City object.
        Raises ValueError if city not found, RuntimeError on other API issues.
        """
        url = f"{api_base_url}/{city_name}/zones"
        try:
            response = requests.get(url, timeout=10)
        except requests.RequestException as e:
            raise RuntimeError(f"Failed to reach API for city zones ({city_name}): {e}")

        if response.status_code == 404:
            raise ValueError(f"No zones found for city '{city_name}'")
        if response.status_code != 200:
            raise RuntimeError(f"API error {response.status_code}: {response.text}")

        zones_data = response.json()

        zones_wkt = [
            {
                'zone_type': z['zone_type'],
                'coordinates_wkt': z['coordinates_wkt'],
                'speed_limit': z.get('speed_limit')
            }
            for z in zones_data
        ]

        print(f"[GEO] Loaded {len(zones_wkt)} zone(s) for city '{city_name}'")
        return cls(name=city_name, zones_wkt=zones_wkt)