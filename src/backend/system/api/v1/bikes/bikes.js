const router = require('express').Router();
// const validate = require('../middleware/validate.js');
// const authenticate = require('../middleware/authenticate.js');
// const authorize = require('../middleware/authorize.js');
const bikeService = require('./bikeService');

/**
 * GET bikes
 * Response: 200 ok and array of bike objects.
 */
router.get('/',
    async (req, res) => {
        const { city, status } = req.query;
        if (!status) {
            const bikes = await bikeService.getAllBikes(city);
            return res.status(200).json(bikes);
        }
        const bikes = await bikeService.getBikesByStatus(city, status);
        res.status(200).json(bikes);
});

/**
 * GET /:city
 * Response: 200 ok and bike objects or 404 not found.
 */
router.get('/:id',
    //authenticate, //kollar att det finns en valid token, avkodar, fäster info på req.user
    //validateInvoice, //validerar requesten
    //authorizeInvoiceAccess, // kollar om fakturan får hämtas (jämför user id)
    async (req, res) => {
    const id = req.params.id;
    try {
        const bike = await bikeService.getBikeById(id);
        if (!bike) {
            return res.status(404).json({ error: 'Not found'});
        }
        res.status(200).json(bike);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch - ${id}`});
    }  
});

/**
 * Soft delete a bike by id
 */
router.put('/delete/:id', async (req, res) => {
    const bikeId = parseInt(req.params.id, 10);

    if (!bikeId) {
        return res.status(400).json({ error: "Invalid bike id" });
    }

    try {
        const result = await bikeService.removeBikeById(bikeId);

        if (result === 0) {
            return res.status(404).json({ error: "Bike not found" });
        }

        res.status(200).json({ success: true, message: "Bike marked as deleted (soft deletion)" });
    } catch (err) {
        console.error("Error deleting bike:", err);
        res.status(500).json({ error: "Failed to delete bike" });
    }
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
