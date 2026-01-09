require('express-async-errors');
const express = require('express');
const cors = require('cors');
const apiV1 = require('./api/v1/apiRoutes.js');

const app = express();
app.disable('x-powered-by');

app.use(express.json());

app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
app.use("/api/v1", apiV1);

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

module.exports = app;
