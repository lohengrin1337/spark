const router = require('express').Router();

const rentalService = require('./rentalService');

/**
 * GET rentals
 * Response: 200 ok and array of rental objects.
 */
router.get('/',
    async (req, res) => {
    const rentals = await rentalService.getRentals();
    res.status(200).json(rentals);
});

/**
 * GET /:id
 * Response: 200 ok and rental object or 404 not found.
 */
router.get('/:id',
    async (req, res) => {
    const rentalId = req.params.id;
    try {
        const rental = await rentalService.getRentalById(rentalId);
        if (!rental) {
            return res.status(404).json({ error: 'Rental not found'});
        }
        res.status(200).json(rental);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }  
});

module.exports = router;
