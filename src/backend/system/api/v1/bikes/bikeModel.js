// bike model
// Handles database queries for bike data.

const pool = require('../../../database/database');

const bikeModel = {
  /**
   * Fetch all bikes in database.
   * @returns { Array } Array of bike objects.
   * @throws { Error } If the query fails.
   */
  async getAllBikes() {
    let conn;
    try {
        conn = await pool.getConnection();
        const bikes = await conn.query("SELECT * FROM bike WHERE status != 'deleted'");
        return bikes;
    } catch (err) {
        console.error("GET /api/bikes error:", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch bikes by city.
   * @param { string } city
   * @returns { object|undefined } bike objects if found.
   * @throws { Error } if query fails.
   */
  async getBikesByCity(city) {
    let conn;
    try {
        conn = await pool.getConnection();
        const bikes = await conn.query("SELECT * FROM bike WHERE city = ?", [city]);
        return bikes;
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  async getBikesByStatus(status) {
    let conn;
    try {
        conn = await pool.getConnection();
        const bikes = await conn.query("SELECT * FROM bike WHERE status = ?", [status]);
        return bikes;
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  async getBikesCityStatus(city, status) {
    let conn;
    try {
        conn = await pool.getConnection();
        const bikes = await conn.query("SELECT * FROM bike WHERE city = ? AND status = ?", [city, status]);
        return bikes;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Fetch bike by id.
   * @param { number } id - bike id
   */
  async getBikeById(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        const bike = await conn.query("SELECT * FROM bike WHERE bike_id = ?", [id]);
        return bike[0];
    } finally {
        if (conn) conn.release();
    }
  },
  /**
     * (Soft) delete bike by id.
     * @param { number } id - bike id
     */
    async softDeleteBikeById(id) {
        let conn;
        try {
            conn = await pool.getConnection();

            const result = await conn.query(
                "UPDATE bike SET status = 'deleted' WHERE bike_id = ?",
                [id]
            );
            return result.affectedRows;
        } finally {
            if (conn) conn.release();
        }
    }

};

module.exports = bikeModel;
