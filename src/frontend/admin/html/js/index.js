/**
 * @module index
 * 
 * The main controller: sets up map, WebSocket-connection, UI, and theme handling.
 */

import { initMap, startAnimationLoop, switchTo, map } from './map.js';
import { initWebSocket } from './socket.js';
import { initCityLinks } from './cities.js';
import { initTheme } from './theme.js';
import { renderAllZones } from '/shared/js/zone-helpers.js';

function startApp() {
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.error('Map element not found! Retrying...');
    requestAnimationFrame(startApp);
    return;
  }

  console.log('Map container found - initializing...');

  // ─────────────────────────────────────────────────────────────
  // 1. Initialize theme and UI mode (dark/light)
  // ─────────────────────────────────────────────────────────────
  initTheme();

  // ─────────────────────────────────────────────────────────────
  // 2. Initialize the map
  // ─────────────────────────────────────────────────────────────
  initMap();

  // ─────────────────────────────────────────────────────────────
  // 3. Begin aesthetic continuous marker animations for scooters
  // ─────────────────────────────────────────────────────────────
  startAnimationLoop();

  // ─────────────────────────────────────────────────────────────
  // 4. Setup WebSocket-client-connection
  // ─────────────────────────────────────────────────────────────
  initWebSocket();

  // ─────────────────────────────────────────────────────────────
  // 5. Initialize the bottom city navigation panel
  // ─────────────────────────────────────────────────────────────
  initCityLinks(switchTo);


  // ─────────────────────────────────────────────────────────────
  // 6. Render all the three cities' zones
  // ─────────────────────────────────────────────────────────────
  renderAllZones(map);


}
  // ─────────────────────────────────────────────────────────────
  // Grand finale - start the app once the DOM is ready
  // ─────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }