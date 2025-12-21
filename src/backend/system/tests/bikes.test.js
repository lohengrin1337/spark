// Tests for bikes endpoint.
const request = require('supertest');
const app = require('../app');

describe('bikes endpoint', () => {

    it('GET /bikes', async () => {
        const res = await request(app).get('/api/v1/bikes');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('GET /bikes, filter on status', () => {
    it('should return all available bikes', async () => {
        const res = await request(app).get('/api/v1/bikes?status=available');
        expect(res.statusCode).toEqual(200);
        expect(res.body[0].status).toEqual('available');
    });
});

describe('GET /bikes, filter on bike_id', () => {
    it('should return bike with bike_id 5', async () => {
        const res = await request(app).get('/api/v1/bikes/5');
        expect(res.statusCode).toEqual(200);
        expect(res.body.bike_id).toEqual(5);
    });
});

describe('GET /bikes, invalid id', () => {
    it('should throw a 404 not found', async () => {
        const res = await request(app).get('/api/v1/bikes/abc');
        expect(res.statusCode).toEqual(404);
    });
});
