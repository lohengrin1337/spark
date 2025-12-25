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
    return invoiceModel.getInvoiceById(id);
}
/**
 * Gets one invoice from model.
 * @param { number } customer_id customer id
 * @returns invoice as object (if found)
 */
async function getInvoicesByCustomer(customer_id) {
    return invoiceModel.getInvoicesByCustomer(customer_id);
}

/**
 * Marks an invoice as paid.
 * @param { number } id invoice id
 * @returns void
 */
async function payInvoice(id) {
    return invoiceModel.updateInvoice("paid", id);
}

/**
 * Marks an invoice as void.
 * @param { number } id - Invoice id
 * @returns { boolean } true if update was successful (one row affected)
 */
async function voidInvoice(id) {
    const affectedRows = await invoiceModel.updateInvoice("void", id);
    return affectedRows === 1;
}

module.exports = { getInvoices, getInvoiceById, payInvoice, voidInvoice, getInvoicesByCustomer };
