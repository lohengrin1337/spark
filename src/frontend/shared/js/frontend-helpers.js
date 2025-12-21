/**
 * Calculates the rental cost based on start and end zones and duration.
 * @param {string} startZone - "parking" | "charging" | "free"
 * @param {string} endZone   - "parking" | "charging" | "free"
 * @param {number} durationMinutes - Rental duration in minutes
 * @returns {number|null} Total cost in SEK or null if endZone is invalid
 */
export function calculateRentalCost(startZone, endZone, durationMinutes) {
    if (endZone === null || endZone === undefined) {
      return null;
    }
  
    const startedInValidZone =
      startZone === 'parking' || startZone === 'charging';
    const endedInValidZone =
      endZone === 'parking' || endZone === 'charging';
  
    const completedMinutes = Math.floor(durationMinutes);
  
    let cost = 20 + completedMinutes;
  
    if (!endedInValidZone)   cost += 15;
    if (!startedInValidZone) cost -= 10;
  
    return cost;
}

/**
 * Translates an English zone identifier to Swedish.
 * @param {string} engZone - "parking" | "charging" | "free"
 * @returns {string} Swedish translation: "parkering" | "laddning" | "fri", or empty string if invalid
 */
export function translateZoneToSwedish(engZone) {
    if (!engZone) return "";
  
    const translations = {
      parking: "parkering",
      charging: "laddning",
      free: "fri"
    };
  
    return translations[engZone] || "";
}

/**
 * Translates an English invoice status to Swedish.
 * @param {string} engStatus - "paid" | "unpaid" | "void"
 * @returns {string} Swedish translation: "betald" | "obetald" | "makulerad", or empty string if invalid
 */
export function translateInvStatusToSwe(engStatus) {
  if (!engStatus) return "";

  const translations = {
    paid: "betald",
    unpaid: "obetald",
    void: "makulerad"
  };

  return translations[engStatus] || "";
}

