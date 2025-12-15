"""
@module helpers

Holds the helper functions used in the container.
"""
import time
import requests

def wait_for_backend_response(timeout=30, interval=2):
    """
    Wait for the backend API to be ready before starting simulation.
    """
    start_time = time.time()
    while True:
        try:
            resp = requests.get("http://system:3000/api/v1/customers", timeout=1)
            if resp.status_code == 200:
                print("Backend ready!", flush=True)
                return
        except Exception:
            pass

        if time.time() - start_time > timeout:
            raise TimeoutError(f"Backend not ready after {timeout} seconds")

        print("Waiting for backend...", flush=True)
        time.sleep(interval)