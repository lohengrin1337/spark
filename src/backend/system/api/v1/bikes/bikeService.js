// bike service

const bikeModel = require('./bikeModel.js');
const { redisPublisher } = require('../../../redis/redisClient');

/**
 * Returns array of bikes.
 * @param { object } filters - what to filter the query on
 * If no filters it returns all bikes.
 */
async function getBikes(filters) {
    return bikeModel.getBikes(filters);
}

/**
 * Gets one bike from model.
 * @param { number } id bike id
 * @returns bike as object (if found)
 */
async function getBikeById(id) {
    const bike = await bikeModel.getBikeById(id);
    if (!bike) {
        const err = new Error(`No bike with id ${id} found`);
        err.status = 404;
        throw err;
    }
    return bike;
}

/**
 * Update bike status
 * @param { number } id - bike id
 * @param { string } status - bike status to apply
 */
async function updateBikeStatus(id, status) {
    return bikeModel.updateBikeStatus(id, status);
}

/**
 * Soft delete bike by id.
 * @param { number } id - bike id
 * @returns number of affected rows (1 if deleted, 0 if not found or already deleted)
 * @throws { Error } on DB error
 */
async function removeBikeById(id) {
    return bikeModel.softDeleteBikeById(id);
}

/**
 * Update the status of a bike
 * @param { number } id bike id
 * @param { string } newStatus the new status
 * @param { object } [opts]
 * @param { boolean } [opts.publishAdmin=false] publish to admin command channel
 * @returns number of affected rows (1 if updated, 0 if not found or already deleted)
 * @throws { Error } on invalid status or DB error
 */
async function updateBikeStatusById(id, newStatus, opts = {}) {
    const { publishAdmin = false } = opts;

    const allowedStatuses = [
        'available',
        'active',
        'reduced',
        'deactivated',
        'needService',
        'needCharging',
        'charging'
    ];

    if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status '${newStatus}'. Allowed: ${allowedStatuses.join(', ')}`);
    }

    const affectedRows = await bikeModel.updateBikeStatusById(id, newStatus);

    if (affectedRows === 1) {
        // Frontend delta channel
        const uiDelta = JSON.stringify({
            id: parseInt(id, 10),
            st: newStatus
        });
        await redisPublisher.publish('scooter:delta', uiDelta);

        // Admin command channel (used to sync simulator-admin events)
        if (publishAdmin) {
            const adminPayload = JSON.stringify({
                id: parseInt(id, 10),
                status: newStatus
            });
            await redisPublisher.publish('admin:scooter_status_update', adminPayload);
        }
    }

    return affectedRows;
}

module.exports = { getBikes, getBikeById, updateBikeStatus, removeBikeById, updateBikeStatusById };
