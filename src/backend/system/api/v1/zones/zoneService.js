// zone services

const zoneModel = require('./zoneModel');

/**
 * Gets matching zones from model
 * Filters are optional
 * @returns Array of zones
 * @param { object } filter { city, type }
 */
async function getZones(filter) {
    return zoneModel.getZones(filter);
};


/**
 * Get one zone by zone_id
 * @returns zone object
 * @param { number } id - zone_id
 */
async function getZoneById(id) {
    return zoneModel.getZoneById(id);
};

module.exports = { getZones, getZoneById };
