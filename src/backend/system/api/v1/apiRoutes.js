const express = require("express");
const auth = require("./auth/auth.js");
const oauth = require("./auth/oauth.js");
const cities = require("./cities/cities.js");
const invoices = require("./invoices/invoices.js");
const customers = require("./customers/customers.js");
const bikes = require("./bikes/bikes.js");
const fees = require("./fees/fees.js");
const rentals = require("./rentals/rentals.js");
const zones = require("./zones/zones.js");
// const auth = require("./auth/auth.js");

// Bundle all api v1 routers together
const router = express.Router();

router.use("/auth", auth);
router.use("/oauth", oauth);
router.use("/cities", cities);
router.use("/invoices", invoices);
router.use("/customers", customers);
router.use("/bikes", bikes);
router.use("/fees", fees);
router.use("/rentals", rentals);
router.use("/zones", zones);
// router.use("/auth", auth);

module.exports = router;

// in app.js:
// app.use("/api/v1", apiV1);