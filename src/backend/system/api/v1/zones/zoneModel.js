// Handles database queries for zone data.

const pool = require('../../../database/database');

const zoneModel = {
  /**
   * Fetch all zones in database
   * @returns { Array } Array of zone objects.
   * @throws { Error } If the query fails.
   */
  async getAllZones() {
    let conn;
    try {
        conn = await pool.getConnection();
        const zones = await conn.query(
            `SELECT 
            zone_id,
            city,
            zone_type,
            ST_AsText(coordinates) AS coordinates
            FROM spark_zone
            ORDER BY city ASC, zone_id ASC`);
        return zones;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one zone, filter on zone_id.
   * @returns { object } Zone data as object.
   */
  async getZoneById(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const zone = await conn.query("SELECT * FROM spark_zone WHERE zone_id = ?", [id]);
        return zone[0];
    } finally {
        if (conn) conn.release();
    }
  },

  /**
   * Fetch zones filtered on zone type
   * @param { object } filter may contain city and/or zone_type
   * @returns { Array } array of zones that match
   */
  async getFilteredZones(filter) {
    let conn;
    let query = "SELECT * FROM spark_zone WHERE ";
    const params = [];
    if (filter.city) {
        query += "city = ?";
        params.push(filter.city);
    }
    if (filter.city && filter.type) {
        query += " AND ";
    }
    if (filter.type) {
        query += "zone_type = ?";
        params.push(filter.type);
    }
    try {
        conn = await pool.getConnection();
        const zones = await conn.query(`${query};`, params);
        return zones;
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = zoneModel;
