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
  },
  // cityModel.js — add this method

/**
 * Fetch all zones for a city, including speed_limit from zone_type table.
 * Uses ST_AsText() to get WKT strings for Python compatibility.
 * @param {string} cityName
 * @returns {Array} Array of { zone_type, coordinates_wkt, speed_limit }
 */
async getZonesForCity(cityName) {
  let conn;
  try {
    conn = await pool.getConnection();
    const zones = await conn.query(`
      SELECT 
        sz.zone_type,
        ST_AsText(sz.coordinates) AS coordinates_wkt,
        zt.speed_limit
      FROM spark_zone sz
      JOIN zone_type zt ON sz.zone_type = zt.zone_type
      WHERE sz.city = ?
    `, [cityName]);

    return zones;
  } catch (err) {
    console.error(`Error fetching zones for city ${cityName}:`, err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

};




module.exports = cityModel;
