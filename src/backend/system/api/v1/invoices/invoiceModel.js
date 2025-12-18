// invoice model
// Handles database queries for invoice data.

const pool = require('../../../database/database');

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
        const invoices = await conn.query("SELECT * FROM invoice");
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
        const invoices = await conn.query("SELECT * FROM invoice WHERE invoice_id = ?", [id]);
        return invoices[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one invoice by customer id.
   * @param { number } customerId - customer id.
   * @returns { object|undefined } invoice objects if found.
   * @throws { Error } if query fails.
   */
  async getOneInvoice(customerId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const invoices = await conn.query("SELECT * FROM invoice WHERE customer_id = ?", [customerId]);
        return invoices;
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
         await conn.query("UPDATE invoice SET status = ? WHERE invoice_id = ?", [status, id]);
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = invoiceModel;
