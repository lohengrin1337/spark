const invoiceModel = require('../models/invoiceModel');

async function getInvoices() {
    return invoiceModel.getAllInvoices();
}


module.exports = { getInvoices};