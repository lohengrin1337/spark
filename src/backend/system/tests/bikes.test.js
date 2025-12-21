const request = require('supertest');
const app = require('../app');

describe('bikes endpoint', () => {

    it('should get all bikes', async () => {
        const res = await request(app).get('/api/v1/bikes');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('filter on status', () => {
    it('should return all available bikes', async () => {
        const res = await request(app).get('/api/v1/bikes?status=available');
        expect(res.statusCode).toEqual(200);
        expect(res.body[0].status).toEqual('available');
    })
});

describe('get a bike filtered on id', () => {
    it('should return bike with bike_id 5', async () => {
        const res = await request(app).get('/api/v1/bikes/5');
        expect(res.statusCode).toEqual(200);
        expect(res.body.bike_id).toEqual(5);
    })
})