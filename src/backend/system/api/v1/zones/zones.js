const router = require('express').Router();

const zoneService = require('./zoneService');

/**
 * GET zones
 * If no query parameters are sent in it shows all zones.
 * Response: 200 ok and array of zone objects.
 */
router.get('/',
    async (req, res) => {
        const { type } = req.query;
        console.log("req.query", req.query);
        console.log("zoneType", type);
        if (!type) {
            const zones = await zoneService.getZones();
            return res.status(200).json(zones);
        }
        const zones = await zoneService.getZoneByType(type);
    res.status(200).json(zones);
});

module.exports = router;
