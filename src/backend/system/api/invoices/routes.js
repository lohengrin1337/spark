// invoice endpoints
// each endpoint listed as a route with a method and
// a controller function
const router = require('express').Router();
const invoiceController = require('./controller');

/**
 * GET invoices
 * Returns an array of all invoices in the database.
 * Response: 200 ok and array of invoice objects.
 */
router.get('/', invoiceController.getInvoices);
/**
 * GET /:id
 * Returns invoice that matches query param :id
 * @param id Invoice id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id', invoiceController.getInvoiceById);

module.exports = router;

//(in app.js add
// const invoiceRoutes = require('./invoices/routes');
// app.use('/invoices', invoiceRoutes);
// or something like that?)