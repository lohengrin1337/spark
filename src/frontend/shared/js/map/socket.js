/**
 * @module socket
 * Handles the WebSocket flow from the backend
 */

import { APPLY_THROTTLE } from './utils.js';
import { scooterMarkers } from './map.js';
import * as MapMarkers from './mapMarkers.js';
import * as RentalSidebar from './rentalSidebar.js';

// Note, point of clarification: a JavaScript Map (key/value-store), not a Leaflet map
const pending = new Map();

let lastApply = 0;

// ─────────────────────────────────────────────────────────────
// Apply all pending scooter updates to the map
// ─────────────────────────────────────────────────────────────
function applyUpdates() {
  let applied = 0;

  // Update markers for all pending scooters
  for (const [id, sc] of pending) {
    MapMarkers.updateScooterMarker(id, sc);
    applied++;
  }

  pending.clear();
  RentalSidebar.updateStatsPanel(applied, Object.keys(scooterMarkers).length); // Refresh
}

// ─────────────────────────────────────────────────────────────
// Initialize WebSocket connection and handle messages
// ─────────────────────────────────────────────────────────────
export function initWebSocket() {
  const ws = new WebSocket(`ws://${location.hostname}:3000`);

  // Connection opened
  ws.onopen = () => {
    console.log('WebSocket connected');
    document.getElementById('statsContent').innerHTML = "Laddar flottan...";

  };

  // Incoming messages
  ws.onmessage = message => {
    try {
      const msg = JSON.parse(message.data);

      // Completed rental -> updated sidebar
      if (msg.type === 'completed_rental') {
        RentalSidebar.addCompletedRental(msg);
        return;
      }

      // Scooter update -> add to pending
      if (msg.id !== undefined) {
        pending.set(msg.id, msg);

        // Throttle the updates to avoid flooding the map (currently at 1000ms, and currently 
        // redundant, but might come in handy)
        if (Date.now() - lastApply > APPLY_THROTTLE) {
          applyUpdates();
          lastApply = Date.now();
        }
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  };

  // Connection closed. Reload page to reconnect.
  ws.onclose = () => {
    console.warn('WebSocket closed - reconnecting...');
    setTimeout(() => location.reload(), 3000);
  };

  // Log connection errors
  ws.onerror = (message) => console.error('WebSocket error:', message);
}
