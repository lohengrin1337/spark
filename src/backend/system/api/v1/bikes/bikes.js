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
router.put('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUserOrDevice, async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if(isNaN(bikeId)) {
        const err = new Error("Invalid bike id");
        err.name = "InvalidIdError";
        err.status = 400;
    }

    if (!status) {
        const err = new Error("Bike status is required");
        err.name = "InvalidBodyError";
        err.status = 400;
    }

    await bikeService.updateBikeStatus(bikeId, status);
    res.json({
        success: true,
        message: "Status updated"
    });
});

module.exports = router;
