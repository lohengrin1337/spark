const router = require('express').Router();

const rentalService = require('./rentalService');

const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');


/**
 * GET rentals
 * Response: 200 ok and array of rental objects.
 */
router.get('/', auth.authToken, rateLimit.limiter, auth.authAdmin, 
    async (req, res) => {
    const rentals = await rentalService.getRentals();
    res.status(200).json(rentals);
});

/**
 * GET /:id
 * Response: 200 ok and rental object or 404 not found.
 */
router.get('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
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

/**
 * Creates a new, initial, incomplete rental entry in the db.
 */
router.post('/', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, async (req, res) => {
    const { customer_id, bike_id, start_point, start_zone } = req.body;

    if (!customer_id || !bike_id || !start_point || !start_zone || typeof start_point !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    try {
        const rental_id = await rentalService.createRental(customer_id, bike_id, start_point, start_zone);
        res.status(201).json({ rental_id });
    } catch (err) {
        console.error('Create rental error:', err);
        res.status(500).json({ error: 'Failed to create rental' });
    }
});

/**
 * Completes an ongoing rental object by setting and persisting to the db
 * using the model. Returns the generated invoice created with the help of the
 * billing orchestration.
 */
router.put('/:id', auth.authToken, auth.authAdminOrUser, async (req, res) => {
    const { id } = req.params;
    const { end_point, end_zone, route } = req.body;

    if (!end_point || !end_zone || !Array.isArray(route)) {
        return res.status(400).json({ error: 'Invalid end_point, end_zone, or route' });
    }

    try {
        const invoice = await rentalService.completeRental(id, end_point, end_zone, route);
        res.status(200).json(invoice);
    } catch (err) {
        if (err.message === 'Rental not found or already completed') {
        return res.status(404).json({ error: err.message });
        }
        console.error('Complete rental error:', err);
        res.status(500).json({ error: 'Failed to complete rental' });
    }
});

module.exports = router;