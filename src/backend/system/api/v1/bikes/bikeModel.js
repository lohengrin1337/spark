// bike model
// Handles database queries for bike data.

const pool = require('../../../database/database');
const bikes = { "Bike nr 1": 1, "Bike nr 2": 2};

const bikeModel = {
  /**
   * Fetch all bikes in database ordered by issued date.
   * @returns { Array } Array of bike objects.
   * @throws { Error } If the query fails.
   */
  async getAllBikes() {
    let conn;
    try {
        conn = await pool.getConnection();
        // const bikes = await conn.query("SELECT * FROM bike");
        return bikes;
    } catch (err) {
        console.error("GET /api/bikes error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one bike by id.
   * @param { number } id - bike id.
   * @returns { object|undefined } bike object if found.
   * @throws { Error } if query fails.
   */
  async getOneBike(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        // const bike = await conn.query("SELECT * FROM bike WHERE bike_id = ?", [id]);
        bikeId = id - 1
        const bike = bikes[bikeId];
        return bike[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = bikeModel;
