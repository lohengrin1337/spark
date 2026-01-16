/**
 * @module index
 * Main entry point for the User App
 */

import { initMap, startAnimationLoop, switchToCityUserApp, initCityNavVisibility } from './user-map.js';
import { initWebSocket } from './state-stream.js';
import { initCityLinksUserApp } from '/shared/js/map/cities.js';
import { initTheme } from '/shared/theme/theme.js';

function startApp() {
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.error('Map element not found! Retrying...');
    requestAnimationFrame(startApp);
    return;
  }

  initTheme();
  
  initMap();

  startAnimationLoop();

  initWebSocket();

  initCityLinksUserApp(switchToCityUserApp);

  initCityNavVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
