const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

// Express application with routes etc
const app = require('./app.js');

const server = createServer(app);
const wss = new WebSocketServer({ server });

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


const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
