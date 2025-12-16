const router = require('express').Router();

const feeService = require('./feeService');

/**
 * GET all price lists
 */
router.get('/', async (req, res) => {
    const allFees = await feeService.getAll();
    res.status(200).json(allFees);
});

/**
 * GET current price list
 */
router.get('/current',
    async (req, res) => {
    const fees = await feeService.getOne();
    res.status(200).json(fees);
});

/**
 * Update price list
 */
router.put('/', async (req, res) => {
    const feeUpdate = req.body;
});

module.exports = router;
