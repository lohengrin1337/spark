// bike model
// Handles database queries for bike data.

const pool = require('../../../database/database');

const bikeModel = {

    /**
     * Fetches bikes from database.
     * Builds a query string based on which filters are sent in.
     * If filters do not contain status it filters on status not deleted.
     * @param { object } filters - optional query parameters
     */
    async getBikes(filters = {}) {
        let query = `SELECT b.* FROM bike AS b`;

        const where = [];
        const params = [];

        if (filters.zone_type) {
            query += `
            JOIN spark_zone AS z
            ON ST_Contains(z.coordinates, b.coordinates)
            `;
            where.push(`z.zone_type = ?`);
            params.push(filters.zone_type);
        }

        if (filters.city) {
            where.push(`b.city = ?`);
            params.push(filters.city);
        }

        if (filters.status) {
            where.push(`b.status = ?`);
            params.push(filters.status);
        }

        if (!filters.status) {
            where.push(`b.status != ?`);
            params.push("deleted");
        }

        if (where.length > 0) {
            query += ` WHERE ` + where.join(' AND ');
        }

        let conn;
        try {
            conn = await pool.getConnection();
            const bikes = await conn.query(query, params);
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
     * Updates the status for one bike.
     * @param { number } id - bike_id
     * @param { string } newStatus - new bike_status
     */
    async updateBikeStatus(id, newStatus) {
        let conn;
        try {
            conn = await pool.getConnection();

            const result = await conn.query(
                "UPDATE bike SET status = ? WHERE bike_id = ?", [newStatus, id]
            );
            return result.affectedRows;
        } finally {
            if (conn) conn.release();
        }
    },
};

module.exports = bikeModel;
