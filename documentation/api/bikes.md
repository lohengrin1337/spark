
## 2. Bikes endpoint

All routes require a jwt token.<br>
Some routes require a jwt token with role: admin.

Bike data that can be fetched from the database:

>bike_id<br>
city<br>
status<br>
coordinates<br>

Fetch all bikes:
>GET /bikes

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
  }
]
```
Fetch all bikes from a city filtered on status:

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
      "coordinates": [20.2635805260072, 63.8279411983368]
    }
  },
  {
    "bike_id": 4,
    "city": "Umeå",
    "status": "available",
    "coordinates": {
      "type": "Point",
      "coordinates": [20.2842743064076, 63.8208798407403]
    }
  }
]
```
Update bike status:
>PUT /bikes/:id

Required parameters:
>bike_id<br>
JWT token
```javascript
bike = {
    "status": "deleted"
}
const response = await fetch("http://localhost:3000/api/v1/bikes/5", {
    method: 'PUT',
    body: JSON.stringify(bike),
    headers: {
    'Authorization': `Bearer ${token}`,
    'content-type': 'application/json'
    }
});
const result = await response.json();
```