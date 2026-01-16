/**
 * @module map-user
 * User app Leaflet map:
 * - Map responsibilities only (init, tiles applied via theme module, zones, markers, view utilities)
 * - No exported theme/tile API
 */

/* global L */

import { getTheme, getTileURL, onThemeChange } from "/shared/theme/theme.js";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Global Exports & State
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export const scooterMarkers = {};
export let map = null;

// Tile layer state
let tileLayer = null;
let currentTheme = null;

let tileUpdateTimeout = null;
let unsubscribeTheme = null;

// Active city state (User App)
let userChosenCity = null;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Map Initialization
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Initializes the Leaflet map, sets default view, handles resizing,
 * applies initial theme tiles, subscribes to theme changes, and loads zones.
 */
export function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.error("Map container #map not found!");
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
  window.addEventListener("resize", () => setTimeout(resizeMap, 100));

  const contentSection = document.querySelector(".content") || document.body;
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => setTimeout(resizeMap, 100)).observe(contentSection);
  }

  // Apply initial tiles from canonical theme state
  applyTiles(getTheme());

  // Subscribe to future theme changes (map adapts itself; no view glue required)
  if (!unsubscribeTheme) {
    unsubscribeTheme = onThemeChange(({ theme }) => {
      applyTiles(theme);
    });
  }

  // Render zones when map is ready (polygon-only zone-helpers.js)
  map.whenReady(() => {
    import("/shared/js/zone-helpers.js")
      .then(({ renderAllZones }) => renderAllZones(map))
      .catch((err) => console.error("Failed to load zone-helpers.js:", err));
  });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Tile Handling (private)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Applies tiles for a given theme to the Leaflet map.
 * Debounced to avoid flicker on rapid toggling.
 *
 * @param {"light"|"dark"} theme
 */
function applyTiles(theme) {
  if (!map) return;
  if (theme !== "light" && theme !== "dark") return;

  if (currentTheme === theme) return;

  if (tileUpdateTimeout) clearTimeout(tileUpdateTimeout);

  tileUpdateTimeout = setTimeout(() => {
    if (!map) return;

    if (tileLayer) {
      map.removeLayer(tileLayer);
      tileLayer = null;
    }

    tileLayer = L.tileLayer(getTileURL(theme), {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    currentTheme = theme;
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
 * Returns the currently selected city for the User App (used by polling filters).
 */
export function getUserChosenCity() {
  return userChosenCity;
}

/**
 * Pans and zooms the map to a new center point with animation.
 */
export function switchTo(lat, lng, zoom = 14) {
  if (map) map.setView([lat, lng], zoom, { animate: true, duration: 0.8 });
}

/**
 * Switches the city in the user app: sets the active city state, pans map to the city.
 */
export function switchToCityUserApp(city, lat, lng, zoom = 14) {
  userChosenCity = city;
  switchTo(lat, lng, zoom);
}

export function initCityNavVisibility() {
  const nav = document.querySelector('.city-nav-bar');
  if (!nav) return;

  window.addEventListener('rental_started', () => {
    nav.classList.add('hidden');
  });

  window.addEventListener('rental_ended', () => {
    nav.classList.remove('hidden');
  });
}
