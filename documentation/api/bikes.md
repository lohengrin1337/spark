
## 2. Bikes endpoint

All routes require a jwt token.<br>
Some routes require a jwt token with role: admin.

The GET /bikes route can return bikes filtered on one or more of the query parameters city=\<city>, status=\<bike status>, zone_type=\<zone type>. Unless called with parameter status=deleted it always omits deleted bikes.

Bike data that can be fetched from the database:

>bike_id<br>
city<br>
status<br>
coordinates<br>

Fetch all bikes:
>GET /bikes

required role - admin
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/bikes', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```
Result:
```
[
  {
    "bike_id": 1,
    "city": "Malmö",
    "status": "available",
    "coordinates": {
      "type": "Point",
      "coordinates": [12.9934357385279, 55.5988598345591]
    }
  },
  {
    "bike_id": 2,
    "city": "Malmö",
    "status": "available",
    "coordinates": {
      "type": "Point",
      "coordinates": [13.0194197442235, 55.589708405639]
    }
  },
  {
    "bike_id": 3,
    "city": "Umeå",
    "status": "available",
    "coordinates": {
      "type": "Point",
      "coordinates": [20.2635805260072, 63.8279411983368]
    }
  },
  ... ]
```
Fetch one bike by id:

> GET /bikes/:id

```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/bikes/5', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```
Result:
```
{
  "bike_id": 5,
  "city": "Karlskrona",
  "status": "available",
  "coordinates": {
    "type": "Point",
    "coordinates": [15.5870524372859, 56.164706761868]
  }
}
```
Fetch all bikes belonging to a city:

Required role = admin
>GET /bikes?city=\<city>
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/bikes?city=malmö', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```
Result:

```
[
    {
        "bike_id": 1,
        "city": "Malmö",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                12.993435738527893,
                55.59885983455905
            ]
        }
    },
    {
        "bike_id": 2,
        "city": "Malmö",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                13.01941974422354,
                55.589708405639016
            ]
        }
    }
]
```
Fetch all bikes filtered on city and zone type:

Requires admin token.

>GET /bikes?city=\<city>&zone_type=\<zone type>
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/bikes?city=karlskrona&zone_type=charging', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```
Result:

```
[
    {
        "bike_id": 10,
        "city": "Karlskrona",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                15.586608317417614,
                56.16304825991281
            ]
        }
    },
    {
        "bike_id": 7,
        "city": "Karlskrona",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                15.587383484926846,
                56.15855777145583
            ]
        }
    },
    {
        "bike_id": 9,
        "city": "Karlskrona",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                15.577400068720209,
                56.16071057591654
            ]
        }
    }
]
```

Fetch all bikes filtered on city and status:

Third parties and customers may filter on status available, all other filters require an admin token.

>GET /bikes?city=\<city>&status=\<status>
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/bikes?city=umeå&status=available', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```
Result:
```
[
    {
        "bike_id": 3,
        "city": "Umeå",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                20.26358052600719,
                63.82794119833679
            ]
        }
    },
    {
        "bike_id": 4,
        "city": "Umeå",
        "status": "available",
        "coordinates": {
            "type": "Point",
            "coordinates": [
                20.284274306407553,
                63.820879840740304
            ]
        }
    }
]
```
Update bike status:
>PUT /bikes/:id

Requires an admin token (om kund ska kunna flagga problem med cykel kanske det ska lösas på annat sätt?)

Required parameters:
>bike_id<br>
JWT token

```javascript
const bike = { status: "deleted" };
const response = await fetch(`/api/v1/bikes/:id`, {
    method: 'PUT',
    headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
    },
    body: JSON.stringify(bike)
    });
```
Result:
```
{
    "success": true,
    "message": "Status updated"
}
```
