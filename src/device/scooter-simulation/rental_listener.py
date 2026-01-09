"""
@module rental_listener

Thread-safe Redis subscriber that handles rental lifecycle events 
published after successful API-operation, and reliably forwards them to a
Scooter Simulator instance.

This listener does not mutate scooter objects directly, rather, it queues events
into the Simulator, which then applies them at the next tick().

Backend API still handles the actual definitive creation/completion of user rentals.
"""

import redis
import json
import threading


class RentalEventListener:
    """
    Background Redis subscriber for rental lifecycle events.

    The simulator uses these to enter/exit "external rental"-mode for that scooter:
      - disable auto-rental start/end for the scooter
      - disable route-following movement for the scooter
      - continue publishing scooter state
      - continue logging route coords every tick for the given rental_id, to be able to showcase it later
    """
    def __init__(self, simulator, redis_host='redis', redis_port=6379, channel='rental:lifecycle'):
        self.simulator = simulator
        self.r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.pubsub.subscribe(channel)

        # Background thread - it lies dormant but ready as Redis publishes a message to the channel
        self.thread = threading.Thread(target=self._listen, daemon=True)
        self.thread.start()
        print(f"[RentalListener] Started - listening on channel '{channel}'")

    def _listen(self):
        """
        Process incoming rental lifecycle messages.
        """
        for message in self.pubsub.listen():
            if message.get('type') != 'message':
                continue

            try:
                data = json.loads(message['data'])

                event_type = data.get("type")
                scooter_id = data.get("scooter_id")
                rental_id = data.get("rental_id")

                if event_type not in ("rental_started", "rental_ended"):
                    print(f"[RentalListener] Ignoring unknown event type: {event_type}")
                    continue

                if scooter_id is None or rental_id is None:
                    print(f"[RentalListener] Invalid payload (missing scooter_id/rental_id): {data}")
                    continue

                print(f"[RentalListener] Received {event_type}: scooter {scooter_id} rental {rental_id} (queued)")
                self.simulator.enqueue_rental_event(data)

            except Exception as e:
                print(f"[RentalListener] Error processing rental event: {e}")

    def close(self):
        """
        Clean shutdown.
        """
        self.pubsub.close()
        print("[RentalListener] Stopped")
