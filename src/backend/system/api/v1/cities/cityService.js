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

module.exports = { getCities, getOneCity };
