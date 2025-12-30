require('express-async-errors');
const express = require('express');
const cors = require('cors');
const apiV1 = require('./api/v1/apiRoutes.js');

const app = express();
app.disable('x-powered-by');

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));

app.use("/api/v1", apiV1);
const oauth = require("./api/v1/auth/oauth");

app.use("/oauth", oauth);

// Catch undefined routes
app.use((req, res, next) => {
    const err = new Error(`Path '${req.path}' could not be found`);
    err.name = "Not Found";
    err.status = 404;
    next(err);
});

// Error handler (async with 'express-async-errors')
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(err);
    }

    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;
    res.status(status).json({
       errors: [
            {
                status: status,
                title: err.name,
                detail: err.message
            }
        ]
    });
});

// app.post('/api/pay/:id', async (req, res) => {
//   const id = parseInt(req.params.id, 10);
//   if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

//   let conn;
//   try {
//     conn = await pool.getConnection();
//     const result = await conn.query(
//       "UPDATE invoices SET paid = TRUE WHERE id = ? AND paid = FALSE",
//       [id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Invoice not found or already paid" });
//     }

//     res.json({ success: true, message: "Payment recorded!" });
//   } catch (err) {
//     console.error("POST /api/pay error:", err);
//     res.status(500).json({ error: "Payment failed" });
//   } finally {
//     if (conn) conn.release();
//   }
// });

module.exports = app;
