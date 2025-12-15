const request = require('supertest');
const app = require('../app');

describe('customers endpoint', () => {

    it('should get all customers', async () => {
        const res = await request(app).get('/api/v1/customers');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
