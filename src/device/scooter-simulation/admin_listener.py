"""
@module admin_listener

Handles admin-initiated scooter status overrides, coming in through the Redis channel,
resulting from successful API-operations.
Runs and listens in the background, and is capable of applying changes immediately to
the Simulator-instance.

"""

import redis
import json
import threading
import time


class AdminStatusListener:
    """
    Background Redis subscriber for admin status updates, that assigns a new status to the
    scooter immediately.
    For critical statuses (deactivated/needService):
      - Force-completes any active rental at the current position (clean end, counts as completed trip)
      - Applies permanent lock in place (stops movement immediately)
    No global effects or per-tick enforcement.
    """
    def __init__(self, simulator, redis_host='redis', redis_port=6379):
        self.simulator = simulator
        self.r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.pubsub.subscribe('admin:scooter_status_update')

        self.scooter_by_id = {sc.id: sc for sc in simulator.scooters}

        # Background thread - dormant until Redis publishes a message
        self.thread = threading.Thread(target=self._listen, daemon=True)
        self.thread.start()
        print("[AdminListener] Started - listening on channel 'admin:scooter_status_update'")

    def _listen(self):
        """
        Process incoming admin status messages.
        """
        for message in self.pubsub.listen():
            if message.get('type') != 'message':
                continue

            try:
                data = json.loads(message['data'])
                scooter_id = data['id']
                new_status = data['status']

                # Enqueues to simulator to apply at a safe point (top of tick).
                print(f"[AdminListener] Received admin status update: scooter {scooter_id} -> '{new_status}' (queued)")

                self.simulator.enqueue_admin_status_update(scooter_id, new_status)

            except Exception as e:
                print(f"[AdminListener] Error processing admin update: {e}")

    def close(self):
        """
        Clean shutdown.
        """
        self.pubsub.close()
        print("[AdminListener] Stopped")
