// invoice endpoints
// each endpoint listed as a route with a method and
// a controller function
const router = require('express').Router();
const invoiceController = require('./controller');

/**
 * GET invoices
 * Response: 200 ok and array of invoice objects.
 */
router.get('/', invoiceController.getInvoices);
/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id', invoiceController.getInvoiceById);

module.exports = router;

//(in app.js add
// const invoiceRoutes = require('./invoices/routes');
// app.use('/invoices', invoiceRoutes);
// or something like that?)
