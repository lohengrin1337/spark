const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const bikeService = require('./bikeService');

/**
 * If no query params it gets all non-deleted bikes in database.
 * Bikes may be filtered on any combination of city, status, zone_type
 * by adding query params.
 * (example: /bikes?city=malmö&zone_type=parking)
 * Response: 200 ok and array of bike objects.
 */
router.get('/',
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
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const id = req.params.id;
    const bike = await bikeService.getBikeById(id);
    res.status(200).json(bike);
});

/**
 * Soft delete a bike by id
 */
router.put('/delete/:id', async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);

    if (!bikeId) {
        return res.status(400).json({ error: "Invalid bike id" });
    }

    try {
        const result = await bikeService.removeBikeById(bikeId);

        if (result === 0) {
            return res.status(404).json({ error: "Bike not found" });
        }

        res.status(200).json({ success: true, message: "Bike marked as deleted (soft deletion)" });
    } catch (err) {
        console.error("Error deleting bike:", err);
        res.status(500).json({ error: "Failed to delete bike" });
    }
});
/**
 * PUT bikes/:id
 * Updates bike status
 */
router.put('/:id', async (req, res) => {
    const bikeId = req.params.id;
    const { status } = req.body;
    await bikeService.updateBikeStatus(bikeId, status);
    res.json({
        success: true,
        message: "Status updated"
    });
});

module.exports = router;
