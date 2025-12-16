// invoice model
// Handles database queries for invoice data.

const pool = require('../../../database/database');
const invoiceMock = [
    {
        "invoice_id": 1,
        "rental_id": 1,
        "status": "paid",
        "due_date": "2025-12-01"
    },
    {
        "invoice_id": 2,
        "rental_id": 2,
        "status": "unpaid",
        "due_date": "2025-12-01" 
    }
];

const invoiceModel = {
  /**
   * Fetch all invoices in database ordered by issued date.
   * @returns { Array } Array of invoice objects.
   * @throws { Error } If the query fails.
   */
  async getAllInvoices() {
    let conn;
    try {
        conn = await pool.getConnection();
        // const invoices = await conn.query("SELECT * FROM invoice");
        const invoices = invoiceMock;
        return invoices;
    } catch (err) {
        console.error("GET /api/invoices error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one invoice by id.
   * @param { number } id - Invoice id.
   * @returns { object|undefined } invoice object if found.
   * @throws { Error } if query fails.
   */
  async getOneInvoice(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        // const invoices = await conn.query("SELECT * FROM invoice WHERE invoice_id = ?", [id]);
        return invoiceMock.filter(invoice => invoice.invoice_id == id)[0];
        // return invoices[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  
  /**
   * Update an invoice
   * @param { number } id - invoice id.
  */
 async updateInvoice(status, id) {
     let conn;
     try {
        conn = await pool.getConnection();
        const invoice = invoiceMock.filter(invoice => invoice.invoice_id == id)[0];
        invoice.status = "paid";
        return invoice;
        //  await conn.query("UPDATE invoice SET status = ? WHERE invoice_id = ?", [status, id]);
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = invoiceModel;
