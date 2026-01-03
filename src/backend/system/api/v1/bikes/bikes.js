const router = require('express').Router();
// const validate = require('../middleware/validate.js');
const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');
const bikeService = require('./bikeService');

/**
 * If no query params it gets all non-deleted bikes in database.
 * Bikes may be filtered on any combination of city, status, zone_type
 * by adding query params.
 * (example: /bikes?city=malmö&zone_type=parking)
 * Response: 200 ok and array of bike objects.
 */
router.get('/',
    auth.authToken, 
    rateLimit.limiter,
    async (req, res) => {
        const filters = req.query;
        const bikes = await bikeService.getBikes(filters);
        res.status(200).json(bikes);
});

/**
 * GET /:id
 * Get bike with id = req.param.id.
 * Response: 200 ok and bike object or 404 not found.
 */
router.get('/:id', 
    auth.authToken, 
    rateLimit.limiter,
    auth.authAdminOrUser, 
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    async (req, res) => {
    const id = req.params.id;
    const bike = await bikeService.getBikeById(id);
    res.status(200).json(bike);
});

/**
 * PUT bikes/:id
 * Updates bike status
 */
router.put('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, async (req, res) => {
    const bikeId = req.params.id;
    const { status } = req.body;
    await bikeService.updateBikeStatus(bikeId, status);
    res.json({
        success: true,
        message: "Status updated"
    });
});

module.exports = router;
