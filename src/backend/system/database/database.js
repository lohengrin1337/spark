// database connection pool?

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'mariadb', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'spark_db',
  connectionLimit: 10,
});

module.exports = pool;
