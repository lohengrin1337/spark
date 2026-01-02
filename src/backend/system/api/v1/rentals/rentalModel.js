// rental model
// Handles database queries for rental data.

const pool = require('../../../database/database');

const rentalModel = {
  /**
   * Fetch all rentals in database ordered by issued date.
   * @throws { Error } If the query fails.
   */
  async getAllRentals() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rentals = await conn.query(`
        SELECT 
         rental_id, 
         customer_id, 
         bike_id, 
         start_point, 
         start_time, 
         end_point, 
         end_time, 
         route,
         start_zone,
         end_zone
       FROM rental 
       ORDER BY start_time DESC`);
        return rentals;
    } catch (err) {
        console.error("GET /api/rentals error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one rental by id.
   * @param { number } id - rental id.
   * @throws { Error } if query fails.
   */
  async getOneRental(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rentals = await conn.query("SELECT * FROM rental WHERE rental_id = ?", [id]);
        return rentals[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch all rentals filtered on customer id.
   */
  async getRentalsByCustomer(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rentals = await conn.query(`SELECT * FROM rental WHERE customer_id = ?`, [id]);
        return rentals;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Create a new rental.
   * @param {number} customer_id
   * @param {number} bike_id
   * @param {object} start_point - GeoJSON point object.
   * @param {number} start_zone
   * Returns inserted rental_id.
   * @throws {Error} If query fails.
   */
  async createRental(customer_id, bike_id, start_point, start_zone) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO rental (customer_id, bike_id, start_point, start_zone, start_time) 
         VALUES (?, ?, ?, ?, NOW())`,
        [customer_id, bike_id, JSON.stringify(start_point), start_zone]
      );
      return result.insertId;
    } catch (err) {
      console.error("CREATE rental error:", err);
      throw err;
    } finally {
      if (conn) conn.release();
    }
  },

  /**
   * Complete an ongoing rental.
   * @param {number} id - Rental ID.
   * @param {object} end_point - GeoJSON point object.
   * @param {number} end_zone
   * @param {Array} route - Array of coordinates.
   * @returns {number} Number of affected rows (1 if successful).
   * @throws {Error} If query fails.
   */
  async completeRental(id, end_point, end_zone, route) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE rental
         SET end_point = ?, end_time = NOW(), end_zone = ?, route = ?
         WHERE rental_id = ? AND end_time IS NULL`,
        [JSON.stringify(end_point), end_zone, JSON.stringify(route), id]
      );
      return result.affectedRows;
    } catch (err) {
      console.error("COMPLETE rental error:", err);
      throw err;
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = rentalModel;
