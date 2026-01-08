// Tests for rentals endpoint.
const request = require('supertest');
const app = require('../app');
process.env.NODE_ENV = "test";

describe('rentals endpoint', () => {
    it('should get all rentals', async () => {
        const res = await request(app).get('/api/v1/rentals', { headers: { 'Content-Type': 'application/json'} });
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('GET /rentals/customer/:customer_id', () => {
    it('should return all rentals belonging to customer with id 3', async () => {
        const res = await request(app).get('/api/v1/rentals/customer?customer=3');
        expect(res.statusCode).toEqual(200);
        expect(res.body[0].customer_id).toEqual(3);
    });
});

describe('GET /rentals/:id', () => {
    it('should return rental with id 1', async () => {
        const res = await request(app).get('/api/v1/rentals/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body.rental_id).toEqual(1);
    });
});

describe('POST /rentals', () => {
    it('should create a new row in the rental table', async () => {
        const res = await request(app)
        .post('/api/v1/rentals').send({ "customer_id": 1,
            "bike_id": 2,
            "start_point": {
                "lat": 55.60590627081738,
                "lng": 12.99375398054791
            },
            "start_zone": "free"
        });
        expect(res.statusCode).toEqual(201);
    });
});
