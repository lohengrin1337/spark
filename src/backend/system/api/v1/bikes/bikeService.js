// bike service

const bikeModel = require('./bikeModel.js');

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

module.exports = { getBikes, getBikeById, updateBikeStatus };
