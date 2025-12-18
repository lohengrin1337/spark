// city model
// Handles database queries for city data.

const pool = require('../../../database/database');

const cityModel = {
  /**
   * Fetch all citys in database ordered by issued date.
   * @returns { Array } Array of city objects.
   * @throws { Error } If the query fails.
   */
  async getAllCities() {
    let conn;
    try {
        conn = await pool.getConnection();
        const cities = await conn.query("SELECT * FROM city");
        return cities;
    } catch (err) {
        console.error("GET /api/cities error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one city by id.
   * @param { string } name city name
   * @returns { object|undefined } city object if found.
   * @throws { Error } if query fails.
   */
  async getOneCity(name) {
    let conn;
    try {
        conn = await pool.getConnection();
        const city = await conn.query("SELECT * FROM city WHERE name = ?", [name]);
        return city[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = cityModel;
