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


/**
 * Gets all geographic zones for a city (used by simulator).
 * @param {string} name city name
 * @returns Array of zone objects with WKT
 */
async function getZonesForCity(name) {
  return cityModel.getZonesForCity(name);
}

module.exports = { getCities, getOneCity, getZonesForCity };