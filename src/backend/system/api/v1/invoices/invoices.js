const router = require('express').Router();
// const validate = require('../middleware/validate.js');
const auth = require('./../../../middleware/jwtauth');
const invoiceServices = require('./invoiceServices');
const rateLimit = require('./../../../middleware/ratelimit');

/**
 * GET invoices
 * Response: 200 ok and array of invoice objects.
 */
router.get('/', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    //validate, // koll valid request
    async (req, res) => {
        const invoices = await invoiceServices.getInvoices(req.user);
        res.status(200).json(invoices);
});

/**
 * Gets all invoices belonging to a customer.
 * Response: 200 ok and invoice array or 404 not found.
 */
router.get('/customer/:customer_id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const customerId = Number.parseInt(req.params.customer_id, 10);
    try {
        const invoices = await invoiceServices.getInvoicesByCustomer(customerId);
        if (!invoices) {
            return res.status(404).json({ error: 'Invoices not found'});
        }
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }  
});

/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, 
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await invoiceServices.getInvoiceById(invoiceId);
    if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found'});
    }
    res.status(200).json(invoice);
});

/**
 * PUT /:id
 * Mark payment by setting invoice status to paid.
 */
router.put('/pay/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUser, async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) return res.status(400).json({ error: "Invalid ID" });

    const success = await invoiceServices.payInvoice(invoiceId);
    if (!success) {
        return res.status(500).json({ error: 'Internal server error'});
    }
    res.status(200).json({ success: true, message: "Payment recorded" });
});

/**
 * PUT /void/:id
 * Void an invoice by setting its status to 'void'.
 */
router.put('/void/:id', auth.authToken, rateLimit.limiter, auth.authAdmin, async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const success = await invoiceServices.voidInvoice(invoiceId);
    if (!success) {
        return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ success: true, message: "Invoice successfully voided" });
});

module.exports = router;
