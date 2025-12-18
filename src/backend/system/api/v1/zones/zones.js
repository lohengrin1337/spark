const router = require('express').Router();

const zoneService = require('./zoneService');

/**
 * GET zones
 * If no query parameters are sent in it shows all zones.
 * Response: 200 ok and array of zone objects.
 */
router.get('/',
    async (req, res) => {
        let { zoneType } = req.query;
        console.log(req.query);
        console.log(zoneType);
        if (!zoneType) {
            return res.json(await zoneService.getZones());
        }
        const zones = await zoneService.getZoneByType(zoneType);
        res.status(200).json(zones);
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
