/**
 * @module mapMarkers-user
 * 
 * Handles map markers and popups specifically for the user app view.
 * 
 * Shows only rentable scooters (available, idle, charging) plus the user's currently active rental.

 * Integrates tightly with Rental_Listener and the Simulator for real-time consistency.
 */

import { getScooterIcon } from '/shared/js/map/marker-icons.js';
import { scooterMarkers, map, animateMarkerTo } from './user-map.js';
import { loadCustomer } from '/shared/js/api.js';

const API_BASE = "";
const RENTAL_API = `${API_BASE}/api/v1/rentals`;
const USER_START_API = `${RENTAL_API}`;
const USER_END_API = (id) => `${RENTAL_API}/${id}`;

let currentCustomer = null;

async function ascertainCustomer() {
  if (currentCustomer) return currentCustomer;
  currentCustomer = await loadCustomer();
  return currentCustomer;
}
let currentRental = {
  rental_id: null,
  scooter_id: null,
  lat: null,
  lng: null,
  startTime: null  // Client-side timestamp for when rental started (approximate duration)
};

// Wrapper elements + duration timer
let rentalWrapper = null;
let rentalBackdrop = null;
let durationInterval = null;

function createRentalWrapper() {
  if (rentalWrapper) return { wrapper: rentalWrapper, backdrop: rentalBackdrop };

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.classList.add('rental-backdrop');

  // Main wrapper
  const wrapper = document.createElement('div');
  wrapper.classList.add('rental-wrapper');

  wrapper.innerHTML = `
    <div class="rental-handle"></div>
    <div class="wrapper-content"></div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(wrapper);

  rentalWrapper = wrapper;
  rentalBackdrop = backdrop;

  // Close only when clicking the visible backdrop (outside the wrapper)
  backdrop.addEventListener('click', closeRentalWrapper);

  return { wrapper, backdrop };
}

function openRentalWrapper(htmlContent) {
  const { wrapper, backdrop } = createRentalWrapper();
  wrapper.querySelector('.wrapper-content').innerHTML = htmlContent;


  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    wrapper.classList.add('open');
  });

  startDurationCounter();
}

function closeRentalWrapper() {
  if (!rentalWrapper) return;

  rentalWrapper.classList.remove('open');
  rentalBackdrop.classList.remove('visible');

  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

function startDurationCounter() {
  const el = document.querySelector('.duration-counter');
  if (!el || !currentRental.startTime) return;

  if (durationInterval) clearInterval(durationInterval);

  const update = () => {
    const elapsedMs = Date.now() - currentRental.startTime;
    const hours = String(Math.floor(elapsedMs / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');
    el.textContent = `${hours}:${minutes}:${seconds}`;
  };

  update();
  durationInterval = setInterval(update, 1000);
}

function attachWrapperButtonListeners() {
  const startBtn = document.querySelector('.start-rental-button');
  if (startBtn) {
    startBtn.onclick = async () => {
      const id = startBtn.dataset.id;
      const lat = startBtn.dataset.lat;
      const lng = startBtn.dataset.lng;
      await startRental(id, lat, lng);
      closeRentalWrapper();
    };
  }

  const endBtn = document.querySelector('.end-rental-button');
  if (endBtn) {
    endBtn.onclick = async () => {
      const rentalId = endBtn.dataset.rentalId;
      await endRental(rentalId);
      closeRentalWrapper();
    };
  }
}

export function updateScooterMarker(id, sc) {
  const lat = sc?.lat;
  const lng = (typeof sc?.lng === 'number') ? sc.lng : sc?.lon;

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    console.warn(`[UserMapMarkers] Invalid position for scooter ${id} - skipping update`);
    return;
  }

  const isRentable = sc.st === 'available' || sc.st === 'idle' || sc.st === 'charging';
  const isMyRental = parseInt(id) === currentRental.scooter_id;

  if (!isRentable && !isMyRental) {
    if (scooterMarkers[id]) {
      map.removeLayer(scooterMarkers[id]);
      delete scooterMarkers[id];
    }
    return;
  }

  let marker = scooterMarkers[id];

  if (!marker) {
    const icon = isMyRental ? getScooterIcon('active')
                 : sc.st === 'charging' ? getScooterIcon('charging')
                 : getScooterIcon('available');

    marker = L.marker([lat, lng], { icon });
    marker.addTo(map);
    scooterMarkers[id] = marker;
  }

  const newIcon = isMyRental ? getScooterIcon('active')
                  : sc.st === 'charging' ? getScooterIcon('charging')
                  : getScooterIcon('available');

  if (marker.options.icon !== newIcon) {
    marker.setIcon(newIcon);
  }

  if (isMyRental) {
    currentRental.lat = lat;
    currentRental.lng = lng;
  }

  const statusText = isMyRental ? 'Aktiv (din hyra)'
                     : sc.st === 'charging' ? 'Laddar'
                     : 'Tillgänglig';

  const statusClass = isMyRental ? 'status-active'
                      : sc.st === 'charging' ? 'status-charging'
                      : 'status-idle';

  const batteryClass = sc.bat < 20 ? 'low' : sc.bat < 30 ? 'medium' : 'high';
  const batteryChargingClass = sc.st === 'charging' ? 'charging' : '';

  let actionButton = '';
  if (isRentable && !isMyRental) {
    actionButton = `
      <button class="action-button start-button start-rental-button"
              data-id="${id}" data-lat="${lat}" data-lng="${lng}">
        Starta hyra
      </button>`;
  } else if (isMyRental) {
    actionButton = `
      <button class="action-button end-button end-rental-button"
              data-rental-id="${currentRental.rental_id}">
        Avsluta hyra
      </button>`;
  }

  let durationRow = '';
  if (isMyRental) {
    durationRow = `
      <div class="info-row">
        <div class="label">Hyrtid (ca)</div>
        <div class="duration-counter">00:00:00</div>
      </div>`;
  }

  const wrapperHTML = `
    <div class="wrapper-info">
      <div class="scooter-title">Scooter ${id}</div>

      ${durationRow}

      <div class="info-row">
        <div class="label">Status</div>
        <div class="status-box ${statusClass}">${statusText}</div>
      </div>

      <div class="info-row">
        <div class="label">Batteri</div>
        <div class="battery-bar">
          <div class="battery-fill ${batteryClass} ${batteryChargingClass}"
               style="width: ${sc.bat}%"></div>
        </div>
        <div class="battery-value">${sc.bat}%</div>
      </div>
    </div>

    <div class="wrapper-action">
      ${actionButton}
    </div>
  `;

  marker.off('click');
  marker.on('click', () => {
    openRentalWrapper(wrapperHTML);
    setTimeout(attachWrapperButtonListeners, 150);
  });

  animateMarkerTo(marker, [lat, lng]);
}

async function startRental(scooterId, lat, lng) {
  const lon = parseFloat(lng);
  const la = parseFloat(lat);

  if (Number.isNaN(lon) || Number.isNaN(la)) {
    console.error("[UserApp] Invalid coordinates for startRental:", { lat, lng });
    alert("Ogiltig position för startpunkt.");
    return;
  }

  const start_point = { lat: la, lon };

  try {
    // Resolve logged-in customer dynamically (no placeholder id)
    const customer = await ascertainCustomer();

    if (!customer) {
      alert("Ingen kund inloggad.");
      return;
    }

    const customerId = customer.customer_id ?? customer.id;
    if (!customerId) {
      console.error("[UserApp] Customer object missing id fields:", customer);
      alert("Kunde inte läsa kund-ID. Logga in igen.");
      return;
    }

    // Prevent starting a new rental if one is already active
    if (currentRental?.rental_id) {
      alert("Du har redan en aktiv hyra.");
      return;
    }

    const response = await fetch(USER_START_API, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      },
      body: JSON.stringify({
        customer_id: customerId,
        bike_id: parseInt(scooterId, 10),
        start_point
      })
    });

    if (response.ok) {
      const data = await response.json();

      currentRental = {
        rental_id: data.rental_id ?? data.id ?? null,
        scooter_id: parseInt(scooterId, 10),
        lat: la,
        lng: lon,
        startTime: Date.now()
      };

      alert("Uthyrning startad. Ha en trevlig tur!");
    } else {
      const errText = await response.text().catch(() => "");
      console.error("[UserApp] Start rental failed:", response.status, errText);
      alert(`Kunde inte starta uthyrning: ${errText || response.status}`);
    }
  } catch (err) {
    console.error("[UserApp] Start rental error:", err);
    alert("Nätverksfel...");
  }
}


async function endRental(rentalId) {
  try {
    const response = await fetch(USER_END_API(rentalId), {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      }
    });

    if (response.ok) {
      alert("Uthyrning avslutad. Tack för resan! En faktura ligger nu redo bland dina sidor.");
      currentRental = { rental_id: null, scooter_id: null, lat: null, lng: null, startTime: null };
      if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
      }
    } else {
      const err = await response.text();
      alert(`Kunde inte avsluta hyra: ${err}`);
    }
  } catch (err) {
    console.error("[UserApp] End rental error:", err);
    alert("Nätverksfel");
  }
}