// database connection pool?

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: 'mariadb',
  user: 'root',
  password: 'admin',
  database: 'spark_db',
  connectionLimit: 5,
});

module.exports = pool;
