/**
 * @module map-ui-controller
 *
 * Handles map markers and bottom-sheet popups for the user app view.
 *
 * Dispatches rental_started / rental_ended events.
 * 
 * state-stream.js listens and switches between polling and socket mode.
 *
 * In rental mode: show only the user's rented scooter marker (active)
 * 
 * In poll mode: fetch and show the rentable scooters on map (available/charging)
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Imports
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { getScooterIcon } from '/shared/js/map/marker-icons.js';
import { scooterMarkers, map, animateMarkerTo } from './user-map.js';
import { startRentalApiFlow, endRentalApiFlow } from './rental-api.js';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// App State
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let currentRental = {
  rental_id: null,
  scooter_id: null,
  lat: null,
  lng: null,
  startTime: null
};

// Rental-only flag
let rentalOnlyMode = false;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Bottom Sheet UI Management
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Rental Bottom Sheet UI
 */
let rentalWrapper = null;
let rentalBackdrop = null;
let durationInterval = null;

/**
 * Creates (if needed) and returns the rental wrapper and backdrop elements.
 */
function createRentalWrapper() {
  if (rentalWrapper) return { wrapper: rentalWrapper, backdrop: rentalBackdrop };

  const backdrop = document.createElement('div');
  backdrop.classList.add('rental-backdrop');

  const wrapper = document.createElement('div');
  wrapper.classList.add('rental-wrapper');

  wrapper.innerHTML = `
    <div class="rental-handle"></div>
    <div class="wrapper-content"></div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(wrapper);

  rentalWrapper = wrapper;
  rentalBackdrop = backdrop;

  backdrop.addEventListener('click', closeRentalWrapper);

  return { wrapper, backdrop };
}

/**
 * Opens the rental-slider bottom sheet and starts the duration counter.
 */
function openRentalWrapper(htmlContent) {
  const { wrapper, backdrop } = createRentalWrapper();
  wrapper.querySelector('.wrapper-content').innerHTML = htmlContent;

  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    wrapper.classList.add('open');
  });

  startDurationCounter();
}

/**
 * Closes the rental-slider bottom sheet and starts the duration counter.
 */
function closeRentalWrapper() {
  if (!rentalWrapper) return;

  rentalWrapper.classList.remove('open');
  rentalBackdrop.classList.remove('visible');

  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

/**
 * Updates and displays the live rental duration counter.
 */
function startDurationCounter() {
  const el = document.querySelector('.duration-counter');
  if (!el || !currentRental.startTime) return;

  if (durationInterval) clearInterval(durationInterval);

  const update = () => {
    const elapsedMs = Date.now() - currentRental.startTime;
    const hours = String(Math.floor(elapsedMs / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');
    el.textContent = `${hours}:${minutes}:${seconds}`;
  };

  update();
  durationInterval = setInterval(update, 1000);
}

/**
 * Attaches click handlers to start/end rental buttons in the current wrapper.
 */
function attachWrapperButtonListeners() {
  const startBtn = document.querySelector('.start-rental-button');
  if (startBtn) {
    startBtn.onclick = async () => {
      const id = startBtn.dataset.id;
      const lat = startBtn.dataset.lat;
      const lng = startBtn.dataset.lng;

      await startRental(id, lat, lng);

      closeRentalWrapper();
    };
  }

  const endBtn = document.querySelector('.end-rental-button');
  if (endBtn) {
    endBtn.onclick = async () => {
      const rentalId = endBtn.dataset.rentalId;

      await endRental(rentalId);

      closeRentalWrapper();
    };
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Helpers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Determines if a scooter status should be visible on the map.
 */
function isVisibleStatus(status) {
  return status === 'available' || status === 'charging';
}

/**
 * Parses latitude/longitude from polling API bike object (multiple formats).
 */
function parseBikeLatLng(bike) {
  const c = bike?.coordinates;

  if (c && typeof c === 'object' && Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
    const lon = Number(c.coordinates[0]);
    const lat = Number(c.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lng: lon };
  }

  if (c && typeof c === 'object') {
    const lat = Number(c.lat);
    const lng = Number(c.lng ?? c.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

    const x = Number(c.x);
    const y = Number(c.y);
    if (Number.isFinite(x) && Number.isFinite(y)) return { lat: y, lng: x };
  }

  if (typeof c === 'string') {
    const m = c.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) {
      const lon = Number(m[1]);
      const lat = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lng: lon };
    }
  }

  return null;
}

/**
 * Parses latitude/longitude from socket update object.
 */
function parseSocketLatLng(sc) {
  const lat = sc?.lat;
  const lng = sc?.lng ?? sc?.lon;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HTML
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Builds HTML content for the rental bottom sheet.
 */
function buildWrapperHTML({ id, status, isMyRental, lat, lng, batteryPct }) {
  const uis = status;

  const statusText = isMyRental ? 'Aktiv (din hyra)'
    : uis === 'charging' ? 'Laddar'
      : 'Tillgänglig';

  const statusClass = isMyRental ? 'user-app-status-active'
    : uis === 'charging' ? 'status-charging'
      : 'user-app-status-available';

  let actionButton = '';
  if (!isMyRental && isVisibleStatus(status)) {
    actionButton = `
      <button class="action-button start-button start-rental-button"
              data-id="${id}" data-lat="${lat}" data-lng="${lng}">
        Starta hyra
      </button>`;
  } else if (isMyRental) {
    actionButton = `
      <button class="action-button end-button end-rental-button"
              data-rental-id="${currentRental.rental_id}">
        Avsluta hyra
      </button>`;
  }

  let durationRow = '';
  if (isMyRental) {
    durationRow = `
      <div class="info-row">
        <div class="label">Hyrtid (ca)</div>
        <div class="duration-counter">00:00:00</div>
      </div>`;
  }

  let batteryRow = '';
  if (batteryPct !== null) {
    const batteryClass = batteryPct < 20 ? 'low' : batteryPct < 30 ? 'medium' : 'high';
    const batteryChargingClass = uis === 'charging' ? 'charging' : '';

    batteryRow = `
      <div class="info-row">
        <div class="label">Batteri</div>
        <div class="battery-bar">
          <div class="battery-fill ${batteryClass} ${batteryChargingClass}"
               style="width: ${batteryPct}%"></div>
        </div>
        <div class="battery-value">${batteryPct}%</div>
      </div>`;
  }

  return `
    <div class="wrapper-info">
      <div class="scooter-title">Scooter ${id}</div>

      ${durationRow}

      <div class="info-row">
        <div class="label">Status</div>
        <div class="status-box ${statusClass}">${statusText}</div>
      </div>

      ${batteryRow}
    </div>

    <div class="wrapper-action">
      ${actionButton}
    </div>
  `;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Map Marker Utilities
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Removes all markers from the map except the optionally specified one.
 */
function removeAllMarkersExcept(keepId) {
  if (!map) return;
  const keep = keepId != null ? String(keepId) : null;

  for (const id of Object.keys(scooterMarkers)) {
    if (keep && String(id) === keep) continue;
    map.removeLayer(scooterMarkers[id]);
    delete scooterMarkers[id];
  }
}

/**
 * Clears all markers from the map (poll mode only).
 */
export function clearAllMarkers() {
  if (!map) return;
  if (rentalOnlyMode) return;
  removeAllMarkersExcept(null);
}

/**
 * Called when entering rental mode.
 * Ensures only rental marker remains visible.
 */
export function enterRentalOnlyMode() {
  rentalOnlyMode = true;
  removeAllMarkersExcept(currentRental.scooter_id);
}

/**
 * Called when leaving rental mode.
 */
export function exitRentalOnlyMode() {
  rentalOnlyMode = false;
}

/**
 * Updates or creates the active rental marker (used in rental-only mode).
 */
function updateOrCreateRentalMarker(lat, lng, batteryPct = null, status = 'active') {
  if (!map || currentRental.scooter_id == null) return;

  const id = String(currentRental.scooter_id);

  let marker = scooterMarkers[id];

  const newIcon = getScooterIcon('active');

  if (!marker) {
    marker = L.marker([lat, lng], { icon: newIcon });
    marker.addTo(map);
    scooterMarkers[id] = marker;
  } else {
    if (marker.options.icon !== newIcon) marker.setIcon(newIcon);
  }

  // Always keep only this marker while in rental mode
  if (rentalOnlyMode) removeAllMarkersExcept(id);

  currentRental.lat = lat;
  currentRental.lng = lng;

  const wrapperHTML = buildWrapperHTML({
    id,
    status,
    isMyRental: true,
    lat,
    lng,
    batteryPct
  });

  marker.off('click');
  marker.on('click', () => {
    openRentalWrapper(wrapperHTML);
    setTimeout(attachWrapperButtonListeners, 150);
  });

  animateMarkerTo(marker, [lat, lng]);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Real-time Socket Updates
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * In rentalOnlyMode: ignore all non-rental updates.
 */
export function updateScooterMarker(id, sc) {
  if (!map) return;

  const scooterId = parseInt(id, 10);
  const myId = currentRental.scooter_id;

  if (rentalOnlyMode) {
    // Ignore everything except the rental scooter
    if (!myId || scooterId !== myId) return;
  }

  const parsed = parseSocketLatLng(sc);
  if (!parsed) {
    console.warn(`[UserMapMarkers] Invalid socket position for scooter ${id} - skipping update`);
    return;
  }

  const bat = Number(sc?.bat);
  const batteryPct = Number.isFinite(bat) ? Math.max(0, Math.min(100, bat)) : null;

  const rawStatus = sc?.st;
  const status = (typeof rawStatus === 'string' && rawStatus) ? rawStatus.toLowerCase() : 'active';

  const isMyRental = myId != null && scooterId === myId;

  if (rentalOnlyMode) {
    // In rental-only mode, always render as the active marker
    updateOrCreateRentalMarker(parsed.lat, parsed.lng, batteryPct, status);
    return;
  }

  // Non-rental mode behavior (should not occur in practice while socket is
  // active, but safe)
  if (!isMyRental && !isVisibleStatus(status)) {
    if (scooterMarkers[id]) {
      map.removeLayer(scooterMarkers[id]);
      delete scooterMarkers[id];
    }
    return;
  }

  const uis = status;
  let marker = scooterMarkers[id];

  const newIcon = isMyRental ? getScooterIcon('active')
    : uis === 'charging' ? getScooterIcon('charging')
      : getScooterIcon('available');

  if (!marker) {
    marker = L.marker([parsed.lat, parsed.lng], { icon: newIcon });
    marker.addTo(map);
    scooterMarkers[id] = marker;
  } else {
    if (marker.options.icon !== newIcon) marker.setIcon(newIcon);
  }

  const wrapperHTML = buildWrapperHTML({
    id,
    status,
    isMyRental,
    lat: parsed.lat,
    lng: parsed.lng,
    batteryPct
  });

  marker.off('click');
  marker.on('click', () => {
    openRentalWrapper(wrapperHTML);
    setTimeout(attachWrapperButtonListeners, 150);
  });

  animateMarkerTo(marker, [parsed.lat, parsed.lng]);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Polling Updates
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * In rentalOnlyMode: ignore all polling updates.
 */
export function updateBikeMarker(id, bike) {
  if (!map) return;
  if (rentalOnlyMode) return;

  const bikeId = String(id);

  const rawStatus = bike?.status;
  const status = (typeof rawStatus === 'string' && rawStatus) ? rawStatus.toLowerCase() : rawStatus;

  if (!isVisibleStatus(status)) {
    if (scooterMarkers[bikeId]) {
      map.removeLayer(scooterMarkers[bikeId]);
      delete scooterMarkers[bikeId];
    }
    return;
  }

  const parsed = parseBikeLatLng(bike);
  if (!parsed) {
    console.warn(`[UserMapMarkers] Invalid bike coordinates for bike ${bikeId} - skipping update`);
    return;
  }

  const bat = Number(bike?.bat);
  const batteryPct = Number.isFinite(bat) ? Math.max(0, Math.min(100, bat)) : null;

  const uis = status;

  let marker = scooterMarkers[bikeId];
  const newIcon = uis === 'charging' ? getScooterIcon('charging') : getScooterIcon('available');

  if (!marker) {
    marker = L.marker([parsed.lat, parsed.lng], { icon: newIcon });
    marker.addTo(map);
    scooterMarkers[bikeId] = marker;
  } else {
    if (marker.options.icon !== newIcon) marker.setIcon(newIcon);
  }

  const wrapperHTML = buildWrapperHTML({
    id: bikeId,
    status,
    isMyRental: false,
    lat: parsed.lat,
    lng: parsed.lng,
    batteryPct
  });

  marker.off('click');
  marker.on('click', () => {
    openRentalWrapper(wrapperHTML);
    setTimeout(attachWrapperButtonListeners, 150);
  });

  animateMarkerTo(marker, [parsed.lat, parsed.lng]);
}

/**
 * Removes markers no longer present in the latest poll data.
 */
export function pruneMissingMarkers(seenIds) {
  if (!map) return;
  if (rentalOnlyMode) return;

  for (const id of Object.keys(scooterMarkers)) {
    if (!seenIds.has(String(id))) {
      map.removeLayer(scooterMarkers[id]);
      delete scooterMarkers[id];
    }
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Rental API Operations
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Starts a new rental for the given scooter at specified coordinates.
 */
async function startRental(scooterId, lat, lng) {
  try {
    const nextRental = await startRentalApiFlow({
      scooterId,
      lat,
      lng,
      currentRental
    });

    currentRental = nextRental;

    // Enter rental-only mode immediately (hide rest of markers)
    enterRentalOnlyMode();

    window.dispatchEvent(new CustomEvent('rental_started', {
      detail: { rental_id: currentRental.rental_id, scooter_id: currentRental.scooter_id }
    }));

    alert("Uthyrning startad. Ha en trevlig tur!");
  } catch (err) {
    if (err?.userMessage) {
      alert(err.userMessage);
      return;
    }

    console.error("[UserApp] Start rental error:", err);
    alert("Nätverksfel...");
  }
}

/**
 * Ends the active rental by ID.
 */
async function endRental(rentalId) {
  try {
    await endRentalApiFlow({ rentalId });

    alert("Uthyrning avslutad. Tack för resan! En faktura ligger nu redo bland dina sidor.");

    currentRental = { rental_id: null, scooter_id: null, lat: null, lng: null, startTime: null };

    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }

    // Exit rental-mode - polling will then ensue and repopulate the map
    exitRentalOnlyMode();

    window.dispatchEvent(new CustomEvent('rental_ended', {
      detail: { rental_id: rentalId }
    }));
  } catch (err) {
    if (err?.userMessage) {
      alert(err.userMessage);
      return;
    }

    console.error("[UserApp] End rental error:", err);
    alert("Nätverksfel");
  }
}

/**
 * Clears rental state when rental is completed externally (e.g., via admin).
 */
export function clearCurrentRentalOnCompleted() {
  currentRental = { rental_id: null, scooter_id: null, lat: null, lng: null, startTime: null };

  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }

  // Exit rental-mode - polling will then ensue and repopulate map
  exitRentalOnlyMode();

  window.dispatchEvent(new CustomEvent('rental_ended', {
    detail: { reason: 'completed_rental' }
  }));
}
