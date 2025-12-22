const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const bikeService = require('./bikeService');

/**
 * GET bikes
 * Response: 200 ok and array of bike objects.
 */
router.get('/',
    async (req, res) => {
        const { city, status } = req.query;
        if (!status) {
            const bikes = await bikeService.getAllBikes(city);
            return res.status(200).json(bikes);
        }
        const bikes = await bikeService.getBikesByStatus(city, status);
        res.status(200).json(bikes);
});

/**
 * GET /:city
 * Response: 200 ok and bike objects or 404 not found.
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


module.exports = router;
