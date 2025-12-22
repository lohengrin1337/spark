const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const invoiceServices = require('./invoiceServices');

/**
 * GET invoices
 * Response: 200 ok and array of invoice objects.
 */
router.get('/',
    //authenticate, // koll valid token
    //validate, // koll valid request
    //authorize, // k
    async (req, res) => {
    const invoices = await invoiceServices.getInvoices();
    res.status(200).json(invoices);
});

/**
 * GET /:customer_id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:customer_id',
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const customerId = Number.parseInt(req.params.customer_id, 10);
    try {
        const invoice = await invoiceServices.getInvoiceByCustomer(customerId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found'});
        }
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }  
});

/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id',
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
router.put('/pay/:id', async (req, res) => {
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
router.put('/void/:id', async (req, res) => {
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
