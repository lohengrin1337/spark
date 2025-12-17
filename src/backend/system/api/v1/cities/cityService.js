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
 * @param { string } name city name
 * @returns city as object (if found)
 */
async function getOneCity(name) {
    return cityModel.getOneCity(name);
}

module.exports = { getCities, getOneCity };
