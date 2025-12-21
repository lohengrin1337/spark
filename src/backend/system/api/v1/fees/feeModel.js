// pricing model
// Handles database queries for fee data.

const pool = require('../../../database/database');
const date = new Date('2025-12-15');

const pricingModel = {

  /**
   * Fetch all price lists from db
   */
  async getAllFees() {
    let conn;
    try {
      conn = await pool.getConnection();
      const priceLists = await conn.query('SELECT * FROM fee');
      return priceLists;
    } catch (err) {
      console.error('Error, could not fetch price lists from database', err);
      throw err;
    } finally {
      if (conn) conn.release();
    }
  },

  /**
   * Fetch the latest (current) fee, which is the basis of the current pricing.
   */
  async getLatestFee() {
    let conn;
    try {
        conn = await pool.getConnection();
        const fee = await conn.query(
            'SELECT * FROM fee ORDER BY fee_id DESC LIMIT 1'
        );
        return fee[0];
    } finally {
        if (conn) conn.release();
    }
  },

  /**
   * Fetch one price list, defaults to current/latest.
   */
  async getFeesAtDate(dateTime) {
    let conn;
    try {
      conn = await pool.getConnection();
      const priceList = await conn.query(
        'SELECT * FROM fee WHERE updated <= ? LIMIT 1',
        [dateTime]
      );
      return priceList[0];
    } catch (err) {
      console.error('Error, could not fetch price list at date', err);
      throw err;
    } finally {
      if (conn) conn.release();
    }
  },

  /**
   * Insert a new fee row, which becomes the current pricing applied
   */
  async insertFee(fee) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `INSERT INTO fee (start, minute, discount, penalty) VALUES (?, ?, ?, ?)`,
        [fee.start, fee.minute, fee.discount, fee.penalty]
      );
    } finally {
      if (conn) conn.release();
    }
  }  
};

module.exports = pricingModel;