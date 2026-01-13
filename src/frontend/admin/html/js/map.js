/**
 * @module map
 * Admin map setup and zone management for the scooter rental app.
 */

import { TRAIL_MIN_DIST } from './utils.js';

export const scooterMarkers = {};
export const trails = {};
export let map = null;
let tileLayer = null;


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Page Activity (to handle trails being reset when page is inactive in mapMarkers.js )
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export let pageActive = document.visibilityState === 'visible';

document.addEventListener('visibilitychange', () => {
  pageActive = document.visibilityState === 'visible';

  // Clear all trails when tab becomes active for a clean visual slate/state
  if (pageActive) {
    for (const id in trails) {
      if (trails[id]) trails[id].setLatLngs([]);
    }
  }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Initialize the map
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Map container #map not found!');
    return;
  }

  map = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: true,
    fadeAnimation: true,
    zoomAnimation: true
  }).setView([55.6050, 13.0038], 13);

  // Fix map size for flex/grid layouts
  function resizeMap() {
    if (map) map.invalidateSize({ pan: false });
  }
  setTimeout(resizeMap, 100);
  setTimeout(resizeMap, 300);
  setTimeout(resizeMap, 600);
  window.addEventListener('resize', () => setTimeout(resizeMap, 100));

  // Observe content section for resizing
  const contentSection = document.querySelector('.content');
  if (contentSection && 'ResizeObserver' in window) {
    new ResizeObserver(() => setTimeout(resizeMap, 100)).observe(contentSection);
  }

  updateTileLayer();  // Add initial tile layer and sync dark mode
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Update tile layer based on dark/light mode
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function updateTileLayer() {
  const isDark = document.documentElement.classList.contains('dark-mode');

  if (tileLayer) map.removeLayer(tileLayer);

  tileLayer = L.tileLayer(
    isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(map);
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Animate marker to new position (tuned for smooth animation)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function animateMarkerTo(marker, targetLatLng) {
  const now = performance.now();

  const lastMoveUpdateTime = marker._lastMoveUpdateTime || now;
  const timeSinceLastMoveUpdateMs = Math.max(1, now - lastMoveUpdateTime);
  marker._lastMoveUpdateTime = now;

  marker._moveStartLatLng = marker.getLatLng();
  marker._moveEndLatLng = L.latLng(targetLatLng);
  marker._moveStartTime = now;

  const intervalToDurationMultiplier = 1.16;
  const minMoveDurationMs = 5900;
  const maxMoveDurationMs = 6800;

  const computedMoveDurationMs = timeSinceLastMoveUpdateMs * intervalToDurationMultiplier;
  marker._moveDurationMs = Math.max(minMoveDurationMs, Math.min(maxMoveDurationMs, computedMoveDurationMs));
}




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Continuous animation loop for all markers (~12 FPS - good UX, good performance)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function startAnimationLoop() {
  function loop() {
    const now = performance.now();

    // Throttles
    const markerUpdateMs = 85;  // ~12 FPS

    for (const id in scooterMarkers) {
      const marker = scooterMarkers[id];
      if (!marker || !marker._moveEndLatLng) continue;

      marker._lastMarkerUpdateTime = marker._lastMarkerUpdateTime || 0;
      if (now - marker._lastMarkerUpdateTime < markerUpdateMs) continue;
      marker._lastMarkerUpdateTime = now;

      const moveElapsedMs = now - marker._moveStartTime;
      const completion = Math.min(moveElapsedMs / marker._moveDurationMs, 1);

      const lat =
      marker._moveStartLatLng.lat + (marker._moveEndLatLng.lat - marker._moveStartLatLng.lat) * completion;

      const lng =
        marker._moveStartLatLng.lng + (marker._moveEndLatLng.lng - marker._moveStartLatLng.lng) * completion;

      marker.setLatLng([lat, lng]);

      // Clean up finished animation
      if (completion >= 1) {
        delete marker._moveStartLatLng;
        delete marker._moveEndLatLng;
        delete marker._moveStartTime;
        delete marker._moveDurationMs;
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Pan map to a given location (used in the bottom city-nav-bar)
// Clear all trails when switching to a new city
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function switchTo(lat, lng, zoom = 13) {
  if (!map) return;

  map.setView([lat, lng], zoom, { animate: true, duration: 0.5 });

  for (const id in trails) {
    trails[id].setLatLngs([]);
  }
}
