/**
 * @module complete_rental_helpers
 *
 * Centralized support logic for rental lifecycle:
 * - classify start_zone/end_zone
 * - load route from Redis (logged in simulator in sync, rental lifecycle itself is decoupled)
 * - extract end_point from route[-1]
 * - publish to sync with simulator after successful DB operations
 */

const pool = require('../../../database/database');
const rentalModel = require('./rentalModel');
const { createInvoiceForRental } = require('../billing/rentalBillingService');

const { redisPublisher, redisClient } = require('../../../redis/redisClient');

// Dedicated client that can handle normal Redis commands (e.g. LRANGE)
const redisReader = redisClient;

const RENTAL_LIFECYCLE_CHANNEL = 'rental:lifecycle';

function routeKey(rentalId) {
  return `rental:${rentalId}:coords`;
}

/**
 * Load route coords from Redis list.
 * ScooterBroadcaster logs in this format: {"lat": <num>, "lng": <num>, "spd": <num>}
 */
async function loadRouteCoords(rentalId) {
    if (!redisReader || typeof redisReader.lrange !== 'function') {
      const err = new Error(
        'Redis reader client not configured (expected an ioredis/redis client with lrange). Check redisClient exports.'
      );
      err.code = 'REDIS_NOT_CONFIGURED';
      throw err;
    }
  
    const raw = await redisReader.lrange(routeKey(rentalId), 0, -1);
    if (!raw || raw.length === 0) return [];
  
    const coords = [];
    for (const item of raw) {
      try {
        coords.push(JSON.parse(item));
      } catch (_) {}
    }
    return coords;
  }
  

/**
 * Normalize payloads into a stable, predictable { lat, lon } object.
 *
 */
function normalizeToLatLon(point) {
  if (!point || typeof point !== 'object') return null;

  if (point.type === 'Point' && Array.isArray(point.coordinates) && point.coordinates.length >= 2) {
    const lon = point.coordinates[0];
    const lat = point.coordinates[1];
    if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
      return { lat, lon };
    }
    return null;
  }

  const lat = point.lat;
  const lon = (typeof point.lon === 'number') ? point.lon : point.lng;

  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return { lat, lon };
}

/**
 * Extract end_point from the last route point.
 */
function endPointFromRouteTail(route) {
  if (!Array.isArray(route) || route.length === 0) return null;

  const last = route[route.length - 1];
  const lat = last?.lat;

  const lon = (typeof last?.lon === 'number') ? last.lon : last?.lng;

  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return { lat, lon };
}

/**
 * Fetch a bike's city from DB.
 */
async function getBikeCity(bikeId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT city FROM bike WHERE bike_id = ?', [bikeId]);
    return rows?.[0]?.city || null;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Classify a point using spark_zone geometries (DB spatial).
 * Same priority as in the Simulator's City-class:
 * 
 *   charging -> parking -> city (free) -> slow -> outofbounds
 */
async function classifyZoneForLatlon(cityName, lat, lon) {
  if (!cityName) return 'outofbounds';
  if (typeof lat !== 'number' || typeof lon !== 'number') return 'outofbounds';

  const pointWkt = `POINT(${lon} ${lat})`;

  const priority = [
    { zone_type: 'charging', result: 'charging' },
    { zone_type: 'parking', result: 'parking' },
    { zone_type: 'city', result: 'free' },
    { zone_type: 'slow', result: 'slow' },
  ];

  let conn;
  try {
    conn = await pool.getConnection();

    for (const p of priority) {
      const rows = await conn.query(
        `
        SELECT zone_id
        FROM spark_zone
        WHERE city = ?
          AND LOWER(zone_type) = ?
          AND (
            ST_Contains(coordinates, ST_GeomFromText(?))
            OR ST_Touches(coordinates, ST_GeomFromText(?))
          )
        LIMIT 1
        `,
        [cityName, p.zone_type, pointWkt, pointWkt]
      );

      if (rows && rows.length > 0) {
        return p.result;
      }
    }

    return 'outofbounds';
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Classify a point of any accepted shape (GeoJSON or lat/lon object).
 */
async function classifyZoneFromAnyPoint(cityName, point) {
  const p = normalizeToLatLon(point);
  if (!p) return 'outofbounds';
  return await classifyZoneForLatlon(cityName, p.lat, p.lon);
}

/**
 * Publish lifecycle events.
 * These should be emitted AFTER DB writes succeed (DB-first).
 */
async function publishRentalStarted({ rental_id, scooter_id, user_id, user_name }) {
  const payload = JSON.stringify({
    type: 'rental_started',
    rental_id,
    scooter_id,
    user_id,
    user_name: user_name || null,
  });

  await redisPublisher.publish(RENTAL_LIFECYCLE_CHANNEL, payload);
}

async function publishRentalEnded({ rental_id, scooter_id }) {
  const payload = JSON.stringify({
    type: 'rental_ended',
    rental_id,
    scooter_id,
  });

  await redisPublisher.publish(RENTAL_LIFECYCLE_CHANNEL, payload);
}

/**
 * Initiates/Creates rental with the correct start_zone.
 *
 */
async function createRentalWithAccurateStartZone({ customer_id, bike_id, start_point, user_name }) {
  const cityName = await getBikeCity(bike_id);

  const startLatLon = normalizeToLatLon(start_point);
  if (!startLatLon) {
    const err = new Error("Invalid start_point; expected {lat, lon} or {lat, lng} or GeoJSON Point");
    err.code = "INVALID_START_POINT";
    throw err;
  }

  const start_zone = await classifyZoneFromAnyPoint(cityName, startLatLon);


  const rental_id = await rentalModel.createRental(customer_id, bike_id, startLatLon, start_zone);

  return { rental_id, start_zone, city: cityName };
}

/**
 * Complete rental using route[-1] as end_point.
 * Computes end_zone here in backend.
 *
 */
async function completeRentalUsingRouteTail(rentalId) {
  const rental = await rentalModel.getOneRental(rentalId);
  if (!rental) {
    const err = new Error('Rental not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const scooter_id = rental.bike_id;

  const route = await loadRouteCoords(rentalId);
  const end_point = endPointFromRouteTail(route);

  if (!end_point) {
    const err = new Error('No route data available to derive end_point');
    err.code = 'NO_ROUTE_DATA';
    throw err;
  }

  const cityName = await getBikeCity(scooter_id);
  const end_zone = await classifyZoneFromAnyPoint(cityName, end_point);

  const affectedRows = await rentalModel.completeRental(rentalId, end_point, end_zone, route);

  if (affectedRows === 0) {
    const err = new Error('Rental not found or already completed');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const invoice = await createInvoiceForRental(rentalId);

  return { invoice, scooter_id, end_point, end_zone, route };
}

module.exports = {
  // Redis route data
  routeKey,
  loadRouteCoords,
  endPointFromRouteTail,

  // Zone classification
  getBikeCity,
  classifyZoneForLatlon,
  classifyZoneFromAnyPoint,

  normalizeToLatLon,

  // Lifecycle publishers
  publishRentalStarted,
  publishRentalEnded,

  // Orchestration helpers
  createRentalWithAccurateStartZone,
  completeRentalUsingRouteTail,
};