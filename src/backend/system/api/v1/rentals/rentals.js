// rentalRoutes.js

const router = require('express').Router();

const rentalService = require('./rentalService');
const bikeService = require('../bikes/bikeService');

const {
  createRentalWithAccurateStartZone,
  completeRentalUsingRouteTail,
  publishRentalStarted,
  publishRentalEnded,
} = require('./rentalHelpers');

const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');


/**
 * GET rentals
 * Returns all rentals, active and finished.
 */
router.get('/', auth.authToken, rateLimit.limiter, auth.authAdminOrDevice, 
    async (req, res) => {
    const rentals = await rentalService.getRentals();
    res.status(200).json(rentals);
});

/**
 * GET rentals filtered on customer
 */
router.get('/customer', auth.authToken, auth.authAdminOrUser,
    async (req, res) => {
        const customer = req.query.customer;
        const rentals = await rentalService.getRentalsByCustomer(customer, req.user);
        res.status(200).json(rentals);
});

/**
 * GET /:id
 * Response: 200 ok and rental object or 404 not found.
 */
router.get('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    async (req, res) => {
    const rentalId = req.params.id;
    const rental = await rentalService.getRentalById(rentalId, req.user);
    if (!rental) {
        const err = new Error(`Rental with id ${rentalId} not found.`);
        err.status = 404;
        throw err;
    }
    res.status(200).json(rental); 
});


/**
 * Simulator create rental endpoint. (Differention useful and necessary)
 */
router.post('/', auth.authToken, rateLimit.limiter, auth.authAdminOrUserOrDevice, async (req, res) => {
    const { customer_id, bike_id, start_point, start_zone } = req.body;

  if (!customer_id || !bike_id || !start_point || !start_zone) {
    return res.status(400).json({ error: 'Missing fields' });
  }

    try {
        const rental_id = await rentalService.createRental(customer_id, bike_id, start_point, start_zone);
        // res.status(201).json({ rental_id });
        res.status(201).json({ rental_id: rental_id.toString() });
    } catch (err) {
        console.error('Create rental error:', err);
        res.status(500).json({ error: 'Failed to create rental' });
    }
});

/**
 * Simulator complete rental endpoint.
 */
router.put('/:id', auth.authToken, auth.authAdminOrUserOrDevice, async (req, res) => {
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
    console.error('[Rentals][sim complete] error:', err);
    res.status(500).json({ error: 'Failed to complete rental' });
  }
});

/**
 * User-app create rental endpoint
 * 
 * - bike status set to active as rental is created (= begins)
 * - publish rental_started after DB insert for simulation sync, whilst keeping the
 *   rental lifecycle itself decoupled and independent of the simulator.
 */
router.post('/user', async (req, res) => {
  const { customer_id, bike_id, start_point, user_name } = req.body;

  if (!customer_id || !bike_id || !start_point || typeof start_point !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  try {
    const { rental_id, start_zone, city } = await createRentalWithAccurateStartZone({
      customer_id,
      bike_id,
      start_point,
      user_name,
    });

    // Update and set bike to active status
    await bikeService.updateBikeStatusById(bike_id, 'active', { publishAdmin: false });

    // Tell the simulator to enter external rental mode via the threadded rental_listener
    await publishRentalStarted({
      rental_id,
      scooter_id: bike_id,
      user_id: customer_id,
      user_name,
    });

    res.status(201).json({ rental_id, start_zone, city });
  } catch (err) {
    if (err.code === 'INVALID_START_POINT') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[Rentals][user create] error:', err);

    console.error('[Rentals][user create] error:', err?.message, err?.stack);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

/**
 * User-app ends rental definitively.
 * - loads route from Redis
 * - derives end_point from route[-1]
 * - computes end_zone
 * - completes rental + invoice
 * - publishes rental_ended (so that the simulator exits external mode, and the bike
 *   is made available again for rental/simulator route rental flow)
 */
router.put('/user/:id', async (req, res) => {
  const rentalId = req.params.id;

  try {
    const { invoice, scooter_id } = await completeRentalUsingRouteTail(rentalId);

    await publishRentalEnded({
      rental_id: rentalId,
      scooter_id,
    });

    await bikeService.updateBikeStatusById(scooter_id, 'available', { publishAdmin: false });

    res.status(200).json(invoice);
  } catch (err) {
    if (err.code === 'NO_ROUTE_DATA') return res.status(400).json({ error: err.message });
    if (err.code === 'NOT_FOUND' || err.message === 'Rental not found or already completed') {
      return res.status(404).json({ error: 'Rental not found or already completed' });
    }
    console.error('[Rentals][user end] error:', err);
    res.status(500).json({ error: 'Failed to complete rental' });
  }
});

module.exports = router;
