const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const customerServices = require('./customerServices');
const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');

/**
 * GET customers
 * Gets all customers from database.
 * Requires role: admin in token.
 * Response: 200 ok and array of customer objects.
 */
router.get('/', auth.authToken, rateLimit.limiter, auth.authAdminOrDevice, 
    //authenticate, // koll valid token
    //validate, // koll valid request
    async (req, res) => {
    const customers = await customerServices.getCustomers();
    res.status(200).json(customers);
});

/**
 * Get customer data for one logged in customer.
 * Update later to work for admin to search for customers?
 */
router.get('/search', auth.authToken, auth.authAdminOrUser,
    async (req, res) => {
        const customer = req.query.customer;//customers/search?customer=<tex id>
        const customerData = await customerServices.getCustomerById(customer, req.user);
    if (!customerData) {
        return res.status(404).json({ error: 'Customer not found'});
    }
    res.status(200).json(customerData);
    }
);
/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 * Admin har tillgång till alla, user bara till sin egen
 */
router.get('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    async (req, res) => {
    const customerId = req.params.id;
    const customer = await customerServices.getCustomerById(customerId, req.user);
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found'});
    }
    res.status(200).json(customer);
});

/**
 * PUT /:id
 * Update a customer
 * Response: 200 ok or 404 not found.
 * Admin can update all, user just their self
 */
router.put('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    async (req, res) => {
    const customerId = req.query.customer_id;
    const { name, password = null } = req.body;
    await customerServices.updateCustomer(customerId, name, password, req.user);
    res.json({
        success: true,
        message: "Customer updated"
    });
});

/**
 * PUT route that blocks/unblocks a given customer/user given its current blocked status
 */
router.put('/block/:id', auth.authToken, rateLimit.limiter, auth.authAdmin, async (req, res) => {
    const customerId = parseInt(req.params.id, 10);
    const { blocked } = req.body;

    if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer id" });
    }

    if (typeof blocked !== 'boolean') {
        return res.status(400).json({ error: "'blocked' must be true or false" });
    }

    try {
        const affectedRows = await customerServices.changeCustomerBlocked(customerId, blocked);

        if (affectedRows === 0) {
            return res.json({ 
                success: false, 
                message: "Error: customer could not be found, or the attempted toggle is moot" 
            });
        }

        res.json({
            success: true,
            message: blocked ? "Kund spärrad" : "Kund avspärrad"
        });
    } catch (err) {
        console.error("Error toggling customer blocked status:", err);
        res.status(500).json({ success: false, error: "Error when updating" });
    }
});
module.exports = router;
