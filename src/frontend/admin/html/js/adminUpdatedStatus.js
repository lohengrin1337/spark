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

const SCOOTER_API = "/api/v1/bikes"; // Backend route uses /bikes

/**
 * Update the status of a given scooter.
 *
 * @param {string|number} scooterId - The ID of the scooter.
 * @param {string} newStatus - New status to set (e.g., "deactivated", "needService").
 * @param {string} [token] - Required JWT for authenticated admin req.
 * @param {{lat: number, lng: number}} [finalPosition] - Final coordinates at standstill (authoritative position).
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export async function updateScooterStatus(scooterId, newStatus, token, finalPosition) {
  const url = `${SCOOTER_API}/${encodeURIComponent(scooterId)}/status`;

  const payload = {
    status: newStatus,
    ...(finalPosition && typeof finalPosition.lat === "number" && typeof finalPosition.lng === "number"
      ? { lat: finalPosition.lat, lng: finalPosition.lng }
      : {}),
  };

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    console.log("[API] Updating scooter status -> PUT", url, "| payload:", payload);

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const responseData = isJson ? await response.json() : await response.text();

    console.log(`[API] Response ${response.status}:`, responseData);

    if (!response.ok) {
      const error =
        (typeof responseData === "string" && responseData.trim()) ||
        (responseData && typeof responseData === "object" && (responseData.error || responseData.message)) ||
        `HTTP ${response.status}`;

      console.warn(
        `[API] Failed to update scooter ${scooterId} status -> HTTP ${response.status}`,
        responseData
      );

      return { success: false, error };
    }

    console.log(
      `[API] Scooter ${scooterId} status updated to '${newStatus}' (Redis propagated)`
    );

    return { success: true, status: newStatus };
  } catch (err) {
    console.error(`[API] Exception while updating scooter ${scooterId} status:`, err);
    return { success: false, error: err?.message || "Network error" };
  }
}
