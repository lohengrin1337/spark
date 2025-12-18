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
 * @param { number } zoneType zone type
 * @returns zone as object (if found)
 */
async function getZoneByType(zoneType) {
    return zoneModel.getOneZone(zoneType);
}

module.exports = { getZones, getZoneByType };
