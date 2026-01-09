// city services

const cityModel = require('./cityModel.js');

/**
 * Gets all citys from model.
 * @returns Array of cities
 */
async function getCities() {
    return cityModel.getAllCities();
}

/**
 * Gets one city from model.
 * @param { string } name city name
 * @returns city as object or 404 not found
 */
async function getOneCity(name) {
    const city = await cityModel.getOneCity(name);
    if (!city) {
        const err = new Error('City not found');
        err.status = 404;
        throw err;
    }
    return city;
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