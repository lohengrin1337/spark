# Fees endpoint
Fee data that can be fetched through the API:

>fee_id<br>
updated<br>
start<br>
minute<br>
discount<br>
penalty<br>

Fetch all price lists:
>GET /fees/all
```javascript
const response = await fetch("http://localhost:3000/api/v1/fees/all");
const result = await response.json();
```
Result:
```
[
  {
    "fee_id": 1,
    "updated": "2025-10-01T00:00:00.000Z",
    "start": 20,
    "minute": 1,
    "discount": 10,
    "penalty": 15
  }
]
```
Fetch current price list:
>GET /fees
```javascript
const response = await fetch("http://localhost:3000/api/v1/fees");
const result = await response.json();
```
Result:
```
{
  "fee_id": 1,
  "updated": "2025-10-01T00:00:00.000Z",
  "start": 20,
  "minute": 1,
  "discount": 10,
  "penalty": 15
}
```
Update one or more prices:
>PUT /fees
Required parameters:
>fee_id
JWT token

>Optional parameters:
start
minute
discount
penalty
