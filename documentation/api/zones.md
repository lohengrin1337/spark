# Fees endpoint
Zone data that can be fetched through the API:

>zone_id<br>
city<br>
zone_type<br>
coordinates<br>
bikes<br>
speed_limit<br>

Fetch all zones:
>GET /zones
```javascript
const response = await fetch("http://localhost:3000/api/v1/zones/");
const result = await response.json();
```
Result:
```
[...
  {
    "zone_id": 40,
    "city": "Karlskrona",
    "zone_type": "parking",
    "coordinates": "POLYGON((15.590151240805483 56.156862708945084,15.590151240805483 56.156793605352476,15.590214958264085 56.156793605352476,15.590214958264085 56.156862708945084,15.590151240805483 56.156862708945084))",
    "bikes": [
        1536,
        1537,
        1538,
        1539,
        1540
    ],
    "speed_limit": 5
  },
  {
      "zone_id": 41,
      "city": "Karlskrona",
      "zone_type": "parking",
      "coordinates": "POLYGON((15.581653391318639 56.16560290207906,15.581653391318639 56.1655655572994,15.581787533336268 56.1655655572994,15.581787533336268 56.16560290207906,15.581653391318639 56.16560290207906))",
      "bikes": [
          1541,
          1542,
          1543
      ],
      "speed_limit": 5
    },
...]
```



Fetch zone by id:
>GET /zones/:id
```javascript
const response = await fetch("http://localhost:3000/api/v1/zones/<id>");
const result = await response.json();
```
Result:
```
{
  "zone_id": 57,
  "city": "Umeå",
  "zone_type": "parking",
  "coordinates": "POLYGON((20.216483572590192 63.833262087713564,20.2165930483678 63.83340155473101,20.21633760488578 63.83341764703462,20.216252457058715 63.83325672358376,20.216483572590192 63.833262087713564))",
  "bikes": [
      1051,
      1052,
      1053,
      1054,
      1055
  ],
  "speed_limit": 5
}
```