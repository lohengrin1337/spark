const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const mariadb = require('mariadb');
const apiV1 = require('./api/v1/apiRoutes.js');
const oauth = require('./api/v1/auth/oauth.js');


const { redisSubscriber } = require('./redis/redisClient');

const dotenv = require('dotenv');
dotenv.config();

// Express application with routes etc
const app = require('./app.js');

const server = createServer(app);
const wss = new WebSocketServer({ server });

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'mariadb', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'spark_db',
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

// Uses the new modular imported subscriber

redisSubscriber.subscribe('scooter:delta', 'rental:completed');

redisSubscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);

    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  } catch (err) {
    console.error('[Redis] Failed to parse message:', err);
  }
});

BigInt.prototype.toJSON = function () {
  return this.toString();
};


// __________________________________________________________________________
//
// Finis....
// __________________________________________________________________________


const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
