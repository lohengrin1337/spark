const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const customerServices = require('./customerServices');

/**
 * GET invoices
 * Response: 200 ok and array of customer objects.
 * Kanske bara admin som ska ha access?
 */
router.get('/',
    //authenticate, // koll valid token
    //validate, // koll valid request
    //authorize, // k
    async (req, res) => {
    const customers = await customerServices.getCustomers();
    res.status(200).json(customers);
});

/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 * Admin har tillgång till alla, user bara till sin egen
 */
router.get('/:id',
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const customerId = req.params.id;
    try {
        const customer = await customerServices.getCustomerById(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found'});
        }
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch - ${customerId}`});
    }  
});

module.exports = router;
