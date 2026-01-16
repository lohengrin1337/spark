/**
 * @module rental-api
 *
 * Supplies the api-related logic that enables clean functionality and flow in the user-app.
 *
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Imports
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { loadCustomer } from '/shared/js/api.js';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration & API Endpoints
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const API_BASE = "";
const RENTAL_API = `${API_BASE}/api/v1/rentals`;
const USER_START_API = `${RENTAL_API}`;
const USER_END_API = (id) => `${RENTAL_API}/${id}`;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Customer cache
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let currentCustomer = null;

async function ascertainCustomer() {
  if (currentCustomer) return currentCustomer;
  currentCustomer = await loadCustomer();
  return currentCustomer;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Helpers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readErrorTextSafe(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function makeHttpError({ status, text }) {
  const err = new Error(`HTTP ${status}${text ? `: ${text}` : ""}`);
  err.status = status;
  err.text = text;

  if (status === 403) {
    err.userMessage = "Du är blockerad. Kontakta kundtjänst.";
  } else if (status >= 400 && status < 500) {
    err.userMessage = `Begäran misslyckades (${status}).`;
  } else if (status >= 500) {
    err.userMessage = "Serverfel. Försök igen senare.";
  }

  return err;
}

function makeClientError(userMessage) {
  const err = new Error(userMessage);
  err.userMessage = userMessage;
  err.status = 0;
  return err;
}

function parseLatLngOrThrow(lat, lng) {
  const lon = parseFloat(lng);
  const la = parseFloat(lat);

  if (Number.isNaN(lon) || Number.isNaN(la)) {
    throw makeClientError("Ogiltig position för startpunkt.");
  }

  return { la, lon };
}

function getCustomerIdOrThrow(customer) {
  if (!customer) {
    throw makeClientError("Ingen kund inloggad.");
  }

  const customerId = customer.customer_id ?? customer.id;
  if (!customerId) {
    throw makeClientError("Kunde inte läsa kund-ID. Logga in igen.");
  }

  return customerId;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// API - Flows
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Start rental end-to-end for the UI.
 *
 * @param {object} args
 * @param {string|number} args.scooterId
 * @param {string|number} args.lat
 * @param {string|number} args.lng
 * @param {object} args.currentRental - current rental state from UI
 * @returns {Promise<object>} next rental state for UI
 */
export async function startRentalApiFlow({ scooterId, lat, lng, currentRental }) {
  if (currentRental?.rental_id) {
    throw makeClientError("Du har redan en aktiv hyra.");
  }

  const { la, lon } = parseLatLngOrThrow(lat, lng);
  const start_point = { lat: la, lon };

  const customer = await ascertainCustomer();
  const customerId = getCustomerIdOrThrow(customer);

  const payload = {
    customer_id: customerId,
    bike_id: parseInt(scooterId, 10),
    start_point
  };

  const headers = getAuthHeaders();

  console.log("[API] Start rental -> POST", USER_START_API, "| payload:", payload);

  const response = await fetch(USER_START_API, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await readErrorTextSafe(response);
    throw makeHttpError({ status: response.status, text });
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    const e = new Error("Invalid JSON response from start rental");
    e.cause = err;
    e.userMessage = "Servern svarade oväntat. Försök igen.";
    throw e;
  }

  const rid = data?.rental_id ?? data?.id ?? null;

  return {
    rental_id: rid,
    scooter_id: parseInt(scooterId, 10),
    lat: la,
    lng: lon,
    startTime: Date.now()
  };
}

/**
 * End rental end-to-end for the UI.
 *
 * @param {object} args
 * @param {string|number} args.rentalId
 * @returns {Promise<void>}
 */
export async function endRentalApiFlow({ rentalId }) {
  const headers = getAuthHeaders();
  const url = USER_END_API(rentalId);

  console.log("[API] End rental -> PUT", url);

  const response = await fetch(url, {
    method: "PUT",
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    const text = await readErrorTextSafe(response);
    throw makeHttpError({ status: response.status, text });
  }
}
