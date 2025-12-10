"""
@module scooter_broadcaster

ScooterBroadcaster — the simulated e-scooter's sender.

This class is the IoT telemetry emitter for each simulated scooter.
It broadcasts live state (position, battery, status, speed) every tick
and handles rental path recording + rental completion events - exactly like
a real scooter's onboard cellular module would when sending data to the cloud.

Uses Redis Pub/Sub (TCP-socket) for lightning speed and decoupling.
"""

import redis
import json


class ScooterBroadcaster:
    """
    Simulated onboard telemetry broadcaster.
    Emits real-time scooter state and rental events via Redis Pub/Sub to the backend,
    mimicking a physical e-scooter's cellular connection.
    """

    def __init__(self, host="redis", port=6379):
        self.r = redis.Redis(host=host, port=port, decode_responses=True)

    # ------------------------------------------------------------------
    #    
    # Scooter state-broadcast on every simulation tick
    #    
    # ------------------------------------------------------------------
    def broadcast_state(self, payload): #publish_scooter
        """
        Broadcast current scooter state to the backend on every tick (== UPDATE_INTERVAL).
        """
        scooter_id = payload["id"]
        encoded = json.dumps(payload)

        # Keep latest known state (for late-joining clients)
        self.r.set(f"scooter:{scooter_id}", encoded)

        # Real-time push for the live map updates
        self.r.publish("scooter:delta", encoded)

    # ------------------------------------------------------------------
    #    
    # Rental coordinate tracking - builds the breadcrumb trail for the trip history
    #    
    # ------------------------------------------------------------------
    def clear_coords(self, rental_id):
        """
        Called when a new rental begins. Deletes any leftover GPS points from previous
        rentals, and starts with a clean slate.
        """
        self.r.delete(f"rental:{rental_id}:coords")

    def log_coord(self, rental_id, lat, lon, spd):
        """
        Records one GPS position during an active rental.
        Each call adds a breadcrumb to the scooter's trip path - that will later be
        used to draw the full route on mat for a user overlooking their rental history.
        """
        coord = json.dumps({"lat": lat, "lng": lon, "spd": spd})
        self.r.rpush(f"rental:{rental_id}:coords", coord)

    def load_coords(self, rental_id):
        """
        Returns the complete coordinate path of a finished rental.
        Used when showing the user their trip history after returning the scooter.
        """
        raw = self.r.lrange(f"rental:{rental_id}:coords", 0, -1)
        return [json.loads(c) for c in raw]

    def publish_completed(self, rental):
        """Publish the full rental object at a rental's completion."""
        encoded = json.dumps(rental)
        self.r.lpush("completed_rentals", encoded)
        self.r.publish("rental:completed", encoded)