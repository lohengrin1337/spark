// Handles database queries for zone data.

const pool = require('../../../database/database');


const zoneModel = {

    // Select id, city, type, coords and bikes for each zone
    sharedQuery: `
        SELECT 
            z.zone_id,
            z.city,
            z.zone_type,
            ST_AsText(z.coordinates) AS coordinates,
            JSON_ARRAYAGG(DISTINCT b.bike_id) AS bikes
        FROM spark_zone AS z
        LEFT JOIN bike AS b
        ON ST_Contains(z.coordinates, b.coordinates)
    `,

//   /**
//    * Fetch all zones and include bikes (id) contained in each zone
//    * @returns { Array } Array of zone objects.
//    * @throws { Error } If the query fails.
//    */
//   async getAllZones() {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         const zones = await conn.query(
//             this.sharedQuery + `
//             GROUP BY z.zone_id
//             ORDER BY city ASC, zone_id ASC`
//         );

//         // Remove null values from bikes array [null] -> []
//         zones.forEach(z => {
//             z.bikes = z.bikes.filter(Number.isInteger);
//         });

//         return zones;
//     } finally {
//         if (conn) conn.release();
//     }
//   },

//   /**
//    * Fetch all zones in database
//    * @returns { Array } Array of zone objects.
//    * @throws { Error } If the query fails.
//    */
//   async getAllZones() {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         const zones = await conn.query(
//             `SELECT 
//             zone_id,
//             city,
//             zone_type,
//             ST_AsText(coordinates) AS coordinates
//             FROM spark_zone
//             ORDER BY city ASC, zone_id ASC`);
//         return zones;
//     } finally {
//         if (conn) conn.release();
//     }
//   },
  
  /**
   * Fetch one zone, filter on zone_id.
   * @returns { object } Zone data as object.
   */
  async getZoneById(id) {
    let conn;
    try {
        conn = await pool.getConnection();

        const zone = await conn.query(
            this.sharedQuery + `
            WHERE z.zone_id = ?
            GROUP BY z.zone_id
            ORDER BY city ASC, zone_id ASC`,
            [id]
        );

        return zone[0];
    } finally {
        if (conn) conn.release();
    }
  },
  
//   /**
//    * Fetch one zone, filter on zone_id.
//    * @returns { object } Zone data as object.
//    */
//   async getZoneById(id) {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         const zone = await conn.query("SELECT * FROM spark_zone WHERE zone_id = ?", [id]);
//         return zone[0];
//     } finally {
//         if (conn) conn.release();
//     }
//   },

  /**
   * Fetch zones and include bikes (id) contained in each zone
   * Optional filter on city and type
   * @param { object } filter may contain city and/or type
   * @returns { Array } array of zones that match
   */
  async getZones(filter) {            
    let query = this.sharedQuery;

    const params = [];
    if (filter.city || filter.type) {
        query += " WHERE ";
        
        if (filter.city) {
            query += "z.city = ?";
            params.push(filter.city);
        }
        if (filter.city && filter.type) {
            query += " AND ";
        }
        if (filter.type) {
            query += "z.zone_type = ?";
            params.push(filter.type);
        }
    }

    query += `
        GROUP BY z.zone_id
        ORDER BY city ASC, zone_id ASC`;

    console.log(query);
    

    let conn;
    try {
        conn = await pool.getConnection();
        const zones = await conn.query(query, params);

        // Remove null values from bikes array [null] -> []
        zones.forEach(z => {
            z.bikes = z.bikes.filter(Number.isInteger);
        });

        return zones;
    } finally {
        if (conn) conn.release();
    }
  }

//   /**
//    * Fetch zones filtered on zone type
//    * @param { object } filter may contain city and/or zone_type
//    * @returns { Array } array of zones that match
//    */
//   async getFilteredZones(filter) {            
//     let query = this.sharedQuery;

//     const params = [];
//     if (filter) {
//         query += " WHERE ";
        
//         if (filter.city) {
//             query += "z.city = ?";
//             params.push(filter.city);
//         }
//         if (filter.city && filter.type) {
//             query += " AND ";
//         }
//         if (filter.type) {
//             query += "z.zone_type = ?";
//             params.push(filter.type);
//         }
//     }

//     query += `
//         GROUP BY z.zone_id
//         ORDER BY city ASC, zone_id ASC`;

//     let conn;
//     try {
//         conn = await pool.getConnection();
//         const zones = await conn.query(query, params);

//         // Remove null values from bikes array [null] -> []
//         zones.forEach(z => {
//             z.bikes = z.bikes.filter(Number.isInteger);
//         });

//         return zones;
//     } finally {
//         if (conn) conn.release();
//     }
//   }

//   /**
//    * Fetch zones filtered on zone type
//    * @param { object } filter may contain city and/or zone_type
//    * @returns { Array } array of zones that match
//    */
//   async getFilteredZones(filter) {
//     let conn;
//     let query = "SELECT * FROM spark_zone WHERE ";
//     const params = [];
//     if (filter.city) {
//         query += "city = ?";
//         params.push(filter.city);
//     }
//     if (filter.city && filter.type) {
//         query += " AND ";
//     }
//     if (filter.type) {
//         query += "zone_type = ?";
//         params.push(filter.type);
//     }
//     try {
//         conn = await pool.getConnection();
//         const zones = await conn.query(`${query};`, params);
//         return zones;
//     } finally {
//         if (conn) conn.release();
//     }
//   }
};

module.exports = zoneModel;
