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

// /**
//  * Gets all zones from model if no filter
//  * or filter on city and/or zone type.
//  * @returns Array of zones
//  * @param { object } filter
//  */
// async function getZones(filter) {
//     if (!filter.city && !filter.type) {
//         return zoneModel.getAllZones();
//     }
//     return zoneModel.getFilteredZones(filter);
// };


/**
 * Get one zone by zone_id
 * @returns zone object
 * @param { number } id - zone_id
 */
async function getZoneById(id) {
    return zoneModel.getZoneById(id);
};

module.exports = { getZones, getZoneById };
