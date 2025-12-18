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
        const zones = await conn.query("SELECT * FROM spark_zone");
        return zones;
    } catch (err) {
        console.error("GET /api/zones error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch one zone by type
   * @param { string } zoneType zone type
   * @returns { object|undefined } zone object if found.
   * @throws { Error } if query fails.
   */
  async getZoneByType(zoneType) {
    let conn;
    try {
        conn = await pool.getConnection();
        const sparkZone = await conn.query("SELECT * FROM spark_zone WHERE zone_type IN (?)", [zoneType]);
        console.log(zoneType);
        console.log(sparkZone);
        return sparkZone;
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
};

module.exports = zoneModel;
