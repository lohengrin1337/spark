## 3. Customers endpoint
Customer data that can be fetched from the database:
>customer_id<br>
email<br>
name<br>
password<br>
blocked<br>
oauth_provider<br>
oauth_provider_id<br>

Fetch all customers:
>GET /customers
```javascript
const response = await fetch("http://localhost:3000/api/v1/customers");
const result = await response.json();
```
Result:
```
[
  {
    "customer_id": 1,
    "email": "lisa@lisa.se",
    "name": "Lisa",
    "password": "null",
    "blocked": 0,
    "oauth_provider": "null",
    "oauth_provider_id": "null\r"
  },
  {
    "customer_id": 2,
    "email": "emma@emma.se",
    "name": "Emma",
    "password": "null",
    "blocked": 0,
    "oauth_provider": "null",
    "oauth_provider_id": "null\r"
  },
  {
    "customer_id": 3,
    "email": "herman@herman.se",
    "name": "Herman",
    "password": "null",
    "blocked": 0,
    "oauth_provider": "null",
    "oauth_provider_id": "null\r"
  },
  ...]
```
Fetch one customer by id:
>GET /customers/:id
```javascript
const response = await fetch("http://localhost:3000/api/v1/customers/4");
const result = await response.json();
```
Result:
```
{
  "customer_id": 4,
  "email": "olof@olof.se",
  "name": "Olof",
  "password": "null",
  "blocked": 0,
  "oauth_provider": "null",
  "oauth_provider_id": "null\r"
}
```