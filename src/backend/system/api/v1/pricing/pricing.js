const router = require('express').Router();

const pricingService = require('./pricingService');

/**
 * GET current price list
 */
router.get('/',
    async (req, res) => {
    const priceList = await pricingService.getPriceList();
    res.status(200).json(priceList);
});

module.exports = router;
