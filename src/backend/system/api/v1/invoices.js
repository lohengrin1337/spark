const express = require("express");
const invoiceServices = require('../../services/invoiceServices');
const router = require('express').Router();

/**
 * GET invoices
 * Response: 200 ok and array of invoice objects.
 */
router.get('/', async (req, res) => {
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
});

/**
 * GET /:id
 * Response: 200 ok and invoice object or 404 not found.
 */
router.get('/:id', async (req, res) => {
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
});

module.exports = router;
