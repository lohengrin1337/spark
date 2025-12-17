// invoice services

const invoiceModel = require('./invoiceModel');

/**
 * Gets all invoices from model.
 * @returns Array of invoices
 */
async function getInvoices() {
    return invoiceModel.getAllInvoices();
}

/**
 * Gets one invoice from model.
 * @param { number } id invoice id
 * @returns invoice as object (if found)
 */
async function getInvoiceById(id) {
    return invoiceModel.getOneInvoice(id);
}

/**
 * Marks an invoice as paid.
 * @param { number } id invoice id
 * @returns void
 */
async function payInvoice(id) {
    return invoiceModel.updateInvoice("paid", id);
}

module.exports = { getInvoices, getInvoiceById, payInvoice };
