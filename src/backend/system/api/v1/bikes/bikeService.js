// bike service

const bikeModel = require('./bikeModel.js');
const { redisPublisher } = require('../../../redis/redisClient');

/**
 * Gets all bikes from model.
 * @param { string } city
 * @returns Array of bikes
 */
async function getAllBikes(city) {
    if (!city) {
        return bikeModel.getAllBikes();
    }
    return bikeModel.getBikesByCity(city);
}

async function getBikesByStatus(city, status) {
    if (!city) {
        return bikeModel.getBikesByStatus(status);
    }
    return bikeModel.getBikesCityStatus(city, status);
}

/**
 * Gets one bike from model.
 * @param { number } id bike id
 * @returns bike as object (if found)
 */
async function getBikeById(id) {
    return bikeModel.getBikeById(id);
}

/**
 * (Soft) delete one bike
 * @param { number } id bike id
 * @returns 1 if successful, 0 if not found
 */
async function removeBikeById(id) {
    return bikeModel.softDeleteBikeById(id);
}
/**
 * Update the status of a bike
 * @param { number } id bike id
 * @param { string } newStatus the new status
 * @param { object } [opts]
 * @param { boolean } [opts.publishAdmin=false] publish to admin command channel
 * @returns number of affected rows (1 if updated, 0 if not found or already deleted)
 * @throws { Error } on invalid status or DB error
 */
async function updateBikeStatusById(id, newStatus, opts = {}) {
    const { publishAdmin = false } = opts;
  
    const allowedStatuses = [
      'available',
      'active',
      'reduced',
      'deactivated',
      'needService',
      'needCharging',
      'charging'
    ];
  
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'. Allowed: ${allowedStatuses.join(', ')}`);
    }
  
    const affectedRows = await bikeModel.updateBikeStatusById(id, newStatus);
  
    if (affectedRows === 1) {
      const uiDelta = JSON.stringify({
        id: parseInt(id),
        st: newStatus
      });
      await redisPublisher.publish('scooter:delta', uiDelta);
      console.log(`[BikeService] Published delta for frontend: bike ${id} → ${newStatus}`);
  
      if (publishAdmin) {
        const adminPayload = JSON.stringify({
          id: parseInt(id),
          status: newStatus
        });
        await redisPublisher.publish('admin:scooter_status_update', adminPayload);
        console.log(`[Admin-Status-Update] Published admin status update to simulator: Scooter ${id} -> ${newStatus}`);
      }
    }
  
    return affectedRows;
  }
  

module.exports = { getAllBikes, getBikeById, getBikesByStatus, removeBikeById, updateBikeStatusById };
