// rental model
// Handles database queries for rental data.

const pool = require('../../../database/database');

const rentalModel = {
  /**
   * Fetch all rentals in database ordered by issued date.
   * @returns { Array } Array of rental objects.
   * @throws { Error } If the query fails.
   */
  async getAllRentals() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rentals = await conn.query("SELECT * FROM rental");
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
   * @returns { object|undefined } rental object if found.
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
  }
};

module.exports = rentalModel;
