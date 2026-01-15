# Rentals endpoint
Rental data that may be fetched through the API:

>rental_id<br>
customer_id<br>
bike_id<br>
start_point<br>
start_time<br>
end_point<br>
end_time<br>
route<br>
start_zone<br>
end_zone<br>

Fetch all rentals:

Requires admin token.

>GET /rentals

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/rentals', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```

Result:

```json
[
    {
        "rental_id": 155,
        "customer_id": 1,
        "bike_id": 2,
        "start_point": {
            "lat": 55.60377234111643,
            "lng": 12.995999572274647
        },
        "start_time": "2026-01-08T10:00:07.000Z",
        "end_point": null,
        "end_time": null,
        "route": null,
        "start_zone": "free",
        "end_zone": null
    },
    {
        "rental_id": 154,
        "customer_id": 4,
        "bike_id": 5,
        "start_point": {
            "lat": 55.60709661148439,
            "lng": 13.025735121145207
        },
        "start_time": "2026-01-08T09:59:40.000Z",
        "end_point": null,
        "end_time": null,
        "route": null,
        "start_zone": "free",
        "end_zone": null
    },
    ...
]
```
Fetch all rentals associated with a customer:

Requires admin token or customer token with matching id.

>GET /rentals/customer?<customer_id>

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/rentals/customer?customer=3', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```

Result:

```json
[
    {
        "rental_id": 2,
        "customer_id": 3,
        "bike_id": 9,
        "start_point": null,
        "end_point": null,
        "start_time": "2025-12-01T08:11:22.000Z",
        "end_time": "2025-12-01T08:20:10.000Z",
        "start_zone": "parking",
        "end_zone": "free",
        "route": [
            {
                "lat": 55.5999509112525,
                "lng": 13.030631922678907,
                "spd": 11.71
            },
            ...
            {
                "lat": 55.60317473666674,
                "lng": 13.020684174016855,
                "spd": 19.51
            },
            {
                "lat": 55.6033236,
                "lng": 13.0204725,
                "spd": 15.29
            }
        ]
    },
```

Fetch one rental:

Requires admin token or customer token with matching customer id.

>GET /rentals/:id

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/rentals/166', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```

Result:

```json
{
    "rental_id": 166,
    "customer_id": 1,
    "bike_id": 2,
    "start_point": {
        "lat": 55.60590627081738,
        "lng": 12.99375398054791
    },
    "end_point": {
        "lat": 55.6035418,
        "lng": 12.9961395
    },
    "start_time": "2026-01-08T10:06:06.000Z",
    "end_time": "2026-01-08T10:07:56.000Z",
    "start_zone": "free",
    "end_zone": "free",
    "route": [
        {
            "lat": 55.60590627081738,
            "lng": 12.99375398054791,
            "spd": 11.71
        },
        ...
        {
            "lat": 55.60369867686451,
            "lng": 12.996044283046288,
            "spd": 19.51
        },
        {
            "lat": 55.6035418,
            "lng": 12.9961395,
            "spd": 13.28
        }
    ]
}
```

Create a new rental:

>POST /rentals

Required parameters:

>customer_id
>bike_id
>start_point
>start_zone

```javascript
const rental = { customer_id, bike_id, start_point, start_zone };

const token = localStorage.getItem('token');
const response = await fetch(`http://localhost:3000/api/v1/rentals`, {
    method: 'PUT',
    body: JSON.stringify(rental),
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const result = await response.json();
```

Result:

```json
{
    "rental_id": "Payment recorded",
    "scooter_id": 4,
    "user_id": 3,
    "user_name": "Marvin"
}
```
