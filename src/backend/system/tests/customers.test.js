//Tests for customers endpoint
const request = require('supertest');
const app = require('../app');
process.env.NODE_ENV = "test";

describe('GET /customers', () => {
    it('should get all customers', async () => {
        const res = await request(app).get('/api/v1/customers');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('GET /customers/:id', () => {
    it('should return costumer with id 4', async () => {
        const res = await request(app).get('/api/v1/customers/4');
        expect(res.statusCode).toEqual(200);
        expect(res.body.customer_id).toEqual(4);
    });
});

describe('PUT /customers', () => {
    it('should update customer name', async () => {
        const res = await request(app)
        .put('/api/v1/customers?customer_id=4').send({ "name": "Slagathor"});
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        console.log("Slagathor test");
    });
});
describe('PUT /customers, invalid id', () => {
    it('should throw a 404 not found', async () => {
        const res = await request(app)
        .put('/api/v1/customers/abc').send({ "name": "Slagathor"});
        expect(res.statusCode).toEqual(404);
    });
});
describe('GET /customers, invalid id', () => {
    it('should throw a 404 not found', async () => {
        const res = await request(app).get('/api/v1/customers/abc');
        expect(res.statusCode).toEqual(404);
    });
});
