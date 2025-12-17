// database connection pool?

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
});

module.exports = pool;
