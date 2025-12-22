// bike service

const bikeModel = require('./bikeModel.js');

/**
 * Gets all bikes from model.
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
    return bikeModel.getBikeById(id);
}

/**
 * (Soft) delete one bike
 * @param { number } id bike id
 * @returns 1 if successful, 0 if not found
 */
async function removeBikeById(id) {
    return bikeModel.softDeleteBikeById(id);
}


module.exports = { getAllBikes, getBikeById, getBikesByStatus, removeBikeById };
