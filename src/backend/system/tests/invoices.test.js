// Tests for invoices endpoint.
const request = require('supertest');
const app = require('../app');
process.env.NODE_ENV = "test";

describe('invoices endpoint', () => {
    it('should get all invoices', async () => {
        const res = await request(app).get('/api/v1/invoices');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('GET /invoices/customer/:customer_id', () => {
    it('should return all invoices belonging to customer with id 3', async () => {
        const res = await request(app).get('/api/v1/invoices/customer/3');
        expect(res.statusCode).toEqual(200);
        expect(res.body[0].customer_id).toEqual(3);
    });
});

describe('GET /invoices/:id', () => {
    it('should return invoice with id 1', async () => {
        const res = await request(app).get('/api/v1/invoices/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body.invoice_id).toEqual(1);
    });
});
