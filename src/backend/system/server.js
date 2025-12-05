// src/backend/system/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: 'mariadb',
  user: 'root',
  password: 'admin',
  database: 'spark_db',
  connectionLimit: 5,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static('public'));

app.get('/api/invoices', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM invoices ORDER BY issued_date");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
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

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend system running on http://localhost:${PORT}`);
});