const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const bikeService = require('./bikeService');

/**
 * GET bikes
 * Response: 200 ok and array of bike objects.
 */
router.get('/all',
    //authenticate, // koll valid token
    //validate, // koll valid request
    //authorize, // k
    async (req, res) => {
        const bikes = await bikeService.getAllBikes();
        res.status(200).json(bikes);
});

router.get('/',
    async (req, res) => {
        const { city, status } = req.query;
        // const { city } = req.query.city;
        console.log("req.query", req.query);
        console.log("query - city", city);
        console.log("query - status", status);
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
    try {
        const bike = await bikeService.getBikeById(id);
        if (!bike) {
            return res.status(404).json({ error: 'Not found'});
        }
        res.status(200).json(bike);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch - ${id}`});
    }  
});

module.exports = router;
