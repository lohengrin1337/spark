// city model
// Handles database queries for city data.

const pool = require('../../../database/database');

const cityModel = {
  /**
   * Fetch all citys in database.
   * @returns { Array } Array of city objects.
   * @throws { Error } If the query fails.
   */
  async getAllCities() {
    let conn;
    try {
        conn = await pool.getConnection();
        const cities = await conn.query("SELECT * FROM city");
        return cities;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one city.
   * @param { string } name city name
   * @throws { Error } if query fails.
   */
  async getOneCity(name) {
    let conn;
    try {
        conn = await pool.getConnection();
        const city = await conn.query("SELECT * FROM city WHERE name = ?", [name]);
        return city[0];
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = cityModel;
