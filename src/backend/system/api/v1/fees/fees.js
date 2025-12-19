const router = require('express').Router();

const feeService = require('./feeService');

/**
 * GET all price lists
 */
router.get('/all', async (req, res) => {
    const allFees = await feeService.getAll();
    res.status(200).json(allFees);
});

/**
 * GET fees that were in effect on the sent in date
 * defaults to current date
 */
router.get('/', async (req, res) => {
    const { date } = req.query;
    const fees = await feeService.getOne(date);
    res.status(200).json(fees);
});

/**
 * Update price list
 */
router.put('/', async (req, res) => {
    const newFees = req.body;
    await feeService.feeUpdate(newFees);
    res.status(200).json();
});

module.exports = router;
