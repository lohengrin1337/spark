/**
 * @module map
 * Admin map setup and zone management for the scooter rental app.
 */

import { TRAIL_MIN_DIST } from './utils.js';

export const scooterMarkers = {};
export const trails = {};
export const map = null;
let tileLayer = null;

// ─────────────────────────────────────────────────────────────
// Initialize the map
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Update tile layer based on dark/light mode
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Charging zones data
// ─────────────────────────────────────────────────────────────
export const CHARGING_ZONES = [
  { lat: 55.5979654, lng: 12.9972124, radius: 30 },
  { lat: 55.6040, lng: 12.9950, radius: 25 },
];

// Draw charging zones on the map
export function drawChargingZones() {
  if (!map) return;

  CHARGING_ZONES.forEach(zone => {
    L.circle([zone.lat, zone.lng], {
      color: 'lightgreen',
      fillColor: '#e6ffe6',
      fillOpacity: 0.4,
      radius: zone.radius,
      weight: 1
    }).addTo(map);
  });
}

// ─────────────────────────────────────────────────────────────
// Animate a given marker to a target
// ─────────────────────────────────────────────────────────────
export function animateMarkerTo(marker, targetLatLng) {
  marker._animStart = marker.getLatLng();
  marker._animTarget = L.latLng(targetLatLng);
  marker._animStartTime = performance.now();
  marker._animDuration = 6200;
}

// ─────────────────────────────────────────────────────────────
// Continuous animation loop for all markers
// ─────────────────────────────────────────────────────────────
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

      // Update trail
      const trail = trails[id];
      if (trail) {
        const last = trail.getLatLngs().slice(-1)[0];
        if (!last || map.distance(last, [lat, lng]) > TRAIL_MIN_DIST) {
          trail.addLatLng([lat, lng]);
        }
      }

      // Clean up finished animation
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

// ─────────────────────────────────────────────────────────────
// Pan map to a given location (used in the bottom city-nav-bar)
// ─────────────────────────────────────────────────────────────
export function switchTo(lat, lng, zoom = 13) {
  if (map) map.setView([lat, lng], zoom, { animate: true, duration: 1.5 });
}
