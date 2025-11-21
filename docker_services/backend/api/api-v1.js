const express = require("express");
const bikeService = require("../src/services/bikeService.js");

const router = express.Router();

router.get('/bikes', async (req, res) => {
    const bikes = await bikeService.getBikes();
    res.json({ data: bikes });
});

module.exports = router;