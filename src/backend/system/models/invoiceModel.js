// invoice model
const pool = require('../config/database');

const invoiceModel = {
  // Get all invoices, ordered by issued date
  async getAllInvoices() {
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM invoices ORDER BY issued_date");
        res.json(rows);
    } catch (err) {
        console.error("GET /api/invoices error:", err);
        res.status(500).json({ error: "Database error" });
    } finally {
        if (conn) conn.release();
    }
  }
}

module.exports = invoiceModel;