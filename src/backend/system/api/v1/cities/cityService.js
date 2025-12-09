// city services

const cityModel = require('./cityModel.js');

/**
 * Gets all citys from model.
 * @returns Array of citys
 */
async function getCities() {
    return cityModel.getAllCities();
}

/**
 * Gets one city from model.
 * @param { number } id city id
 * @returns city as object (if found)
 */
async function getCityById(id) {
    return cityModel.getOneCity(id);
}

module.exports = { getCities, getCityById };
