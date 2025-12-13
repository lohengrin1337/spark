// zone services

const zoneModel = require('./zoneModel');

/**
 * Gets all zones from model.
 * @returns Array of zones
 */
async function getZones() {
    return zoneModel.getAllZones();
}

/**
 * Gets one zone from model.
 * @param { number } id zone id
 * @returns zone as object (if found)
 */
async function getZoneById(id) {
    return zoneModel.getOneZone(id);
}

module.exports = { getZones, getZoneById };
