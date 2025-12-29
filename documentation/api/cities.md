# 3. Cities
City data that can be fetched from the database:

name

Fetch all cities:
>GET /cities
```javascript
const response = await fetch("http://localhost:3000/api/v1/cities");
const result = await response.json();
```
Result:
```
[
  {
    "name": "Karlskrona"
  },
  {
    "name": "Malmö"
  },
  {
    "name": "Umeå"
  }
]
```
Fetch one city:
>GET /cities/:name
```javascript
const response = await fetch("http://localhost:3000/api/v1/cities/malmö");
const result = await response.json();
```
Result:
```
{
  "name": "Malmö"
}
```
