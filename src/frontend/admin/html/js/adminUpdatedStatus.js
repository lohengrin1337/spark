/**
 * @module adminUpdatedStatus
 * Handles updating scooter status via backend API calls.
 * Used in the frontend admin UI to manipulate the scooter status.
 *
 * Flow:
 * - Frontend calls this function -> HTTP PUT to backend
 * - Backend updates DB + publishes Redis 'admin:scooter_status_update' (simulator enforces lock/rental block)
 * - Existing map WS listener receives delta -> marker/popup updates immediately
 */

const SCOOTER_API = "/api/v1/bikes";  // Backend route uses /bikes

/**
 * Update the status of a given scooter.
 * @param {string|number} scooterId - The ID of the scooter.
 * @param {string} newStatus - New status to set (e.g., "deactivated", "needService").
 * @returns {Promise<object>} - { success: boolean, status?: string, error?: string }
 */
export async function updateScooterStatus(scooterId, newStatus) {
  const url = `${SCOOTER_API}/${scooterId}/status`;
  const payload = { status: newStatus };

  try {
    console.log(`[API] Updating scooter status -> PUT ${url} | payload:`, payload);

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`[API] Response ${response.status}:`, responseData);

    if (response.ok) {
      console.log(`[API] Scooter ${scooterId} status updated to '${newStatus}' (Redis propagated)`);
      return { success: true, status: newStatus };
    } else {
      console.warn(`[API] Failed to update scooter ${scooterId} status -> HTTP ${response.status}`, responseData);
      return { success: false, error: responseData || 'Unknown error' };
    }
  } catch (err) {
    console.error(`[API] Exception while updating scooter ${scooterId} status:`, err);
    return { success: false, error: err.message || 'Network error' };
  }
}