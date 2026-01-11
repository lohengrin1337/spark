/**
 * @module ratelimit
 * 
 * API rate-limiting configuration.
 */

const rateLimit = require('express-rate-limit');

/**
 * Per-user, token-linked rate limiter.
 * 
 * Protects the API-routes from abuse, unreasonable use frequency and malign activity.
 * 
 * Used by admin, user-web-user, user-app-user.
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyGenerator: (req) => req.user.id
});

/**
 * Simulation rate-limiter.
 * 
 * All API-activity from the simulation is bound to the same device-token,
 * so the limit is very allowing, with hefty margins.
 * 
 * It makes allowances for very busy and frenetic simulation API-traffic.
 * It is still of use, and acts as an additional guard against the worst effects
 * of a massive request infinite loop, or similar runtime bugs, and helps dampen
 * the undue stress that they put on the system and the database.
 * 
 */
const simulationLimiter = rateLimit({
    windowMs: 1000,
    max: 500,
    keyGenerator: (req) => req.user.id
});


module.exports = { limiter, simulationLimiter };