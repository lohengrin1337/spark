const express = require("express");
const cities = require("./cities.js");
const invoices = require("./invoices.js");

// Bundle all api v1 routers together
const router = express.Router();

router.use("/cities", cities);
router.use("/invoices", invoices);

module.exports = router;

// in app.js:
// app.use("/api/v1", apiV1);