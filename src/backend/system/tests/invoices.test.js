const request = require('supertest');
const app = require('../app');

describe('invoices endpoint', () => {

    it('should get all invoices', async () => {
        const res = await request(app).get('/api/v1/invoices');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
