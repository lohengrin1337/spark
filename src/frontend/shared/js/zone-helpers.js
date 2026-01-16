/**
 * @module zone-helpers
 * Handles rendering of zones on a Leaflet map.
 * Polygon-only rendering (no circle/POINT fallback).
 */

/* global L */

const ZONE_STYLES = {
  city: { color: '#689F38', weight: 2, fillColor: '#00ff00', fillOpacity: 0.13 },
  slow: { color: '#B12B2B', weight: 2, fillColor: '#CF8030', fillOpacity: 0.17 },
  charging: { color: 'yellow', weight: 2, fillColor: 'yellow', fillOpacity: 0.3 },
  parking: { color: 'blue', weight: 2, fillColor: '#1E90FF', fillOpacity: 0.3 }
};

let allLayers = [];

/**
 * Clear all zone layers from the map
 */
function clearAllZones() {
  allLayers.forEach(layer => layer.remove());
  allLayers = [];
}

/**
 * Parse WKT for polygons safely
 */
function parseWKTPolygon(wkt) {
  if (!wkt) return null;
  wkt = wkt.trim();

  if (!wkt.startsWith('POLYGON(')) return null;

  // Expected shape: POLYGON((lng lat, lng lat, ...))
  // Slice off "POLYGON((" (9 chars) and ending "))" (2 chars)
  const coordStr = wkt.slice(9, -2);
  const points = [];

  coordStr.split(',').forEach(pair => {
    const [lngStr, latStr] = pair.trim().split(/\s+/);
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
  });

  if (points.length < 3) return null;

  // Ensure closed ring
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) points.push(first);

  return { type: 'polygon', points };
}

/**
 * Render all zones on the given map
 * @param {L.Map} map
 */
export async function renderAllZones(map) {
  if (!map) return;

  clearAllZones();

  try {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/v1/zones', {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const zones = await res.json();

    // Render order: slow -> city -> parking/charging (top)
    const slowLayers = [];
    const cityLayers = [];
    const topLayers = [];

    zones.forEach(zone => {
      const geometry = parseWKTPolygon(zone.coordinates);
      if (!geometry) return; // polygon-only

      const bikeCount = Array.isArray(zone.bikes) ? zone.bikes.length : 0;
      let layer;

      switch (zone.zone_type) {
        case 'slow': {
          layer = L.polygon(geometry.points, ZONE_STYLES.slow)
            .bindPopup(
              `<strong>${zone.city} - Ytterzon (Slow zone)</strong><br>ID: <a href="/admin-zone-view?zone_id=${zone.zone_id}">${zone.zone_id}</a><br>Antal cyklar: ${bikeCount}`,
              { className: 'popup-slow-zone' }
            );
          slowLayers.push(layer);
          break;
        }

        case 'city': {
          layer = L.polygon(geometry.points, ZONE_STYLES.city)
            .bindPopup(
              `<strong>${zone.city} - Stadszon (City zone)</strong><br>ID: <a href="/admin-zone-view?zone_id=${zone.zone_id}">${zone.zone_id}</a><br>Antal cyklar: ${bikeCount}`,
              { className: 'popup-city-zone' }
            );
          cityLayers.push(layer);
          break;
        }

        case 'charging': {
          layer = L.polygon(geometry.points, ZONE_STYLES.charging)
            .bindPopup(
              `<strong>${zone.city} - Laddzon</strong><br>ID: <a href="/admin-zone-view?zone_id=${zone.zone_id}">${zone.zone_id}</a><br>Antal cyklar: ${bikeCount}`,
              { className: 'popup-charging-zone' }
            );
          topLayers.push(layer);
          break;
        }

        case 'parking': {
          layer = L.polygon(geometry.points, ZONE_STYLES.parking)
            .bindPopup(
              `<strong>${zone.city} - Parkeringszon</strong><br>ID: <a href="/admin-zone-view?zone_id=${zone.zone_id}">${zone.zone_id}</a><br>Antal cyklar: ${bikeCount}`,
              { className: 'popup-parking-zone' }
            );
          topLayers.push(layer);
          break;
        }

        default:
          console.warn('Unknown zone type:', zone.zone_type);
          return;
      }

      if (layer) allLayers.push(layer);
    });

    // Render in order: slow -> city -> parking/charging
    slowLayers.forEach(l => l.addTo(map));
    cityLayers.forEach(l => l.addTo(map));
    topLayers.forEach(l => l.addTo(map).bringToFront());

  } catch (err) {
    console.error('Failed to load or render zones:', err);
  }
}
