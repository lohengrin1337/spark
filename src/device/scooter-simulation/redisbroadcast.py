"""
@module scooter_broadcaster

ScooterBroadcaster — the simulated e-scooter's transmitter.

This class is the IoT-like state-emitter for each simulated scooter.
It broadcasts live state (position, battery, status, speed) on every tick and handles
the rental path recording + rental completion events - emulating a real scooter's
transmitter sending data to the cloud.

Uses Redis Pub/Sub (TCP-socket) for very fast and decoupled transmissions.
"""

import redis
import json


class ScooterBroadcaster:
    """
    The onboard broadcaster used by each scooter.
    Emits real-time scooter state and rental events via Redis Pub/Sub to the backend,
    mimicking a physical e-scooter's transmitter.
    """
    def __init__(self, host="redis", port=6379):
        self.r = redis.Redis(host=host, port=port, decode_responses=True)
        
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Scooter state-broadcast on every simulation tick
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    def broadcast_state(self, payload): #publish_scooter
        """
        Broadcast current scooter state to the backend on every tick (== UPDATE_INTERVAL).
        """
        scooter_id = payload["id"]
        encoded = json.dumps(payload)

        # Keep latest known state (for late-joining clients)
        self.r.set(f"scooter:{scooter_id}", encoded)

        # Real-time push for the live map updates
        self.r.publish("scooter:state:tick", encoded)


    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Rental coordinate tracking - builds the breadcrumb trail for the trip history
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 

    def log_coord(self, rental_id, lat, lng, spd):
        """
        Records the coordinates, and the given speed, for a scooter at a given state snapshot,
        regulated by UPDATE_INTERVAL.
        
        Each call adds a breadcrumb to the scooter's trip path, that will later be
        used to draw the full route on the map for a user overlooking their rental history.
        """
        coord = json.dumps({"lat": lat, "lng": lng, "spd": spd})
        self.r.rpush(f"rental:{rental_id}:coords", coord)

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Clear out stale and superfluous coords of db-persisted rental from cache
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 

    def clear_coords(self, rental_id):
        """
        Deletes any superfluous coordinate entries for a given rental ID from the Redis-cache.
        Coordinate lists for a given rental-id, once persisted to db, is never reused, so clearing
        them prevents unused data from hogging Redis memory.
        """
        self.r.delete(f"rental:{rental_id}:coords")

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Load coordinates to complete rental object
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
        
    def load_coords(self, rental_id):
        """
        Retrieves the full sequence of coordinates + speed recorded during a rental.

        This method is called immediately after a simulated trip ends (when route_finished == True)
        to extract the complete logged coordinate path (+ speed notation) from Redis, in order for it to be
        attached to the final completed rental event that gets published (via rbroadcast.publish_completed),
        and thereafter persisted to db.

        The returned list of coordinates is thus included in the completed rental payload, making it possible
        to later visualize the route on a map for a user overlooking their rental history.
        """
        raw = self.r.lrange(f"rental:{rental_id}:coords", 0, -1)
        return [json.loads(c) for c in raw]

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Redis-publish complete rental object
    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
    def publish_completed(self, rental):
        """
        Publish the full rental object at a rental's completion. Only used to populate
        the dynamic list of recent renatls in the admin interface.
        
        Persistence to the database is instead done with an API-call directly in simulator.py
        in relation to the completion of the rental lifecycle.
        """
        data = json.dumps(rental)
        self.r.lpush("completed_rentals", data)
        self.r.publish("rental:completed", data)