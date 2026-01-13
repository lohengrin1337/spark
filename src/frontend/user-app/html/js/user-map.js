/**
 * @module map-user
 * Simplified map for user app - with reliable theme-based tile switching
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Global Exports & State
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export const scooterMarkers = {};
export let map = null;
let tileLayer = null;
let currentMode = null;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Map Initialization
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Initializes the Leaflet map, sets default view, handles resizing,
 * applies initial theme tiles, and loads zone rendering.
 */
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
  }).setView([55.6050, 13.0038], 14);

  // Resize handling
  function resizeMap() {
    if (map) map.invalidateSize({ pan: false });
  }
  setTimeout(resizeMap, 100);
  setTimeout(resizeMap, 300);
  setTimeout(resizeMap, 600);
  window.addEventListener('resize', () => setTimeout(resizeMap, 100));

  const contentSection = document.querySelector('.content') || document.body;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => setTimeout(resizeMap, 100)).observe(contentSection);
  }

  updateTileLayer(
    document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light'
  );

  // Render zones when map is ready
  map.whenReady(() => {
    import('/shared/js/zone-helpers.js')
      .then(module => {
        module.renderAllZones(map);
      })
      .catch(err => {
        console.error('Failed to load zone-helpers.js:', err);
      });
  });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Theme Tile Management
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Updates the base tile layer based on light/dark theme.
 * Debounces rapid theme changes for smooth switching.
 */
export function updateTileLayer(theme = null) {
  if (!map) return;

  const newMode = theme ??
    (document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light');

  if (currentMode === newMode) return;

  if (window._tileUpdateTimeout) {
    clearTimeout(window._tileUpdateTimeout);
  }

  window._tileUpdateTimeout = setTimeout(() => {
    if (tileLayer) {
      map.removeLayer(tileLayer);
    }

    const url = newMode === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    currentMode = newMode;
  }, 50);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Marker Animation Setup
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Prepares a marker for smooth animated movement to a target position.
 */
export function animateMarkerTo(marker, targetLatLng) {
  marker._animStart = marker.getLatLng();
  marker._animTarget = L.latLng(targetLatLng);
  marker._animStartTime = performance.now();
  marker._animDuration = 4000;
}

/**
 * Starts the global animation loop that moves all prepared markers smoothly.
 */
export function startAnimationLoop() {
  function loop() {
    const now = performance.now();
    for (const id in scooterMarkers) {
      const m = scooterMarkers[id];
      if (!m._animTarget) continue;

      const elapsed = now - m._animStartTime;
      const t = Math.min(elapsed / m._animDuration, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const lat = m._animStart.lat + (m._animTarget.lat - m._animStart.lat) * easeT;
      const lng = m._animStart.lng + (m._animTarget.lng - m._animStart.lng) * easeT;

      m.setLatLng([lat, lng]);

      if (t >= 1) {
        delete m._animStart;
        delete m._animTarget;
        delete m._animStartTime;
        delete m._animDuration;
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Map View Utilities
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Pans and zooms the map to a new center point with animation.
 */
export function switchTo(lat, lng, zoom = 14) {
  if (map) map.setView([lat, lng], zoom, { animate: true, duration: 0.8 });
}