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

const app = express();

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


/** Temporary API endpoint to fetch all rentals from the database */
app.get('/api/rentals', async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
        rental_id, 
        customer_id, 
        bike_id, 
        start_point, 
        start_time, 
        end_point, 
        end_time, 
        route,
        start_zone,
        end_zone
      FROM rental 
      ORDER BY start_time DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

/** Temporary API endpoint to create a new rental */
app.post('/api/rentals', async (req, res) => {
  const { customer_id, bike_id, start_point, start_zone } = req.body;

  if (!customer_id || !bike_id || !start_point || !start_zone || typeof start_point !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid fields: customer_id, bike_id, start_point, start_zone' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rental (customer_id, bike_id, start_point, start_zone, start_time) 
       VALUES (?, ?, ?,?, NOW())`,
      [customer_id, bike_id, JSON.stringify(start_point), start_zone]
    );
    res.status(201).json({ rental_id: result.insertId });
  } catch (err) {
    console.error('INSERT Error:', err);
    res.status(500).json({ error: 'Failed to create rental', details: err.message });
  }
});

/** Temporary API endpoint to complete a rental with end point, zone, and route */
app.put('/api/rentals/:id', async (req, res) => {
  const { id } = req.params;
  const { end_point, end_zone, route } = req.body;

  if (!end_point || typeof end_point !== 'object' || !Array.isArray(route)) {
    return res.status(400).json({ error: 'Invalid end_point or route' });
  }

  try {
    const updateResult = await pool.query(
      `UPDATE rental
       SET end_point = ?, end_time = NOW(), end_zone = ?, route = ?
       WHERE rental_id = ? AND end_time IS NULL`,
      [JSON.stringify(end_point), end_zone, JSON.stringify(route), id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Rental not found or already completed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('UPDATE Error:', err);
    res.status(500).json({ error: 'Failed to complete rental', details: err.message });
  }
});

/** Temporary API endpoint to mark an invoice as paid */
app.post('/api/pay/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE invoices SET paid = TRUE WHERE id = ? AND paid = FALSE",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Invoice not found or already paid" });
    }

    res.json({ success: true, message: "Payment recorded!" });
  } catch (err) {
    console.error("POST /api/pay error:", err);
    res.status(500).json({ error: "Payment failed" });
  } finally {
    if (conn) conn.release();
  }
});

/** Temporary API endpoint to fetch all (three) zones for rendering on the map */
app.get('/api/zones', async (req, res) => {
  try {
    const query = `
      SELECT 
        zone_id,
        city,
        zone_type,
        ST_AsText(coordinates) AS coordinates
      FROM spark_zone
      ORDER BY city ASC, zone_id ASC
    `;

    const rows = await pool.query(query);

    res.json(rows);
  } catch (err) {
    console.error('DB Error (/api/zones):', err);
    res.status(500).json({ 
      error: 'Failed to fetch zones', 
      details: err.message 
    });
  }
});


// __________________________________________________________________________
//
// Finis....
// __________________________________________________________________________



const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
