<<<<<<< HEAD
<<<<<<< HEAD
const express = require('express');
const apiV1 = require('./api/v1/apiRoutes.js');

const app = express();


app.use(express.json());
app.use("/api/v1", apiV1);
=======
// Server.js version is crude, and we'll extract what is useful from here to
// a cleaner module already in progress by E & O

// src/backend/system/server.js


import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import mariadb from 'mariadb';
=======
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const mariadb = require('mariadb');
const apiV1 = require('./api/v1/apiRoutes.js');
>>>>>>> f863c9b (Integrate invoices)

const app = express();

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));

app.use("/api/v1", apiV1);

const server = createServer(app);
const wss = new WebSocketServer({ server });

const pool = mariadb.createPool({
  host: 'mariadb',
  user: 'root',
  password: 'admin',
  database: 'spark_db',
  connectionLimit: 5,
});

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




app.use(express.json());
app.use(express.static('public'));  // Is this in use?

app.get('/api/rentals', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM rentals ORDER BY issued_date");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/rentals error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});


app.get('/rentals', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        rental_id, customer_id, bike_id, 
        start_point, start_time, 
        end_point, end_time, 
        route
      FROM rentals 
      ORDER BY start_time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.post('/rentals', async (req, res) => {
  const { customer_id, bike_id, start_point } = req.body;
  if (!customer_id || !bike_id || !start_point) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO rentals (customer_id, bike_id, start_point, start_time) 
       VALUES (?, ?, ?, NOW())`,
      [customer_id, bike_id, JSON.stringify(start_point)]
    );
    res.status(201).json({ rental_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

app.put('/rentals/:id', async (req, res) => {
  const { id } = req.params;
  const { end_point, route } = req.body;

  try {
    await db.query(
      `UPDATE rentals 
       SET end_point = ?, end_time = NOW(), route = ?
       WHERE rental_id = ? AND end_time IS NULL`,
      [JSON.stringify(end_point), JSON.stringify(route), id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete rental' });
  }
});





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
>>>>>>> feature/sim+revamped-admin



const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});
