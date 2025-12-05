// request logic
// calls services with params and stuff
const invoiceServices = require('../../../services/invoiceServices');

/**
 * @returns all invoices in database.
 */
async function getInvoices(req, res) {
    try {
        const invoices = await invoiceServices.getInvoices();
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch'})
    }
}

/**
 * @returns invoice matching req param :id.
 */
async function getInvoiceById(req, res) {
    const invoiceId = req.params.id;
    try {
        const invoice = await invoiceServices.getInvoiceById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found'});
        }
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }
}
module.exports = { getInvoices, getInvoiceById };
