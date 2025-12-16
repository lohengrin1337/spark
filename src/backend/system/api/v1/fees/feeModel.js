// pricing model
// Handles database queries for fee data.

const pool = require('../../../database/database');
const date = new Date('2025-12-15');
const fees = [
    {
        "fee_id": date,
        "start": 20,
        "minute": 1,
        "discount": 10,
        "penalty": 15
    }
];
const pricingModel = {
  /**
   * Fetch all price lists from db
   */
  async getAllPriceLists() {
    let conn;
    try {
        conn = await pool.getConnection();
        // const priceLists = await conn.query("SELECT * FROM fee");
        const priceLists = fees;
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
    async getOnePriceList() {
    let conn;
    try {
        conn = await pool.getConnection();
        if (!id) {
            const priceList = await conn.query("SELECT * FROM fee ORDER BY fee_id DESC LIMIT 1");
            return priceList[0];
        } else {
            const priceList = await conn.query("SELECT * FROM fee WHERE fee_id = ?", [id]);
            return priceList[0];
        }
    } catch (err) {
        console.error('');
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
};


module.exports = pricingModel;
