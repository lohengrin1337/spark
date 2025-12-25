// Tests for citites endpoint
const request = require('supertest');
const app = require('../app');
process.env.NODE_ENV = "test";

describe('GET /cities', () => {

    it('should get all cities', async () => {
        const res = await request(app).get('/api/v1/cities');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('GET /cities/:name, filter on name', () => {
    it('should return one city (malmö) as an object', async () => {
        const res = await request(app).get('/api/v1/cities/malmö');
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Malmö');
    });
});

describe('GET /cities/:name - wrong city name', () => {
    it('should return a 404 not found error', async () => {
        const res = await request(app).get('/api/v1/cities/skellefteå');
        expect(res.statusCode).toEqual(404);
    });
});
