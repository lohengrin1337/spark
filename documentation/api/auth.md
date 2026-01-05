
## 1. Auth endpoint


Route to register a new customer with email/password.

>POST /auth/register

Required parameters:

>email
>
>password

```javascript
const newCustomer = {
    "email": "customer@mail.com",
    "password": "password"
}
const response = await fetch("http://localhost:3000/api/v1/auth/register", {
    body: JSON.stringify(newCustomer),
    headers: {
    'content-type': 'application/json'
    },
    method: 'POST'
});
const result = await response.json();
```
Result:
```
{
    "Token": <JWT with user info>
}

```
Customer login route

>POST /auth/login
```javascript
customer = {
    "email": "customer@mail.com",
    "password": "password"
}
const response = await fetch("http://localhost:3000/api/v1/auth/login", {
    body: JSON.stringify(customer),
    headers: {
    'content-type': 'application/json'
    },
    method: 'POST'
});
const result = await response.json();
```

Result:
```
{
    "Token": <JWT with user info>
}

```

Admin login route

>POST /auth/admin-login
```javascript
admin = {
    "adminId": "adminId",
    "password": "password"
}
const response = await fetch("http://localhost:3000/api/v1/auth/admin-login", {
    body: JSON.stringify(admin),
    headers: {
    'content-type': 'application/json'
    },
    method: 'POST'
});
const result = await response.json();
```

Result:
```
{
    "Token": <JWT with user info>
}

```

Third party login route

>POST /auth/third-party-login
```javascript
customer = {
    "thirdPartyId": "third@party.com",
    "password": "password"
}
const response = await fetch("http://localhost:3000/api/v1/auth/third-party-login", {
    body: JSON.stringify(customer),
    headers: {
    'content-type': 'application/json'
    },
    method: 'POST'
});
const result = await response.json();
```

Result:
```
{
    "Token": <JWT with user info>
}

```