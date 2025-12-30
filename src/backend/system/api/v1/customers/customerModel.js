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
  },

  /**
   * Update customer (name and password)
   * @param {string} id customer id
   * @param {array} fields column names
   * @param {array} values values
   */
  async updateCustomer(id, fields, values) {
    let conn;
    try {
      conn = await pool.getConnection();

      fields = fields.map(f => f + " = ?");

      const sql = `
        UPDATE customer
        SET ${fields.join(", ")}
        WHERE customer_id = ?
      `;

      values.push(id);

      console.log("sql", sql);
      console.log("values", values);
      

      const result = await conn.query(sql, values);

      if (!result.affectedRows === 1) {
        const err = new Error(`Customer with id '${id}' was not found`);
        err.name = "CustomerNotFoundError";
        err.status = 400;
        throw err;
      }

      return result.affectedRows;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  },

  /**
     * Toggle a customer's blocked status.
     * @param {number} id - Customer id.
     * @param {boolean} blocked - Desired blocked state (true = blocked, false = unblocked).
     * @returns {number} Number of affected rows (1 if updated, 0 if no change).
     * @throws {Error} If query fails.
     */
  async toggleCustomerBlocked(id, blocked) {
    let conn;
    try {
      conn = await pool.getConnection();

      const result = await conn.query(
        "UPDATE customer SET blocked = ? WHERE customer_id = ?",
        [blocked, id]
      );

      return result.affectedRows;
    } catch (err) {
      console.error("Error in toggleCustomerBlocked:", err);
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = customerModel;
