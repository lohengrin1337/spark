import { translateZoneToSwedish, calculateRentalCost } from './frontend-helpers.js';

/**
 * Fetches all rentals from the API and populates the rental table in the DOM.
 * @async
 */
export async function loadRentals() {
    try {
      const res = await fetch('/api/rentals');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const rentals = await res.json();
      const tbody = document.getElementById('rental-table-body');
      tbody.innerHTML = '';
  
      if (!rentals.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; opacity: 0.6;">
              Inga uthyrningar ännu...
            </td>
          </tr>
        `;
        return;
      }
  
      rentals.forEach(rent => {
        const startDate = new Date(rent.start_time);
        const endDate   = rent.end_time ? new Date(rent.end_time) : null;
  
        let duration = '-';
        let cost = '-';
  
        if (endDate) {
          const diffMs = endDate - startDate;
          const minutes = diffMs / 60000;
  
          duration = Math.floor(minutes) + ' min';
  
          const calculated = calculateRentalCost(
            rent.start_zone,
            rent.end_zone,
            minutes
          );
  
          cost = calculated !== null ? calculated : '-';
        }
  
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${rent.rental_id}</td>
          <td>${rent.customer_id}</td>
          <td>${startDate.toLocaleString()}</td>
          <td>${endDate ? endDate.toLocaleString() : 'Pågår'}</td>
          <td>${translateZoneToSwedish(rent.start_zone) ?? '-'}</td>
          <td>${translateZoneToSwedish(rent.end_zone) ?? '-'}</td>
          <td>${duration}</td>
          <td>${cost}</td>
          <td>
            ${endDate
              ? `<a href="route.html#${rent.rental_id}">Se på karta</a>`
              : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });
  
    } catch (err) {
      console.error(err);
      document.getElementById('rental-table-body').innerHTML = `
        <tr>
          <td colspan="8" style="color:red;">
            Kunde inte ladda uthyrningar
          </td>
        </tr>
      `;
    }
}

/**
 * Fetches a single rental by ID (ineffectively) from the API and returns its data. Will be updated
 * using /v1/api/rental later.
 * 
 * Calculates duration and cost if the rental has ended.
 * @async
 * @param {string|number} id - The rental ID to fetch.
 * @returns {Promise<Object>} Rental object with parsed route info, duration, cost, and start/end dates.
 * @throws Will throw an error if the rental cannot be fetched or is not found.
 */
export async function getRental(id) {
  try {
    const res = await fetch('/api/rentals');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rentals = await res.json();
    const rent = rentals.find(r => r.rental_id == id);
    if (!rent) throw new Error('Rental not found');

    ['start_point', 'end_point', 'route'].forEach(i => {
      if (typeof rent[i] === 'string') {
        try { rent[i] = JSON.parse(rent[i]); } catch {}
      }
    });

    // Calculate duration and cost if rental has ended
    let duration = null;
    let cost = null;
    if (rent.end_time) {
      const start = new Date(rent.start_time);
      const end = new Date(rent.end_time);
      const minutes = (end - start) / 60000;
      duration = minutes;
      cost = calculateRentalCost(rent.start_zone, rent.end_zone, minutes);
    }

    return {
      ...rent,
      duration,
      cost,
      startDate: new Date(rent.start_time),
      endDate: rent.end_time ? new Date(rent.end_time) : null
    };

  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Fetches all invoices from the API and populates the invoice table in the DOM.
 * @async
 */
export async function loadInvoices() {
  try {
    const res = await fetch('/api/v1/invoices');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const invoices = await res.json();
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';

    if (!invoices.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; opacity: 0.6;">
            Inga fakturor ännu...
          </td>
        </tr>
      `;
      return;
    }

    invoices.forEach(inv => {
      const created = inv.creation_date
        ? new Date(inv.creation_date).toLocaleDateString()
        : '-';

      const due = inv.due_date
        ? new Date(inv.due_date).toLocaleDateString()
        : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${inv.invoice_id}</td>
        <td>Bör vara här, antingen direkt i schema eller via en join</td>
        <td>
          <a href="admin-rentals.html#${inv.rental_id}">
            ${inv.rental_id}
          </a>
        </td>
        <td>${created}</td>
        <td>${due}</td>
        <td>${inv.status}</td>
        <td>${inv.amount}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    document.getElementById('invoice-table-body').innerHTML = `
      <tr>
        <td colspan="6" style="color:red;">
          Kunde inte ladda fakturor
        </td>
      </tr>
    `;
  }
}


/**
 * Fetches all bikes from the API and populates the invoice table in the DOM.
 * @async
 */
export async function loadBikes() {
  try {
    const res = await fetch('/api/v1/bikes');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const bikes = await res.json();
    const tbody = document.getElementById('bike-table-body');
    tbody.innerHTML = '';

    if (!bikes.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; opacity: 0.6;">
            Inga sparkcyklar ännu...
          </td>
        </tr>
      `;
      return;
    }

    bikes.forEach(bk => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bk.bike_id}</td>
        <td>${bk.city}</td>
        <td>${bk.status}</td>
        <td><a href="#${bk.bike_id}">Ta ur drift</a>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    document.getElementById('invoice-table-body').innerHTML = `
      <tr>
        <td colspan="6" style="color:red;">
          Kunde inte ladda sparkcyklar
        </td>
      </tr>
    `;
  }
}


