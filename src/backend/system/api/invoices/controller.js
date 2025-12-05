// request logic

const invoices = require('../../services/invoiceServices');

async function getInvoices(req, res) {
    try {
        const invoices = await invoices.getInvoices();
        res.json(invoices);
    } catch (err) {
        res.status(500).json({})
    }
}

module.exports = { getInvoices };