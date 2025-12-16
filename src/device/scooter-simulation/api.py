"""
@module api

Holds the api-functions used in the container.
"""
import requests

def fetch_users():
    """
    Fetch all users from the backend API, and if unsuccessful, fallback on
    generic JohnDoe-list as a backup.
    """
    url = "http://system:3000/api/v1/customers"

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
