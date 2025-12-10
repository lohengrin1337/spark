const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const bikeService = require('./bikeService');

/**
 * GET invoices
 * Response: 200 ok and array of bike objects.
 * Kanske bara admin som ska ha access?
 */
router.get('/',
    //authenticate, // koll valid token
    //validate, // koll valid request
    //authorize, // k
    async (req, res) => {
    const bikes = await bikeService.getBikes();
    console.log(bikes);
    res.status(200).json(bikes);
});

/**
 * GET /:id
 * Response: 200 ok and bike object or 404 not found.
 * Admin har tillgång till alla, user bara till sin egen
 */
router.get('/:id',
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const bikeId = req.params.id;
    try {
        const bike = await bikeService.getBikeById(bikeId);
        if (!bike) {
            return res.status(404).json({ error: 'Vehicle not found'});
        }
        res.status(200).json(bike);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch - ${bikeId}`});
    }  
});

module.exports = router;
