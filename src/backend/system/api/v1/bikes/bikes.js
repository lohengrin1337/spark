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
router.put('/:id',
    auth.authToken,
    rateLimit.limiter,
    auth.authAdminOrUserOrDevice,
    async (req, res) => {
        const bikeId = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (isNaN(bikeId)) {
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

/**
 * PUT bikes/:id/status
 * Updates bike status and publishes admin command update (used by admin UI).
 *
 * This endpoint is the "control-plane" status change:
 * - DB is updated
 * - status event is published to admin:scooter_status_update so the simulator can react
 */
router.put('/:id/status',
    auth.authToken,
    rateLimit.limiter,
    auth.authAdminOrUserOrDevice,
    async (req, res) => {
        const bikeId = parseInt(req.params.id, 10);
        const { status: newStatus, lat, lng } = req.body;

        if (!bikeId || isNaN(bikeId)) {
            return res.status(400).json({ error: "Invalid bike id" });
        }
        if (!newStatus || typeof newStatus !== 'string') {
            return res.status(400).json({ error: "Valid 'status' field is required in request body" });
        }

        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        if (isNaN(parsedLat) || isNaN(parsedLng)) {
            return res.status(400).json({ error: "Valid 'lat' and 'lng' fields are required in request body" });
        }

        try {
            const affectedRows = await bikeService.updateBikeStatusAndPositionById(
                bikeId,
                newStatus.trim(),
                parsedLat,
                parsedLng,
                { publishAdmin: true }
            );

            if (affectedRows === 0) {
                return res.status(404).json({ error: "Bike not found or already deleted" });
            }

            res.status(200).json({
                success: true,
                message: `Bike ${bikeId} status updated to '${newStatus}' @ (${parsedLat}, ${parsedLng})`
            });
        } catch (err) {
            console.error("Error updating bike status:", err);
            res.status(500).json({ error: "Failed to update bike status" });
        }
});

/**
 * PUT bikes/:id/status/table
 * Same as above, but without position, used in admin scooter table
 */
router.put('/:id/status/table',
    auth.authToken,
    rateLimit.limiter,
    auth.authAdminOrUserOrDevice,
    async (req, res) => {
        const bikeId = parseInt(req.params.id, 10);
        const { status: newStatus } = req.body;

        if (!bikeId || isNaN(bikeId)) {
            return res.status(400).json({ error: "Invalid bike id" });
        }
        if (!newStatus || typeof newStatus !== 'string') {
            return res.status(400).json({ error: "Valid 'status' field is required in request body" });
        }

        try {
            const affectedRows = await bikeService.updateBikeStatusById(
                bikeId,
                newStatus.trim(),
                { publishAdmin: true }
            );

            if (affectedRows === 0) {
                return res.status(404).json({ error: "Bike not found or already deleted" });
            }

            res.status(200).json({
                success: true,
                message: `Bike ${bikeId} status updated to '${newStatus}'`
            });
        } catch (err) {
            console.error("Error updating bike status:", err);
            res.status(500).json({ error: "Failed to update bike status" });
        }
});

/**
 * PUT bikes/:id/status/sim
 * Simulator/system canonical status update endpoint.
 * Same payload, but does NOT publish to admin command channel.
 *
 * This endpoint is the "data-plane" truth for bikes:
 * 
 * Status + coordinates are updated atomically in db, no admin command is published
 * 
 */
router.put('/:id/status/sim',
    auth.authToken,
    rateLimit.simulationLimiter,
    auth.authAdminOrUserOrDevice,
    async (req, res) => {
        const bikeId = parseInt(req.params.id, 10);
        const { status: newStatus, lat, lng } = req.body;

        if (!bikeId || isNaN(bikeId)) {
            return res.status(400).json({ error: "Invalid bike id" });
        }
        if (!newStatus || typeof newStatus !== 'string') {
            return res.status(400).json({ error: "Valid 'status' field is required in request body" });
        }

        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        if (isNaN(parsedLat) || isNaN(parsedLng)) {
            return res.status(400).json({ error: "Valid 'lat' and 'lng' fields are required in request body" });
        }

        try {
            const affectedRows = await bikeService.updateBikeStatusAndPositionById(
                bikeId,
                newStatus.trim(),
                parsedLat,
                parsedLng,
                { publishAdmin: false }
            );

            if (affectedRows === 0) {
                return res.status(404).json({ error: "Bike not found or already deleted" });
            }

            res.status(200).json({
                success: true,
                message: `Bike ${bikeId} status updated to '${newStatus}' @ (${parsedLat}, ${parsedLng})`
            });
        } catch (err) {
            console.error("Error updating bike status and position (sim):", err);
            res.status(500).json({ error: "Failed to update bike status and position" });
        }
});


/**
 * DELETE bikes/:id
 * Soft deletes bike by setting status to deleted.
 */
router.delete('/:id',
    auth.authToken,
    rateLimit.limiter,
    auth.authAdminOrUserOrDevice,
    async (req, res) => {
        const bikeId = parseInt(req.params.id, 10);

        if (!bikeId || isNaN(bikeId)) {
            return res.status(400).json({ error: "Invalid bike id" });
        }

        try {
            const affectedRows = await bikeService.removeBikeById(bikeId);

            if (affectedRows === 0) {
                return res.status(404).json({ error: "Bike not found or already deleted" });
            }

            res.status(200).json({
                success: true,
                message: `Bike ${bikeId} deleted`
            });
        } catch (err) {
            console.error("Error deleting bike:", err);
            res.status(500).json({ error: "Failed to delete bike" });
        }
});

module.exports = router;
