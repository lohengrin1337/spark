require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const mariadb = require('mariadb');
const apiV1 = require('./api/v1/apiRoutes.js');
const oauth = require('./api/v1/auth/oauth.js');

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app.js');

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));

app.use("/oauth", oauth);
app.use("/api/v1", apiV1);

const server = createServer(app);
const wss = new WebSocketServer({ server });

const pool = mariadb.createPool({
  host: 'mariadb', 
  user: 'root',
  password: 'admin',
  database: 'spark_db',
  connectionLimit: 10,
});


// __________________________________________________________________________
//
// Herman's intrusion starts here, will tidy up later ..........
// __________________________________________________________________________

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Frontend connected via raw WebSocket');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Frontend disconnected');
  });
});


const redisSub = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379
});

redisSub.subscribe('scooter:delta', 'rental:completed');

redisSub.on('message', (channel, message) => {
  const data = JSON.parse(message);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
});



BigInt.prototype.toJSON = function () {
  return this.toString();
};


// __________________________________________________________________________
//
// Finis....
// __________________________________________________________________________


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

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
