## 3. Customers endpoint
All customer endpoints require a jwt token in headers.<br>
If called with a jwt with role: customer, only data belonging to that customer may be accessed.
Admin may access all data.

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

Requires admin token.

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/customers', {
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

Fetch the customer data for a logged in in user:

>GET /customers/me

Requires customer token.

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/v1/customers/me', {
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
  "customer_id": 4,
  "email": "olof@olof.se",
  "name": "Olof",
  "password": <hashed password>,
  "blocked": 0,
  "oauth_provider": "null",
  "oauth_provider_id": "null\r"
}
```

Update customer data:

>PUT /customers/

Requires admin token or customer token where id matches query parameter customer_id.

Required parameters:

>customer_id<br>

Optional parameters:

>email<br>
name<br>
password

```javascript
customer = {
    "password": "drowssap"
}
const response = await fetch("http://localhost:3000/api/v1/customers?customer_id=4", {
    method: 'PUT',
    body: JSON.stringify(customer),
    headers: {
    'Authorization': `Bearer ${token}`,
    'content-type': 'application/json'
    }
});
const result = await response.json();
```

Result:

```json
{
    "success": true,
    "message": "Customer updated"
}
```

Block/unblock a customer:

>PUT /block/:id

Requires admin token.



```javascript

const response = await fetch("http://localhost:3000/api/v1/block/:id", {
    method: 'PUT',
    headers: {
    'Authorization': `Bearer ${token}`,
    'content-type': 'application/json'
    }
});
const result = await response.json();
```

Result:

```json
{
    "success": true,
    "message": "Kund spärrad"
}
```