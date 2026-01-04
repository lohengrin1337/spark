const router = require('express').Router();

const feeService = require('./feeService');

const auth = require('./../../../middleware/jwtauth');

/**
 * GET all price lists
 */
router.get('/all', auth.authToken, auth.authAdminOrUser, async (req, res) => {
    const allFees = await feeService.getAll();
    res.status(200).json(allFees);
});

/**
 * The default index GET-route. Returns the latest and current fee that is the basis
 * for the current pricing state.
 */
router.get('/', async (req, res) => {
    const fees = await feeService.getLatest();
    res.status(200).json(fees);
});

/**
 * GET fees that were in effect on the sent in date
 * defaults to current date
 */
router.get('/date', auth.authToken, auth.authAdminOrUser, async (req, res) => {
    const { date } = req.query;
    const fees = await feeService.getOne(date);
    res.status(200).json(fees);
});



/**
 * POST default route that creates a new fee row with the values supplied
 */
router.post('/', auth.authToken, auth.authAdmin, async (req, res) => {
    const { start, minute, discount, penalty } = req.body;
  
    if (start == null || minute == null || discount == null || penalty == null) {
      return res.status(400).json({ error: "All fee values must be provided" });
    }
  
    try {
      const newFee = await feeService.createFee({ start, minute, discount, penalty });
      res.status(201).json({ success: true, message: `New fees added`} );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create new fee row" });
    }
});
  
  
module.exports = router;
