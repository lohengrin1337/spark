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
        const priceLists = await conn.query("SELECT * FROM fee");
        console.log(priceLists);
        return priceLists;
    } catch (err) {
        console.error("Error, could not fetch price lists from database", err);
        throw err;
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
        const priceList = await conn.query("SELECT * FROM fee WHERE updated <= ? LIMIT 1", [dateTime]);
        return priceList[0];
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Insert new fee.
   */
  async updateFee(newFee) {
    console.log(newFee);
  }
};


module.exports = pricingModel;
