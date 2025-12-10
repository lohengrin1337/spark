// bike service

const bikeModel = require('./bikeModel.js');

/**
 * Gets all bikes from model.
 * @returns Array of bikes
 */
async function getBikes() {
    return bikeModel.getAllBikes();
}

/**
 * Gets one bike from model.
 * @param { number } id bike id
 * @returns bike as object (if found)
 */
async function getBikeById(id) {
    return bikeModel.getOneBike(id);
}

module.exports = { getBikes, getBikesById };
