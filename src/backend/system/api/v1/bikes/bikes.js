const router = require('express').Router();
// const validate = require('../middleware/validate.js');
const auth = require('./../../../middleware/jwtauth')
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
<<<<<<< HEAD
router.put('/:id', async (req, res) => {
    const bikeId = req.params.id;
    const { status } = req.body;
    await bikeService.updateBikeStatus(bikeId, status);
    res.json({
        success: true,
        message: "Status updated"
    });
=======
router.put('/delete/:id', auth.authToken, auth.authAdmin, async (req, res) => {
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
>>>>>>> 1324bc8767762bd4a8aa9b44150e0559ec88ef6b
});

module.exports = router;
