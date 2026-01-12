import { translateZoneToSwedish, calculateRentalCost, translateInvStatusToSwe } from './frontend-helpers.js';

/**
 * Fetches all rentals from the API and populates the rental table in the DOM.
 * @async
 */
export async function loadRentals(source = 'user-web') {
  try {
    const token = localStorage.getItem("token");
    const url = source == "user-web" ? "/api/v1/rentals/customer" : "/api/v1/rentals";
    const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': "application/json"
            }
        });
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

    const invoices = await getInvoices();

    rentals.forEach(rent => {
      const startDate = new Date(rent.start_time);
      const endDate   = rent.end_time ? new Date(rent.end_time) : null;

      let duration = '-';

      if (endDate) {
        const diffMs = endDate - startDate;
        const minutes = diffMs / 60000;

        duration = Math.floor(minutes) + ' min';
      }

      const rentalInvoice = invoices.find(invoice => invoice.rental_id === rent.rental_id);
      const cost = rentalInvoice ? `${rentalInvoice.amount} kr`: "-";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rent.rental_id}</td>
        <td>${startDate.toLocaleString()}</td>
        <td>${endDate ? endDate.toLocaleString() : 'Pågår'}</td>
        <td>${translateZoneToSwedish(rent.start_zone) ?? '-'}</td>
        <td>${translateZoneToSwedish(rent.end_zone) ?? '-'}</td>
        <td>${duration}</td>
        <td>${cost}</td>
        <td>
          ${endDate
            ? `<a href="${source === 'user-app' ? 'user-app-route.html' : 'route.html'}#${rent.rental_id}">Se på karta</a>`
            : '-'}
        </td>
      `;
      tr.dataset.status = endDate ? "finished" : "active";
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
 * Fetches a single rental by ID from the API.
 * 
 * Parses the route, and converts date strings to Date objects.
 * 
 * @async
 * @param {string|number} id - The rental ID to fetch.
 * @returns {Promise<Object>} Rental object with parsed geometry and Date objects.
 * @throws {Error} If the rental is not found or the request fails.
 */
export async function getRentalForRouteShowcase(id) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/v1/rentals/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': "application/json"
            }
        });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Rental not found');
      }
      throw new Error(`Failed to fetch rental (HTTP ${res.status})`);
    }

    const rent = await res.json();

    // Get cost from invoice
    const invoices = await getInvoices();
    const rentalInvoice = invoices.find(invoice => invoice.rental_id === rent.rental_id);
    rent.cost = rentalInvoice ? `${rentalInvoice.amount} kr` : "-";
    
    ['start_point', 'end_point', 'route'].forEach(field => {
      if (rent[field] && typeof rent[field] === 'string') {
        try {
          rent[field] = JSON.parse(rent[field]);
        } catch (e) {
        }
      }
    });
    
    // Convert date strings to Date objects
    rent.startDate = new Date(rent.start_time);
    rent.endDate = rent.end_time ? new Date(rent.end_time) : null;
    
    // Calc duration
    if (rent.endDate) {
      const diffSec = (rent.endDate - rent.startDate) / 1000;
      const minutes = Math.floor(diffSec / 60);
      const seconds = Math.floor(diffSec % 60);
      rent.duration = `${minutes} min ${seconds} sek`;
    }
    
    return rent;
  } catch (err) {
    console.error('Error fetching rental:', err);
    throw err;
  }
}


/**
 * Fetches all invoices from the API and populates the invoice table in the DOM.
 * If called with a customer token it fetches the invoices belonging to that customer.
 * @async
 * @param {string} [mode='admin'] - 'admin' shows void option, 'user' shows pay option
 */
export async function loadInvoices(mode = 'admin', customer = '') {
  try {
    const invoices = await getInvoices(customer);
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';

    if (!invoices.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; opacity: 0.6;">
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

      let actionsCell = '-';

      const isFinalized = inv.status === 'paid' || inv.status === 'void';

      if (!isFinalized) {
        if (mode === 'admin') {
          actionsCell = `
            <a href="#" class="void-invoice" data-id="${inv.invoice_id}">
              Makulera faktura
            </a>
          `;
        } else if (mode === 'user') {
          actionsCell = `
            <a href="pay.html?id=${inv.invoice_id}" class="pay-button">
              Betala
            </a>
          `;
        } else if (mode === 'user-app') {
          actionsCell = `
            <a href="user-app-pay.html?id=${inv.invoice_id}" class="pay-button">
              Betala
            </a>
          `;
        }
      };
      // If finalized (paid or void) -> keep actionsCell as '-'      

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${inv.invoice_id}</td>`;

      if (mode === "admin") {
        tr.innerHTML += `
          <td>
          <a href="route.html#${inv.rental_id}">${inv.rental_id}</a>
          </td>
          <td>
            <a href="admin-customer-invoices.html?customer_id=${inv.customer_id}">${inv.customer_id}</a>
          </td>`;
      } else {
        tr.innerHTML += `
          <td>
            <a href="route.html#${inv.rental_id}">
              ${inv.rental_id}
            </a>
          </td>`;
      }

      tr.innerHTML += `
        <td>${created}</td>
        <td>${due}</td>
        <td>${translateInvStatusToSwe(inv.status)}</td>
        <td>${inv.amount} kr</td>
        <td class="pay-cell">${actionsCell}</td>
      `;

      if (isFinalized) {
        tr.style.opacity = '0.6';
        tr.style.pointerEvents = 'none';
        tr.querySelector("td a").style.pointerEvents = 'auto';
      }

      tbody.appendChild(tr);
    });

    if (mode === 'admin') {
      tbody.querySelectorAll('.void-invoice').forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const invoiceId = link.dataset.id;

          if (!confirm(`Makulera faktura ${invoiceId}?`)) {
            return;
          }

          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/v1/invoices/void/${invoiceId}`, {
              method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || 'Error when voiding the invoice');
            }

            alert('Fakturan har makulerats');
            loadInvoices('admin');
          } catch (err) {
            alert('Kunde inte makulera fakturan: ' + err.message);
          }
        });
      });
    }

  } catch (err) {
    console.error(err);
    document.getElementById('invoice-table-body').innerHTML = `
      <tr>
        <td colspan="8" style="color:red;">
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
let filterListenersAttached = false;

export async function loadBikes() {
    if (!filterListenersAttached) {
        ['city-filter', 'status-filter', 'zone_type-filter'].forEach(id => {
            document.getElementById(id).addEventListener('change', loadBikes);
        });
        filterListenersAttached = true;
    }

    const city = document.getElementById("city-filter")?.value;
    const status = document.getElementById("status-filter")?.value;
    const zone_type = document.getElementById("zone_type-filter")?.value;
    const params = new URLSearchParams();

    if (city) params.append('city', city);
    if (status) params.append('status', status);
    if (zone_type) params.append('zone_type', zone_type);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/v1/bikes?${params.toString()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-type": "application/json"
        }
    });
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
      const parking = bk.zones.find(z => z.zone_type == 'parking');
      const charging = bk.zones.find(z => z.zone_type == 'charging');
      const city = bk.zones.find(z => z.zone_type == 'city');

      const showZone = parking || charging || city;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bk.bike_id}</td>
        <td>${bk.city}</td>
        <td>${bk.status}</td>
        <td>
<!--          <a href="#" class="delete-bike" data-id="${bk.bike_id}">Ta ur drift</a> -->
          <button class="delete-bike" data-id="${bk.bike_id}">Ta ur drift</button><br>
          <button class="service-bike" data-id=${bk.bike_id}>Skicka på service</button>
        </td>
        <td>${showZone ? `<a href="/admin-zone-view?zone_id=${showZone.zone_id}">${showZone.zone_id}</a>` : '-'}</td>
      `;
    
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-bike').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const bikeId = button.dataset.id;

        if (!confirm(`Ta sparkcykel ${bikeId} ur drift?`)) return;
    
        try {
            const token = localStorage.getItem("token");
            const bike = { status: "deleted" };
            const res = await fetch(`/api/v1/bikes/${bikeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                    },
                body: JSON.stringify(bike)
            });
    
          if (!res.ok) throw new Error(await res.text());
    
          await res.json();
          alert('Sparkcykel togs ur drift');
          loadBikes();
        } catch (err) {
          alert('Kunde inte ta ur drift: ' + err.message);
        }
      });
    });
    tbody.querySelectorAll('.service-bike').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const bikeId = button.dataset.id;
    
        try {
            const token = localStorage.getItem("token");
            const bike = { status: "needService" };
            const res = await fetch(`/api/v1/bikes/${bikeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                    },
                body: JSON.stringify(bike)
          });
    
          if (!res.ok) throw new Error(await res.text());
    
          const data = await res.json();
          alert(data.message + " Markerad för service");
          loadBikes();
        } catch (err) {
          alert('Något gick fel: ' + err.message);
        }
      });
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


/**
 * Fetches all customers from the API and populates the customers table in the DOM.
 * @async
 */
export async function loadCustomers() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/v1/customers', {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const customers = await res.json();
    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = '';

    if (customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; opacity: 0.6;">
            Inga kunder ännu...
          </td>
        </tr>
      `;
      return;
    }

    customers.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.customer_id}</td>
        <td>${c.email}</td>
        <td>${c.name}</td>
        <td><a href="admin-customer-invoices.html?customer_id=${c.customer_id}">visa fakturor</a></td>
        <td>${c.blocked ? 'Ja' : 'Nej'}</td>
        <td>
          <a href="#" class="toggle-block" data-id="${c.customer_id}">
            ${c.blocked ? 'Avspärra' : 'Spärra'}
          </a>
        </td>
      `;

      if (c.blocked) {
        tr.style.opacity = '0.7';
      }

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-block').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const customerId = link.dataset.id;

        const isCurrentlyBlocked = link.textContent.trim() === 'Avspärra';
        const shouldBeBlocked = !isCurrentlyBlocked;

        const actionText = shouldBeBlocked ? 'Spärra' : 'Avspärra';

        if (!confirm(`${actionText} kund ${customerId}?`)) {
          return;
        }

        try {
          const res = await fetch(`/api/v1/customers/block/${customerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' },
            body: JSON.stringify({ blocked: shouldBeBlocked })
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || data.message || 'Error when attempting to block/unblock');
          }

          alert(data.message || `${actionText === 'Avspärra' ? 'Kund spärrad' : 'Kund avspärrad'}`);
          loadCustomers();
        } catch (err) {
          alert('Kunde inte uppdatera: ' + err.message);
          loadCustomers();
        }
      });
    });

  } catch (err) {
    console.error("Failed to load customers:", err);
    document.getElementById('customers-table-body').innerHTML = 
      `<tr><td colspan="5" style="color:red;">Kunde inte ladda kunder: ${err.message}</td></tr>`;
  }
}


/**
 * Load all fees
 */
export async function loadFees() {
  const token = localStorage.getItem("token");
  const res = await fetch('/api/v1/fees/all', {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Load current fee
 */
export async function loadCurrentFee() {
  const token = localStorage.getItem("token");
  const res = await fetch('/api/v1/fees', {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}




/**
 * Create a new entry in the fee table (= a new current pricing state)
 * @param {Object} fee - { start, minute, discount, penalty }
 */
export async function newFees(fee) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/v1/fees', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' },
      body: JSON.stringify(fee)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to create new fee-row');
    }

    const msg = await res.json();
    return msg;
  } catch (err) {
    console.error('newFee error:', err);
    throw err;
  }
}

export async function loadCustomer() {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/v1/customers/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'},
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const customer = await res.json();
    return customer;
}
export async function updateCustomer(customer) {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/v1/customers', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json' },
        body: JSON.stringify(customer)
    });

    const msg = await res.json();
    return msg;
}

async function getInvoices(customer = '') {
  try {
    const token = localStorage.getItem('token');
    let url = '/api/v1/invoices';
    if (customer) {
        url += `/customer/${customer}`;
    }
    const res = await fetch(`${url}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      }
    });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);  
    return res.json();
  } catch (err) {
    console.log(err);
  }
}