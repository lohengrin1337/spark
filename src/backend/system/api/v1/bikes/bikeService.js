// bike service

const bikeModel = require('./bikeModel.js');

/**
 * If no city parameter it gets all bikes,
 * otherwise it gets all bikes belonging to the city.
 * @param { string } city
 * @returns Array of bikes
 */
async function getAllBikes(city) {
    if (!city) {
        return bikeModel.getAllBikes();
    }
    return bikeModel.getBikesByCity(city);
}

async function getBikesByStatus(city, status) {
    if (!city) {
        return bikeModel.getBikesByStatus(status);
    }
    return bikeModel.getBikesCityStatus(city, status);
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
 * (Soft) delete one bike
 * @param { number } id bike id
 * @returns 1 if successful, 0 if not found
 */
async function removeBikeById(id) {
    return bikeModel.softDeleteBikeById(id);
}
/**
 * Update bike status
 * @param { number } id - bike id
 * @param { string } status - bike status to apply
 */
async function updateBikeStatus(id, status) {
    return bikeModel.updateBikeStatus(id, status);
}

module.exports = { getAllBikes, getBikeById, getBikesByStatus, removeBikeById, updateBikeStatus };
