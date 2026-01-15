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
        let query = `
        SELECT
        b.bike_id,
        b.city,
        b.status,
        b.coordinates,
        JSON_ARRAYAGG(
            JSON_OBJECT(
            'zone_id', z.zone_id,
            'zone_type', z.zone_type
            )
        ) AS zones
        FROM bike AS b
        JOIN spark_zone AS z
        ON ST_Within(b.coordinates, z.coordinates)`;

        const where = [];
        const params = [];

        if (filters.zone_type) {
            where.push(`z.zone_type = ?`);
            params.push(filters.zone_type);
        }

        if (filters.zone_id) {
            where.push(`z.zone_id = ?`);
            params.push(filters.zone_id);
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

        query += `GROUP BY b.bike_id`;
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
     * Returns all bike data, zone id and most specific zone type.
     * @param { number } id - bike id
     */
    async getBikeById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const bike = await conn.query(`
                SELECT
                b.bike_id,
                b.city,
                b.status,
                b.coordinates,
                z.zone_id,
                z.zone_type
                FROM bike AS b
                JOIN spark_zone AS z
                ON ST_Contains(z.coordinates, b.coordinates)
                WHERE
                b.bike_id = ?
                ORDER BY
                ST_Area(z.coordinates) ASC LIMIT 1`, [id]);

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

    /**
     * Soft deletes bike by id.
     * Sets status to deleted if not already deleted.
     * @param { number } id - bike id
     * @returns { number } number of affected rows (1 if deleted, 0 if not found or already deleted)
     * @throws { Error } if the query fails
     */
    async softDeleteBikeById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                "UPDATE bike SET status = 'deleted' WHERE bike_id = ? AND status != 'deleted'",
                [id]
            );
            return result.affectedRows;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * Update the status of a bike by id
     * @param { number } id - bike id
     * @param { string } newStatus - the new status value
     * @returns { Promise<number> } number of affected rows (1 if updated, 0 if not found)
     * @throws { Error } if the query fails
     */
    async updateBikeStatusById(id, newStatus) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                "UPDATE bike SET status = ? WHERE bike_id = ?",
                [newStatus, id]
            );
            return result.affectedRows;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * Update the status and coordinates of a bike by id (safe against deleted bikes).
     * @param { number } id - bike id
     * @param { string } newStatus - the new status value
     * @param { number } lat - current latitude
     * @param { number } lng - current longitude
     * @returns { Promise<number> } number of affected rows (1 if updated, 0 if not found or already deleted)
     * @throws { Error } if the query fails
     */
    async updateBikeStatusAndPositionById(id, newStatus, lat, lng) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                "UPDATE bike SET status = ?, coordinates = POINT(?, ?) WHERE bike_id = ? AND status != 'deleted'",
                [newStatus, lng, lat, id]
            );
            return result.affectedRows;
        } finally {
            if (conn) conn.release();
        }
    }
};

module.exports = bikeModel;
