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

router.get('/:id', async (req, res) => {
    const cityId = req.params.id;
    console.log(typeof(cityId));
    const cities = await cityService.getCityById(cityId);
    res.status(200).json(cities);
});


module.exports = router;
