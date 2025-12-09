const express = require("express");
const cities = require("./cities/cities.js");
const invoices = require("./invoices/invoices.js");
const customers = require("./customers/customers.js");

// Bundle all api v1 routers together
const router = express.Router();

router.use("/cities", cities);
router.use("/invoices", invoices);
router.use("/customers", customers);

module.exports = router;

// in app.js:
// app.use("/api/v1", apiV1);