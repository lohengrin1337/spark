/**
 * @module route-helpers
 * @description Provides helpful functions for displaying and replaying rental routes on the
 * (Leaflet) map. Populates info-table, set up map and route, animate scooters, manage tile layers.
 */

let map, tileLayer, scooter, speedPopup;

/**
 * Updates the rental information table with the fetched and provided data.
 */
export function updateInfo(data) {
    document.getElementById('rental-id').textContent = data.rental_id;
    document.getElementById('customer-id').textContent = data.customer_id;
    document.getElementById('bike-id').textContent = data.bike_id;
    document.getElementById('start-time').textContent = data.startDate.toLocaleString('sv-SE');
    document.getElementById('end-time').textContent = data.endDate ? data.endDate.toLocaleString('sv-SE') : 'Pågår';
    if (data.duration != null) {
      const m = Math.floor(data.duration);
      const s = Math.floor((data.duration - m) * 60);
      document.getElementById('duration').textContent = `${m} min ${s} sek`;
    } else {
      document.getElementById('duration').textContent = '-';
    }
    document.getElementById('cost').textContent = data.cost != null ? `${data.cost} kr` : '-';
  }
  
  /**
   * Initializes the Leaflet map, draws the route, including the start/stop markers, and sets up the scooter marker.
   */
  export function initMap(data) {
    map = L.map('map').setView([55.605, 13.003], 10);
  
    const isDark = document.documentElement.classList.contains('dark-mode');
    tileLayer = L.tileLayer(isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);
    
    // Route from the rental object
    const coords = data.route.map(p => [p.lat, p.lng]);
    map.fitBounds(L.latLngBounds(coords), { padding: [120, 120] });
    
    // Route-line
    L.polyline(coords, { color: '#004d00', weight: 3, opacity: 0.4 }).addTo(map);
    
    // Start-point
    const start = data.route[0];
    L.circleMarker([start.lat, start.lng], { radius: 10, fillColor: '#00ff88', color: '#004400', weight: 3, fillOpacity: 0.9 }).addTo(map);
    
    // End-point
    const last = data.route[data.route.length - 1];
    if (data.endDate) {
      L.circleMarker([last.lat, last.lng], { radius: 10, fillColor: '#006600', color: '#002200', weight: 3, fillOpacity: 0.9 }).addTo(map)
    }
    
    // Scooter-marker
    scooter = L.marker([start.lat, start.lng]).addTo(map);
    speedPopup = L.popup({ closeButton: false, autoClose: false, closeOnEscapeKey: false, offset: [0, 10] });
    scooter.bindPopup(speedPopup);
  
    document.getElementById('replay').onclick = () => replay(data);
    replay(data);
  }
  
  /**
   * Animates the scooter marker along the route, updating its position and speed popup. 
   * 
   * (Constant speed for simplicity)
   */
  export function replay(data) {
    if (!scooter || !data) return;
    let i = 0;
    scooter.setLatLng([data.route[0].lat, data.route[0].lng]);
    clearInterval(window.anim);
    data.route.at(-1).spd = 0;
    updateSpeed(0);
    scooter.openPopup();
  
    window.anim = setInterval(() => {
      if (++i >= data.route.length) { clearInterval(window.anim); scooter.closePopup(); return; }
      const p = data.route[i];
      scooter.setLatLng([p.lat, p.lng]);
      updateSpeed(p.spd || 0);
    }, 600);
  }
  
  /**
   * Updates the speed popup displayed on the scooter marker.
   */
  export function updateSpeed(kmh) {
    speedPopup.setContent(`
      <div class="popup-dashboard-box">
        <div class="popup-section alt-section">
          <div class="label">Hastighet</div>
          <div class="value">${kmh.toFixed(1)} km/h</div>
        </div>
      </div>
    `);
  }
  
  /**
   * Replaces the current tile layer, theme based (light/dark).
   */
  export function updateTileLayer(tileURL) {
    if (!tileLayer || !map) return;
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(tileURL, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  }
