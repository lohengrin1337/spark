/**
 * @module mapMarkers (admin)
 * Renders scooter markers using status-based colored icons.
 * Immediate visual charging feedback when in charging zone and not active.
 */

import { getScooterIcon } from '/shared/js/map/marker-icons.js';
import { scooterMarkers, trails, animateMarkerTo, pageActive } from './map.js';
import { map } from './map.js';
import { updateScooterStatus } from './adminUpdatedStatus.js';

export function updateScooterMarker(id, sc) {
  let marker = scooterMarkers[id];

  // ------------------------------
  // Normalize status key
  // ------------------------------
  const normalize = {
    idle: 'available',
    available: 'available',
    active: 'active',
    in_use: 'active',
    reduced: 'reduced',
    deactivated: 'deactivated',
    need_service: 'needService',
    needservice: 'needService',
    charging: 'charging',
    needscharging: 'needCharging',
    needcharging: 'needCharging',
    needCharging: 'needCharging'
  };

  let key = sc.st?.toLowerCase().trim() || 'available';
  key = normalize[key] || key;

  // ------------------------------
  // Use normalized key for icon
  // ------------------------------
  const icon = getScooterIcon(key);

  if (!marker) {
    marker = L.marker([sc.lat, sc.lng], { icon });
    marker.bindPopup('');
    scooterMarkers[id] = marker;
    marker.addTo(map);

    trails[id] = L.polyline([[sc.lat, sc.lng]], { 
      color: '#3388ff',
      weight: 2.5,
      opacity: 0.6
    }).addTo(map);
  } else if (marker.options.icon !== icon) {
    marker.setIcon(icon);
  }

  // ------------------------------
  // Popup text and status class mapping
  // ------------------------------
  const statusTextMap = {
    charging: "Laddar",
    active: "Aktiv",
    reduced: "Begränsad",
    deactivated: "Inaktiverad",
    needService: "Behöver service",
    needCharging: "Behöver laddas",
    available: "Tillgänglig"
  };

  const statusClassMap = {
    charging: "status-charging",
    active: "status-active",
    reduced: "status-reduced",
    deactivated: "status-deactivated",
    needService: "status-needservice",
    needCharging: "status-needcharging",
    available: "status-idle"
  };

  const statusText = statusTextMap[key] || "Tillgänglig";
  const statusClass = statusClassMap[key] || "status-idle";

  const batteryClass = sc.bat < 20 ? 'low' : sc.bat < 30 ? 'medium' : 'high';
  const batteryChargingClass = sc.st === 'charging' ? 'charging' : '';
  const userDisplay = sc.user_id ? `User ${sc.user_id}` : '';

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
            ${statusText}
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

      <div class="popup-actions">
        <button class="popup-btn popup-btn-danger" data-action="deactivated" data-id="${id}">
        Inaktivera
        </button>
        <button class="popup-btn popup-btn-warning" data-action="needService" data-id="${id}">
          Markera för service
        </button>
      </div>
    </div>
  `);

  // ------------------------------
  // Popup action handlers
  // ------------------------------
  marker.off('popupopen');

  marker.on('popupopen', (e) => {
    const popupEl = e.popup.getElement();
    if (!popupEl) return;

    popupEl.querySelectorAll('.popup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const scooterId = btn.dataset.id;
        const action = btn.dataset.action;
        updateScooterStatus(scooterId, action);
      });
    });
  });

  // ------------------------------
  // Reset trail when page inactive
  // ------------------------------
  if (pageActive) {
    animateMarkerTo(marker, [sc.lat, sc.lng]);
  } else {
    marker.setLatLng([sc.lat, sc.lng]);
    if (trails[id]) {
      trails[id].setLatLngs([]);
    }
  }
}
