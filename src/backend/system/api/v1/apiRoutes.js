const express = require("express");
const cities = require("./cities/cities.js");
const invoices = require("./invoices/invoices.js");
const customers = require("./customers/customers.js");
const bikes = require("./bikes/bikes.js");
const pricing = require("./pricing/pricing.js");
const rentals = require("./rentals/rentals.js");
const zones = require("./zones/zones.js");
// const auth = require("./auth/auth.js");

// Bundle all api v1 routers together
const router = express.Router();

router.use("/cities", cities);
router.use("/invoices", invoices);
router.use("/customers", customers);
router.use("/bikes", bikes);
router.use("/pricing", pricing);
router.use("/rentals", rentals);
router.use("/zones", zones);
// router.use("/auth", auth);

module.exports = router;

// in app.js:
// app.use("/api/v1", apiV1);