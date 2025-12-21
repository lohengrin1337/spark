/**
 * Calculates the rental cost based on start and end zones and duration.
 * @param {string} startZone - "parking" | "charging" | "free"
 * @param {string} endZone   - "parking" | "charging" | "free"
 * @param {number} durationMinutes - Rental duration in minutes
 * @param {fee} fee - Object containing the current pricing details
 * @returns {number|null} Total cost in SEK or null if endZone is invalid
 */
function calculateRentalCost(startZone, endZone, durationMinutes, fee) {
    const startedInValidZone =
      startZone === 'parking' || startZone === 'charging';
  
    const endedInValidZone =
      endZone === 'parking' || endZone === 'charging';
  
    const completedMinutes = Math.floor(durationMinutes);
  
    let cost = fee.start + completedMinutes * fee.minute;
  
    if (!endedInValidZone)   cost += fee.penalty;
    if (!startedInValidZone) cost -= fee.discount;
  
    return Math.max(cost, 0);
  }
  
  module.exports = { calculateRentalCost };
  