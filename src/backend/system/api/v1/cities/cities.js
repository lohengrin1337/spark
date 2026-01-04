const router = require('express').Router();
const cityService = require('./cityService');
const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');

/**
 * GET all cities
 * Response: 200 ok and array of cities objects.
 */
router.get('/', auth.authToken, rateLimit.limiter, async (req, res) => {
    const cities = await cityService.getCities();
    res.status(200).json(cities);
});

/**
 * GET one city
 * Response: 200 ok and city object
 */
router.get('/:name', auth.authToken, rateLimit.limiter, async (req, res) => {
    const cityName = req.params.name;
    const city = await cityService.getOneCity(cityName);
    res.status(200).json(city);
});


module.exports = router;
