const router = require('express').Router();
// const validate = require('../middleware/validate.js');
const auth = require('./../../../middleware/jwtauth');
const rateLimit = require('./../../../middleware/ratelimit');
const bikeService = require('./bikeService');

/**
 * If no query params it gets all non-deleted bikes in database.
 * Bikes may be filtered on any combination of city, status, zone_type
 * by adding query params.
 * (example: /bikes?city=malmö&zone_type=parking)
 * Response: 200 ok and array of bike objects.
 */
router.get('/',
    auth.authToken, 
    rateLimit.limiter,
    async (req, res) => {
        const filters = req.query;
        const bikes = await bikeService.getBikes(filters);
        res.status(200).json(bikes);
});

/**
 * GET /:id
 * Get bike with id = req.param.id.
 * Response: 200 ok and bike object or 404 not found.
 */
router.get('/:id', 
    auth.authToken, 
    rateLimit.limiter,
    auth.authAdminOrUser, 
    async (req, res) => {
    const id = req.params.id;
    const bike = await bikeService.getBikeById(id);
    res.status(200).json(bike);
});

/**
 * PUT bikes/:id
 * Updates bike status
 */
router.put('/:id', auth.authToken, rateLimit.limiter, auth.authAdminOrUserOrDevice, async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if(isNaN(bikeId)) {
        const err = new Error("Invalid bike id");
        err.name = "InvalidIdError";
        err.status = 400;
        throw err;
    }

    if (!status || status === "undefined") {
        const err = new Error("Bike status is required");
        err.name = "InvalidBodyError";
        err.status = 400;
        throw err;

    }

    await bikeService.updateBikeStatus(bikeId, status);
    res.json({
        success: true,
        message: "Status updated"
    });
});
router.put('/:id/status', async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);
    const { status: newStatus } = req.body;
  
    if (!bikeId || isNaN(bikeId)) {
      return res.status(400).json({ error: "Invalid bike id" });
    }
    if (!newStatus || typeof newStatus !== 'string') {
      return res.status(400).json({ error: "Valid 'status' field is required in request body" });
    }
  
    try {
      // ADMIN endpoint: this is a real override command
      const affectedRows = await bikeService.updateBikeStatusById(bikeId, newStatus.trim(), {
        publishAdmin: true
      });
  
      if (affectedRows === 0) {
        return res.status(404).json({ error: "Bike not found or already deleted" });
      }
  
      res.status(200).json({ success: true, message: `Bike ${bikeId} status updated to '${newStatus}'` });
    } catch (err) {
      console.error("Error updating bike status:", err);
      res.status(500).json({ error: "Failed to update bike status" });
    }
  });
  
  /**
   * Simulator/system canonical status update endpoint.
   * Same payload, but does NOT publish to admin command channel.
   */
  router.put('/:id/status/sim', async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);
    const { status: newStatus } = req.body;
  
    if (!bikeId || isNaN(bikeId)) {
      return res.status(400).json({ error: "Invalid bike id" });
    }
    if (!newStatus || typeof newStatus !== 'string') {
      return res.status(400).json({ error: "Valid 'status' field is required in request body" });
    }
  
    try {
      const affectedRows = await bikeService.updateBikeStatusById(bikeId, newStatus.trim(), {
        publishAdmin: false
      });
  
      if (affectedRows === 0) {
        return res.status(404).json({ error: "Bike not found or already deleted" });
      }
  
      res.status(200).json({ success: true, message: `Bike ${bikeId} status updated to '${newStatus}'` });
    } catch (err) {
      console.error("Error updating bike status (sim):", err);
      res.status(500).json({ error: "Failed to update bike status" });
    }
  });
  


module.exports = router;
