/**
 * @module rentalSidebar
 * Handles the rentals panel and the completed rentals list in the sidebar
 */

// ─────────────────────────────────────────────────────────────
// Update the stats panel with total scooter count
// ─────────────────────────────────────────────────────────────
export function updateStatsPanel(applied, total) {
  document.getElementById('statsContent').innerHTML =
    `${total} sparkcyklar i flottan (hittills)`;
}

// ─────────────────────────────────────────────────────────────
// Add a completed rental entry to the sidebar list
// ─────────────────────────────────────────────────────────────
export function addCompletedRental(msg) {
  // Format coordinates to 7 decimals, accurate enough
  const formattedCoords = msg.coords.map(coord => ({
    lat: Number(coord.lat.toFixed(7)),
    lng: Number(coord.lng.toFixed(7)),
    spd: coord.spd
  }));

  // Create rental list item
  const li = document.createElement('li');
  li.innerHTML = `
    Uthyrning (id): ${msg.rental_id}<br>
    Kund (id): ${msg.user_id}<br>
    Kund (namn): ${msg.user_name}<br>
    Sparkcykel (id): ${msg.scooter_id}</b><br>
    <details><summary>Koordinater (${formattedCoords.length})</summary>
      <pre class="coords-pre">${JSON.stringify(formattedCoords, null, 2)}</pre>
    </details>`;

  // Add new rental list item to the top of the list (prepend, not append)
  document.getElementById('completedRentals').prepend(li);
}
