"""
@module scooter

Represents the physical state of a scooter.

Manages battery, speed, and operational status, and its logic is kept independent and
decoupled, blissfully unaware of constructs like "routes" or "rentals".

Publishes the scooter state updates to backend through Redis, using the pub/sub pipeline.
"""

from redisbroadcast import ScooterBroadcaster

"""
Import static variables
"""
from config import (
    UPDATE_INTERVAL, LOW_BATTERY_THRESHOLD, MIN_BATTERY,
    BATTERY_DRAIN_IDLE, BATTERY_DRAIN_ACTIVE, CHARGE_RATE_PER_MIN
)

class Scooter:
    """
    Represents the physical scooter only.
    It knows and stores nothing about routes or rentals, holds only the scooter state.
    """
    def __init__(self, sid: int, lat: float, lon: float, battery: float = 100, rbroadcast: ScooterBroadcaster = None):
        self.id = sid
        self.lat = lat
        self.lon = lon
        self.speed_kmh = 0.0
        self.battery = battery
        self.status = "idle"
        self.rbroadcast = rbroadcast

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Scooter's tick() - called on in every simulation tick()
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    """
    Progress scooter forward by one "tick" == one time unit == one UPDATE_INTERVAL,
    exclusively called by and in symbiosis with the simulators corresponding tick(),
    adjusting the scooter's speed, status, and battery state accordingly.
    """
    def tick(self, activity: str, speed_kmh: float, in_charging_zone: bool, elapsed_time: float):
        self.speed_kmh = speed_kmh

        # Charging has absolute highest priority
        if in_charging_zone and activity != "active":
            self.status = "charging"
        # Low battery warning — only if not charging
        elif self.battery < LOW_BATTERY_THRESHOLD:
            self.status = "needCharging"
        # Normal activity
        else:
            self.status = activity

        # Update battery based on final status
        self._update_battery(elapsed_time)
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Adjust battery
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    """
    Adjust battery level based on the current activity and the elapsed time.
    """
    def _update_battery(self, elapsed_time: float):
        if self.status == "charging":
            charge_per_sec = CHARGE_RATE_PER_MIN / 60
            self.battery = min(100, self.battery + charge_per_sec * elapsed_time)
        elif self.status in ("idle", "needCharging"):
            self.battery = max(MIN_BATTERY, self.battery - BATTERY_DRAIN_IDLE)
        elif self.status == "active":
            self.battery = max(MIN_BATTERY, self.battery - BATTERY_DRAIN_ACTIVE)

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # End trip
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    """
    Reset scooter at trip's end, updating status and stopping movement.
    Now: if the scooter is in a charging zone, immediately go to charging status.
    """
    def end_trip(self, in_charging_zone=False):
        self.speed_kmh = 0.0

        if in_charging_zone:
            self.status = "charging"
        elif self.battery < LOW_BATTERY_THRESHOLD:
            self.status = "needCharging"
        else:
            self.status = "idle"

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Publish/Broadcast Scooter-state
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    """
    Sends current state to Redis (if a redis-broadcaster is provided)
    """
    def publish(self, in_charging_zone=False):
        if not self.rbroadcast:
            return
        payload = {
            "id": self.id,
            "lat": round(self.lat, 7),
            "lng": round(self.lon, 7),
            "bat": round(self.battery, 1),
            "st": self.status,
            "spd": self.speed_kmh,
        }
        self.rbroadcast.broadcast_state(payload)
