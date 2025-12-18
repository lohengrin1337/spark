const router = require('express').Router();

const zoneService = require('./zoneService');

/**
 * GET zones
 * If no query parameters are sent in it shows all zones.
 * Response: 200 ok and array of zone objects.
 */
router.get('/',
    async (req, res) => {
        let { type } = req.query;
        console.log("req.query", req.query);
        console.log("zoneType", type);
        if (!type) {
            const zones = await zoneService.getZones();
            return res.status(200).json(zones);
        }
        const zones = await zoneService.getZoneByType(type);
    res.status(200).json(zones);
});

/**
 * GET /:id
 * Response: 200 ok and zone object or 404 not found.
 */
// router.get('/:type',
//     async (req, res) => {
//     const zoneType = String(req.params.type);
//     console.log(zoneType);
//     try {
//         const zone = await zoneService.getZoneByType(zoneType);
//         if (!zone) {
//             return res.status(404).json({ error: 'Zone not found'});
//         }
//         res.status(200).json(zone);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to fetch.'});
//     }  
// });

module.exports = router;
