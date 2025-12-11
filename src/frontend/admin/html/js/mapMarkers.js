/**
 * @module mapMarkers
 * Handles the update and creation of scooter markers on the Leaflet map.
 * Each marker has a popup showing status, speed, battery.
 * Also handles drawing of movement trails and animating markers to new positions.
 */
import { scooterMarkers, trails, animateMarkerTo } from './map.js';
import { map } from './map.js';

// ─────────────────────────────────────────────────────────────
// Update or create a scooter marker and its popup info
// ─────────────────────────────────────────────────────────────
export function updateScooterMarker(id, sc) {
  let marker = scooterMarkers[id];

  // If marker doesn't exist, create it and add a trail polyline
  if (!marker) {
    marker = L.marker([sc.lat, sc.lng]).bindPopup('');
    scooterMarkers[id] = marker;
    marker.addTo(map); // Add to Leaflet map

    // Create trail for scooter movement
    trails[id] = L.polyline([[sc.lat, sc.lng]], { 
      color: '#3388ff',
      weight: 2.5,
      opacity: 0.6
    }).addTo(map);
  }

  // Determine CSS classes for status and battery display
  const statusClass = sc.st === 'charging'
    ? 'status-charging'
    : sc.st === 'active'
      ? 'status-active'
      : 'status-idle';

  const batteryClass = sc.bat < 20 ? 'low' : sc.bat < 30 ? 'medium' : 'high';
  const batteryChargingClass = sc.st === 'charging' ? 'charging' : '';
  const userDisplay = sc.user_id ? `User ${sc.user_id}` : '';

  // Update marker popup content with status, speed, and battery
  marker.setPopupContent(`
    <div class="popup-dashboard-box">
      <div class="popup-dashboard-header">
        <span>Scooter ${id}</span>
        <span>${userDisplay}</span>
      </div>
      <div class="popup-section-container">
        <div class="popup-section">
          <div class="label">Status</div>
          <div class="status-box ${statusClass}">
            ${sc.st === 'charging' ? 'Laddar' : sc.st === 'active' ? 'Aktiv' : 'Tillgänglig'}
          </div>
        </div>
        <div class="popup-section">
          <div class="label">Hastighet</div>
          <div class="value">${sc.spd || 0} km/h</div>
        </div>
        <div class="popup-section">
          <div class="label">Batteri</div>
          <div class="battery-bar-modern">
            <div class="battery-fill-modern ${batteryClass} ${batteryChargingClass}" 
                 style="width:${sc.bat}%"></div>
          </div>
          <div class="value">${sc.bat}%</div>
        </div>
      </div>
    </div>
  `);

  // Animate marker to new position on the map
  animateMarkerTo(marker, [sc.lat, sc.lng]);
}
