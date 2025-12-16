"""
@module config

Holds simulation constants for scooters: timing, speed, battery levels, drain rates,
and charging.

These values are crucial for managing the simulations and the scooter behavior.
"""

UPDATE_INTERVAL = 5.0
RENTAL_PAUSE = 10
NOMINAL_MAX_SPEED_MPS = 5.42 # ~19.5 km/h

MIN_BATTERY = 5
LOW_BATTERY_THRESHOLD = 20
BATTERY_FULL = 100

BATTERY_DRAIN_IDLE = 0.01
BATTERY_DRAIN_ACTIVE = 0.025

CHARGE_RATE_PER_MIN = 3.0
