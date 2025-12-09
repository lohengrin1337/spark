const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const invoiceServices = require('../../services/invoiceServices');

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
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id',
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const invoiceId = req.params;
    try {
        const invoice = await invoiceServices.getInvoiceById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found'});
        }
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }  
});

module.exports = router;
