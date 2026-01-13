/**
 * @module state-stream
 *
 * Hybrid controller: poll fleet, introduce socket during rental, and
 * back to polling again upon rental completion.
 * Guarded transitions prevent accidental exits from rental mode.
 *
 * Manages the transport layer:
 * - Polling mode: periodic full snapshots of available scooters
 * - Socket mode: real-time updates for the active rental scooter only
 * - Safe mode switching based on rental lifecycle events
 */

import * as MapMarkers from './map-ui-controller.js';

const API_BASE = "";
const BIKES_API = `${API_BASE}/api/v1/bikes`;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Socket buffering (throttled marker update)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const pending = new Map();
let lastApply = 0;
const APPLY_THROTTLE = 800; // ms

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// State (single source of truth)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const state = {
  mode: 'poll',        // poll/socket
  rental_id: null,     // active rental id (null when no rental)
  scooter_id: null,    // active rented scooter id (null when no rental)
};

let ws = null;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Polling Helpers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let pollTimer = null;
let pollAborter = null;
const POLL_INTERVAL_MS = 7500;

/**
 * Checks if an error is from an aborted fetch (used for clean poll cancellation).
 */
function isAbortError(err) {
  return err?.name === 'AbortError';
}

/**
 * Simple prefixed logger for transport-related messages.
 */
function log(...args) {
  console.log('[Transport]', ...args);
}

/**
 * Applies all buffered socket updates to map markers and clears the buffer.
 */
function applyUpdates() {
  for (const [id, sc] of pending) {
    MapMarkers.updateScooterMarker(id, sc);
  }
  pending.clear();
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Poll snapshot
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Fetches a complete snapshot of all bikes from the backend.
 */
async function fetchAllBikesSnapshot() {
  const url = `${BIKES_API}`;

  const token = localStorage.getItem('token');
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal: pollAborter?.signal
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Determines if a bike should be shown on the map during polling (available, charging).
 */
function isPollVisibleStatus(statusRaw) {
  const s = (typeof statusRaw === 'string') ? statusRaw.toLowerCase() : statusRaw;
  return s === 'available' || s === 'charging';
}

/**
 * Performs a single poll cycle: fetches snapshot, updates visible markers, prunes stale ones.
 */
async function pollOnce() {
  if (state.mode !== 'poll') return;

  if (pollAborter) pollAborter.abort();
  pollAborter = new AbortController();

  try {
    const bikes = await fetchAllBikesSnapshot();

    const seenIds = new Set();
    for (const bike of bikes) {
      const id = bike?.bike_id ?? bike?.id;
      if (id == null) continue;

      if (!isPollVisibleStatus(bike?.status)) continue;

      const sid = String(id);
      seenIds.add(sid);
      MapMarkers.updateBikeMarker(sid, bike);
    }

    // Remove markers for bikes no longer in the snapshot
    MapMarkers.pruneMissingMarkers(seenIds);
  } catch (err) {
    if (isAbortError(err)) return;
    console.error('[UserApp] Poll error:', err);
  }
}

/**
 * Starts periodic polling (idempotent).
 */
function startPolling() {
  stopPolling();
  state.mode = 'poll';
  log('startPolling()');
  pollOnce();
  pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
}

/**
 * Stops polling and aborts any in-flight request.
 */
function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;

  if (pollAborter) pollAborter.abort();
  pollAborter = null;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// WebSocket (rental mode)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Opens a WebSocket connection for real-time updates during an active rental.
 */
function connectSocket() {
  ws = new WebSocket(`ws://${location.hostname}:3000`);

  ws.onopen = () => {
    log('WebSocket connected (rental mode)');
  };

  ws.onmessage = (message) => {
    try {
      const msg = JSON.parse(message.data);

      // Handle external rental completion (e.g., admin force-end)
      if (msg.type === 'completed_rental') {
        const msgRentalId = msg.rental_id ?? msg.rentalId ?? msg.id ?? null;

        log('WS completed_rental received', { msgRentalId, activeRental: state.rental_id });

        // Ignore if no id or doesn't match active rental
        if (!msgRentalId) return;
        if (String(msgRentalId) !== String(state.rental_id)) return;

        MapMarkers.clearCurrentRentalOnCompleted();
        switchToPollMode('completed_rental');
        return;
      }

      // Regular scooter position/status update
      if (msg.id !== undefined) {
        pending.set(msg.id, msg);

        const now = Date.now();
        if (now - lastApply > APPLY_THROTTLE) {
          applyUpdates();
          lastApply = now;
        }
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  };

  ws.onclose = () => {
    // If closed while in socket mode, attempt recovery via full reload
    if (state.mode === 'socket') {
      console.warn('WebSocket closed unexpectedly - reloading to recover');
      setTimeout(() => location.reload(), 3000);
    }
  };

  ws.onerror = (err) => console.error('WebSocket error:', err);
}

/**
 * Safely closes the WebSocket and clears any buffered updates.
 */
function disconnectSocket() {
  if (!ws) return;

  try {
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
  } catch (_) {
    // ignore
  } finally {
    ws = null;
    pending.clear();
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Mode transitions
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Switches to real-time socket mode for active rental.
 */
function switchToSocketMode(reason = 'unknown') {
  if (state.mode === 'socket') return;

  state.mode = 'socket';
  stopPolling();

  log('switchToSocketMode()', { reason, rental_id: state.rental_id, scooter_id: state.scooter_id });

  MapMarkers.enterRentalOnlyMode();

  disconnectSocket();
  connectSocket();
}

/**
 * Switches back to polling mode (full fleet view).
 */
function switchToPollMode(reason = 'unknown') {
  log('switchToPollMode()', { reason, rental_id: state.rental_id, scooter_id: state.scooter_id });

  MapMarkers.exitRentalOnlyMode();

  if (state.mode === 'poll') {
    startPolling();
    return;
  }

  state.mode = 'poll';
  disconnectSocket();
  startPolling();
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public init (rental lifecycle)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * - Starts polling by default
 * - Listens for rental_started / rental_ended events to switch modes safely
 */
export function initWebSocket() {
  startPolling();

  // Fired when user successfully starts a rental
  window.addEventListener('rental_started', (ev) => {
    const detail = ev?.detail || {};
    const rental_id = detail.rental_id ?? detail.rentalId ?? null;
    const scooter_id = detail.scooter_id ?? detail.bike_id ?? detail.bikeId ?? null;

    state.rental_id = rental_id;
    state.scooter_id = scooter_id;

    log('event rental_started', { rental_id, scooter_id });

    switchToSocketMode('rental_started');
  });

  // Fired when rental ends (user end or external completion)
  window.addEventListener('rental_ended', (ev) => {
    const detail = ev?.detail || {};
    const rental_id = detail.rental_id ?? detail.rentalId ?? null;

    log('event rental_ended', { rental_id, activeRental: state.rental_id });

    // Ignore if a specific rental_id is provided but it doesn't match the active
    if (rental_id && state.rental_id && String(rental_id) !== String(state.rental_id)) {
      log('ignore rental_ended for non-active rental');
      return;
    }

    state.rental_id = null;
    state.scooter_id = null;

    switchToPollMode('rental_ended');
  });
}