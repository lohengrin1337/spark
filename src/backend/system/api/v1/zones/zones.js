const router = require('express').Router();

const zoneService = require('./zoneService');
const auth = require('./../../../middleware/jwtauth');


/**
 * GET zones
 * Returns all zones or zones matching query
 * Response: 200 ok and array of zone objects.
 */
router.get('/', auth.authToken,
    async (req, res) => {
        const filter = req.query;
        const zones = await zoneService.getZones(filter);
    res.status(200).json(zones);
});

/**
 * GET zone by id
 * Response: 200 ok and zone object.
 */
router.get('/:id', auth.authToken, 
    async (req, res) => {
        const id =Number(req.params.id);
        const zone = await zoneService.getZoneById(id);
        if (!zone) {
            const err = new Error('Zone not found');
            err.status = 404;
            console.error(err);
            throw err;
        }
        res.status(200).json(zone);
});

module.exports = router;
