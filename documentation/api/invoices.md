# Invoices endpoint
Invoice data that can be fetched through the API:

>invoice_id<br>
rental_id<br>
status<br>
amount<br>
creation_date<br>
due_date<br>
customer_id<br>

Fetch all invoices:

Requires admin token.
>GET /invoices
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/invoices', {
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
        "invoice_id": 37,
        "rental_id": 38,
        "status": "unpaid",
        "amount": 26,
        "creation_date": "2026-01-02T09:31:04.000Z",
        "due_date": "2026-02-01T09:31:04.000Z",
        "customer_id": 3
    },
    {
        "invoice_id": 36,
        "rental_id": 34,
        "status": "unpaid",
        "amount": 28,
        "creation_date": "2026-01-02T09:30:16.000Z",
        "due_date": "2026-02-01T09:30:16.000Z",
        "customer_id": 4
    },
    {
        "invoice_id": 35,
        "rental_id": 36,
        "status": "unpaid",
        "amount": 26,
        "creation_date": "2026-01-02T09:30:06.000Z",
        "due_date": "2026-02-01T09:30:06.000Z",
        "customer_id": 1
    },
    ...
]
```
Fetch all invoices belonging to a customer:

Requires admin token or customer token with matching id.

>GET /invoices/customer/:customer_id
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/invoices/customer/3', {
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
        "invoice_id": 2,
        "rental_id": 2,
        "status": "unpaid",
        "amount": 0,
        "creation_date": null,
        "due_date": "2026-01-01T00:00:00.000Z",
        "customer_id": 3
    },
    {
        "invoice_id": 7,
        "rental_id": 8,
        "status": "unpaid",
        "amount": 36,
        "creation_date": "2026-01-02T09:15:16.000Z",
        "due_date": "2026-02-01T09:15:16.000Z",
        "customer_id": 3
    }
]
```
Fetch one invoice:

Requires admin token or customer token with matching customer id.

>GET /invoices/:id
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/invoices/12', {
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
    "invoice_id": 12,
    "rental_id": 12,
    "status": "unpaid",
    "amount": 11,
    "creation_date": "2026-01-02T09:17:12.000Z",
    "due_date": "2026-02-01T09:17:12.000Z",
    "customer_id": 4
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
