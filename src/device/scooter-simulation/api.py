"""
@module api

Holds the api-functions used in the container.
"""
import requests
import json

def fetch_users():
    """ Fetch all users from the backend API, and if unsuccessful, fallback on generic JohnDoe-list as a backup. """
    url = "http://system:3000/api/v1/customers" # noqa: S112
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        customers = response.json()
        return [ 
            { 
                "user_id": customer["customer_id"], 
                "user_name": customer.get("name") or customer.get("email") 
            } 
            for customer in customers 
        ]
    except Exception as e:
        print("Failed to load users from API:", e)
        print("Using fallback user list.")
        return [ 
            {"user_id": uid, "user_name": f"JohnDoe{uid}"} 
            for uid in range(1, 21) 
        ]

RENTAL_API = "http://system:3000/api/v1/rentals" # noqa: S112

def fetch_rentals():
    """ Fetch all rentals from the backend API. """
    url = f"{RENTAL_API}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("Failed to fetch rentals from API:", e)
        return []

def create_rental(customer_id, bike_id, start_point, start_zone):
    """
    Create a new rental by sending customer_id, bike_id and start_point.
    Returns the created rental object (including rental_id) on success, None on failure.
    """
    url = f"{RENTAL_API}"
    payload = {
        "customer_id": customer_id,
        "bike_id": bike_id,
        "start_point": start_point,
        "start_zone": start_zone
    }

    try:
        print(f"[API] Creating rental -> POST {url} | payload: {json.dumps(payload)}")
        response = requests.post(url, json=payload, timeout=10)
        print(f"[API] Response {response.status_code}: {response.text}")

        if response.status_code == 201:
            data = response.json()
            rental_id = data.get("rental_id")
            if rental_id:
                print(f"[API] Rental started successfully -> real rental_id = {rental_id}")
                return data
            else:
                print("[API] Rental created but no rental_id in response")
        else:
            print(f"[API] Failed to create rental - status {response.status_code}")

    except Exception as e:
        print(f"[API] Exception while creating rental: {e}")

    return None

def complete_rental(rental_id, end_point, end_zone, route):
    """
    Complete an existing rental by providing end_point and full route.
    Returns True on success, False on failure.
    """
    if not route:
        print(f"[API] No route coordinates to send for rental {rental_id}")
        return False

    url = f"{RENTAL_API}/{rental_id}"
    payload = {
        "end_point": end_point,
        "end_zone": end_zone,
        "route": route
    }

    try:
        print(f"[API] Completing rental -> PUT {url}")
        print(f"[API] Payload size: {len(route)} points")
        response = requests.put(url, json=payload, timeout=15)
        print(f"[API] Response {response.status_code}: {response.text}")

        if response.status_code in (200, 204):
            print(f"[API] Rental {rental_id} completed and persisted successfully")
            return True
        else:
            print(f"[API] Failed to complete rental -> status {response.status_code}")

    except Exception as e:
        print(f"[API] Exception while completing rental {rental_id}: {e}")

    return False