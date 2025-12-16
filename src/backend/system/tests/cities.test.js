const request = require('supertest');
const app = require('../app');

describe('cities endpoint', () => {

    it('should get all cities', async () => {
        const res = await request(app).get('/api/v1/cities');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
