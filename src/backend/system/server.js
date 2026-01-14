/**
 * @module server.js
 * 
 * Main server module with Express, Redis, and WebSockets connectivity.
 */

const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const mariadb = require('mariadb');

const { redisSubscriber } = require('./redis/redisClient');
const initSocketBridge = require('./socket/socketBridge');

const dotenv = require('dotenv');
dotenv.config();

// Express application with routes etc
const app = require('./app.js');

const server = createServer(app);
const wss = new WebSocketServer({ server });

/**
 * Initialize the Redis WebSocket bridge.
 */
initSocketBridge(wss, redisSubscriber);

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
