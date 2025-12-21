
## 2. Bikes endpoint
Bike data that can be fetched from the database:

>bike_id<br>
city<br>
status<br>
coordinates<br>

Fetch all bikes:
>GET /bikes
```javascript
const response = await fetch("http://localhost:3000/api/v1/bikes");
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
Fetch all bikes belonging to a city:

>GET /bikes?city=\<city>
```javascript
const response = await fetch("http://localhost:3000/api/v1/bikes?city=malmö");
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
const response = await fetch("http://localhost:3000/api/v1/bikes?city=umeå&status=available");
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
Fetch one bike by id:

> GET /bikes/:id

```javascript
const response = await fetch("http://localhost:3000/api/v1/bikes/5");
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
