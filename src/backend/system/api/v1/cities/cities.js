const router = require('express').Router();
const cityService = require('./cityService');

/**
 * GET cities
 * Response: 200 ok and array of cities objects.
 */
router.get('/', async (req, res) => {
    const cities = await cityService.getCities();
    res.status(200).json(cities);
});

router.get('/:name', async (req, res) => {
    const cityName = req.params.name;
    const city = await cityService.getOneCity(cityName);
    res.status(200).json(city);
});

/**
 * GET zones for a specific city
 * Used by the Python simulator to load polygon zones.
 * Response: 200 ok and array of { zone_type, coordinates_wkt }
 */
router.get('/:name/zones', async (req, res) => {
    try {
      const cityName = req.params.name;
      const zones = await cityService.getZonesForCity(cityName);
  
      if (zones.length === 0) {
        return res.status(404).json({ error: `No zones found for city "${cityName}"` });
      }
  
      res.status(200).json(zones);
    } catch (err) {
      console.error(`GET /api/cities/${req.params.name}/zones error:`, err);
      res.status(500).json({ error: 'Failed to fetch city zones' });
    }
  });

module.exports = router;
