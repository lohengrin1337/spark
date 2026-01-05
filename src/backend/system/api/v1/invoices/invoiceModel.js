// invoice model
// Handles database queries for invoice data.

const pool = require('../../../database/database');

const invoiceModel = {
  /**
   * Fetch all invoices in database ordered by issued date.
   * Returns all invoice data plus customer_id from rental.
   * @returns { Array } Array of invoice objects.
   * @throws { Error } If the query fails.
   */
  async getAllInvoices() {
    let conn;
    try {
        conn = await pool.getConnection();
        const invoices = await conn.query(`
            SELECT i.*,
            c.customer_id
            FROM invoice AS i
            JOIN rental AS r
            ON i.rental_id = r.rental_id
            JOIN customer AS c
            ON c.customer_id = r.customer_id
            ORDER BY i.invoice_id DESC`);
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
  async getInvoiceById(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const invoices = await conn.query(`
            SELECT i.*,
            r.customer_id
            FROM invoice AS i
            JOIN rental AS r
            ON i.rental_id = r.rental_id
            WHERE invoice_id = ?
            `,
            [id]);
        return invoices[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
    /**
     * Fetch invoices by customer id.
     * @param { number } customerId - customer id.
     * @returns { object|undefined } invoice array if found.
     * @throws { Error } if query fails.
     */
    async getInvoicesByCustomer(customerId) {
        let conn;
        try {
            conn = await pool.getConnection();
            const invoices = await conn.query(
                `SELECT i.*,
                r.customer_id
                FROM invoice AS i
                JOIN rental AS r ON i.rental_id = r.rental_id
                WHERE r.customer_id = ?
                `,
                [customerId]);
            return invoices;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * Updates the status of an existing invoice.
     * @param { string } status - The new status value (e.g. 'paid', 'void')
     * @param { number } id     - Invoice id
     * Returns number of affected rows (normally 1 on success)
     * @throws { Error } If query fails
     */
    async updateInvoice(status, id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                "UPDATE invoice SET status = ? WHERE invoice_id = ?",
                [status, id]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Invoice status update error:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },
    /**
     * Create a new invoice.
     * @param { number } rentalId - Rental id.
     * @param { number } amount - Final invoice amount.
     * @param { Date } dueDate - Due date for the invoice.
     * @returns { number } Created invoice id.
     * @throws { Error } If query fails.
     */
    async createInvoice({ rental_id, amount, due_date }) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                `INSERT INTO invoice
                 (rental_id, amount, creation_date, due_date)
                 VALUES (?, ?, NOW(), ?)`,
                [rental_id, amount, due_date]
            );
            return result.insertId;
        } catch (err) {
            console.error('Invoice creation error:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

};

module.exports = invoiceModel;
