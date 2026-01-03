/**
 * @module zone-helpers
 * Handles rendering of zones on a Leaflet map.
 */


const ZONE_STYLES = {
  city: { color: '#689F38', weight: 2, fillColor: '#00ff00', fillOpacity: 0.13 },
  slow: { color: '#B12B2B', weight: 2, fillColor: '#CF8030', fillOpacity: 0.17 },
  charging: { color: 'yellow', weight: 2, fillColor: 'yellow', fillOpacity: 0.3 },
  parking: { color: 'blue', weight: 2, fillColor: '#1E90FF', fillOpacity: 0.3 }
};

const PARKING_RADIUS = 50; // meters
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
        console.log(localStorage);
        const token = localStorage.getItem("token");
        console.log(token);
        const res = await fetch('/api/v1/zones', {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const zones = await res.json();
      console.log(`Loaded ${zones.length} zones`);
  
      const slowLayers = [];
      const cityLayers = [];
      const topLayers = [];
  
      zones.forEach(zone => {
        const parsed = parseWKT(zone.coordinates);
        if (!parsed) return;
  
        let layer;
  
        switch (zone.zone_type) {
          case 'slow':
            if (parsed.type !== 'polygon') return;
            layer = L.polygon(parsed.points, ZONE_STYLES.slow)
              .bindPopup(`<strong>${zone.city} - Ytterzon (Slow zone)</strong><br>ID: ${zone.zone_id}`);
            slowLayers.push(layer);
            break;
  
          case 'city':
            if (parsed.type !== 'polygon') return;
            layer = L.polygon(parsed.points, ZONE_STYLES.city)
              .bindPopup(`<strong>${zone.city} - Stadszon (City zone)</strong><br>ID: ${zone.zone_id}`);
            cityLayers.push(layer);
            break;
  
          case 'charging':
            if (parsed.type !== 'polygon') return;
            layer = L.polygon(parsed.points, ZONE_STYLES.charging)
              .bindPopup(`<strong>${zone.city} - Laddzon</strong><br>ID: ${zone.zone_id}`);
            topLayers.push(layer);
            break;
  
          case 'parking':
            let center;
            if (parsed.type === 'point') {
              center = [parsed.lat, parsed.lng];
            } else if (parsed.type === 'polygon') {
              const lat = parsed.points.reduce((a, b) => a + b[0], 0) / parsed.points.length;
              const lng = parsed.points.reduce((a, b) => a + b[1], 0) / parsed.points.length;
              center = [lat, lng];
            } else return;
  
            layer = L.circle(center, {
              radius: PARKING_RADIUS,
              ...ZONE_STYLES.parking
            }).bindPopup(`<strong>${zone.city} - Parkeringszon</strong><br>Radius: ${PARKING_RADIUS} m<br>ID: ${zone.zone_id}`);
            topLayers.push(layer);
            break;
  
          default:
            console.warn('Unknown zone type:', zone.zone_type);
            return;
        }
  
        if (layer) allLayers.push(layer);
      });
  
      // Render in order: slow -> city -> topLayers
      slowLayers.forEach(l => l.addTo(map));
      cityLayers.forEach(l => l.addTo(map));
      topLayers.forEach(l => l.addTo(map).bringToFront());
  
    } catch (err) {
      console.error('Failed to load or render zones:', err);
    }
  }
  