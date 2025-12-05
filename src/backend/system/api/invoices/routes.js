// invoice endpoints

const router = require('express').Router();
const invoiceController = require('./controller');

router.get('/', invoiceController.getInvoices);

module.exports = router;

//(in app.js add
// const invoiceRoutes = require('./invoices/routes');
// app.use('/invoices', invoiceRoutes);
// or something like that?)