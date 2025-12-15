// pricing model
// Handles database queries for fee data.

const pool = require('../../../database/database');

const pricingModel = {
  /**
   * Fetch all price lists from db
   */
  async getPriceList() {
    let conn;
    try {
        conn = await pool.getConnection();
        const priceLists = await conn.query("SELECT * FROM fee");
        return priceLists;
    } catch (err) {
        console.error("Error, could not fetch price lists from database", err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
  }
//   /**
//    * Fetch one price list, defaults to current/latest.
//    */
//     async getOnePriceList(id) {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         if (!id) {
//             const priceList = await conn.query("SELECT * FROM fee ORDER BY fee_id DESC LIMIT 1");
//             return priceList[0];
//         } else {
//             const priceList = await conn.query("SELECT * FROM fee WHERE fee_id = ?", [id]);
//             return priceList[0];
//         }
//     } catch (err) {
//         console.error('');
//         throw err;
//     } finally {
//         if (conn) conn.release();
//     }
//   }
}


module.exports = pricingModel;
