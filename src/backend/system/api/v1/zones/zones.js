const router = require('express').Router();

const zoneService = require('./zoneService');

/**
 * GET zones
 * Response: 200 ok and array of zone objects.
 */
router.get('/',
    async (req, res) => {
    const zones = await zoneService.getZones();
    res.status(200).json(zones);
});

/**
 * GET /:id
 * Response: 200 ok and zone object or 404 not found.
 */
router.get('/:id',
    async (req, res) => {
    const zoneId = req.params.id;
    try {
        const zone = await zoneService.getZoneById(zoneId);
        if (!zone) {
            return res.status(404).json({ error: 'Zone not found'});
        }
        res.status(200).json(zone);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch.'});
    }  
});

module.exports = router;
