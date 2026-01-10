/**
 * @module zone-helpers
 * Handles rendering of zones on a Leaflet map.
 * Now supports real polygon rendering for parking zones when available,
 * falling back to circle (center + radius) only for POINT geometry.
 */

/* global L */

const ZONE_STYLES = {
  city: { color: '#689F38', weight: 2, fillColor: '#00ff00', fillOpacity: 0.13 },
  slow: { color: '#B12B2B', weight: 2, fillColor: '#CF8030', fillOpacity: 0.17 },
  charging: { color: 'yellow', weight: 2, fillColor: 'yellow', fillOpacity: 0.3 },
  parking: { color: 'blue', weight: 2, fillColor: '#1E90FF', fillOpacity: 0.3 }
};

const PARKING_RADIUS = 50; // meters - fallback for POINT geometry
let allLayers = [];

/**
 * Clear all zone layers from the map
 */
function clearAllZones() {
  allLayers.forEach(layer => layer.remove());
  allLayers = [];
}

/**
 * Parse WKT safely
 * Supports:
 * - POINT(lon lat)
 * - POLYGON((lon lat, lon lat, ...))
 */
function parseWKT(wkt) {
  if (!wkt) return null;
  wkt = wkt.trim();

  if (wkt.startsWith('POINT(')) {
    const match = wkt.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match) return { type: 'point', lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
  }

  if (wkt.startsWith('POLYGON(')) {
    const coordStr = wkt.slice(9, -2);
    const points = [];

    coordStr.split(',').forEach(pair => {
      const [lngStr, latStr] = pair.trim().split(/\s+/);
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
    });

    if (points.length >= 3) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) points.push(first);
      return { type: 'polygon', points };
    }
  }

  return null;
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

    // eslint-disable-next-line no-console
    console.log(`Loaded ${zones.length} zones`);

    // Render order: slow -> city -> parking/charging (top)
    const slowLayers = [];
    const cityLayers = [];
    const topLayers = [];

    zones.forEach(zone => {
      const geometry = parseWKT(zone.coordinates);
      if (!geometry) return;

      const bikeCount = Array.isArray(zone.bikes) ? zone.bikes.length : 0;
      let layer;

      switch (zone.zone_type) {
        case 'slow': {
          if (geometry.type !== 'polygon') return;

          layer = L.polygon(geometry.points, ZONE_STYLES.slow)
            .bindPopup(
              `<strong>${zone.city} - Ytterzon (Slow zone)</strong><br>ID: ${zone.zone_id}<br>Antal cyklar: ${bikeCount}`
            );

          slowLayers.push(layer);
          break;
        }

        case 'city': {
          if (geometry.type !== 'polygon') return;

          layer = L.polygon(geometry.points, ZONE_STYLES.city)
            .bindPopup(
              `<strong>${zone.city} - Stadszon (City zone)</strong><br>ID: ${zone.zone_id}<br>Antal cyklar: ${bikeCount}`
            );

          cityLayers.push(layer);
          break;
        }

        case 'charging': {
          if (geometry.type !== 'polygon') return;

          layer = L.polygon(geometry.points, ZONE_STYLES.charging)
            .bindPopup(
              `<strong>${zone.city} - Laddzon</strong><br>ID: ${zone.zone_id}<br>Antal cyklar: ${bikeCount}`
            );

          topLayers.push(layer);
          break;
        }

        case 'parking': {
          if (geometry.type === 'polygon') {
            layer = L.polygon(geometry.points, ZONE_STYLES.parking)
              .bindPopup(
                `<strong>${zone.city} - Parkeringszon (Polygon)</strong><br>ID: ${zone.zone_id}`
              );

            topLayers.push(layer);
            break;
          }

          if (geometry.type === 'point') {
            const center = [geometry.lat, geometry.lng];

            layer = L.circle(center, {
              radius: PARKING_RADIUS,
              ...ZONE_STYLES.parking
            }).bindPopup(
              `<strong>${zone.city} - Parkeringszon</strong><br>Radius: ${PARKING_RADIUS} m<br>ID: ${zone.zone_id}<br>Antal cyklar: ${bikeCount}`
            );

            topLayers.push(layer);
            break;
          }

          return;
        }

        default:
          // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('Failed to load or render zones:', err);
  }
}
