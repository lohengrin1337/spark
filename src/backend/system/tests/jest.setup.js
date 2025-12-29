const pool = require('../database/database'); // adjust path if needed

afterAll(async () => {
  await pool.end();
});
