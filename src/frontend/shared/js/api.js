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
/*           <td>${startDate.toLocaleString()}</td>
          <td>${endDate ? endDate.toLocaleString() : 'Pågår'}</td> */
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

