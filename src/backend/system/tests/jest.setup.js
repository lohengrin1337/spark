const pool = require('../database/database');
process.env.NODE_ENV = 'test';
afterAll(async () => {
  await pool.end();
});
