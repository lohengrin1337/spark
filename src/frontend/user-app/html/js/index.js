/**
 * @module index
 * Main entry point for the User App
 */

import { initMap, startAnimationLoop, updateTileLayer, switchTo } from './user-map.js';
import { initWebSocket } from './state-stream.js';
import { initCityLinks } from '/shared/js/map/cities.js';
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

  initCityLinks(switchTo);

  const observer = new MutationObserver(updateTileLayer);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  updateTileLayer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
