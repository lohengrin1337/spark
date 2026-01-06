# 3. Cities
City data that can be fetched from the database:

name

Fetch all cities:

>GET /cities

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/cities', {
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
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/cities/malmö', {
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
  "name": "Malmö"
}
```
