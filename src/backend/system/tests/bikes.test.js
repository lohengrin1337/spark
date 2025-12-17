const request = require('supertest');
const app = require('../app');

describe('bikes endpoint', () => {

    it('should get all bikes', async () => {
        const res = await request(app).get('/api/v1/bikes');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
