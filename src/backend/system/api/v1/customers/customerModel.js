// invoice model
// Handles database queries for invoice data.

const pool = require('../../../database/database');

const customerModel = {
  /**
   * Fetch all customers in database ordered by issued date.
   * @returns { Array } Array of customer objects.
   * @throws { Error } If the query fails.
   */
  async getAllCustomers() {
    let conn;
    try {
        conn = await pool.getConnection();
        const customers = await conn.query("SELECT * FROM customer");
        return customers;
    } catch (err) {
        console.error("GET /api/customers error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one customer by id.
   * @param { number } id - customer id.
   * @returns { object|undefined } customer object if found.
   * @throws { Error } if query fails.
   */
  async getOneCustomer(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const customer = await conn.query("SELECT * FROM customer WHERE customer_id = ?", [id]);
        return customer[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = customerModel;
