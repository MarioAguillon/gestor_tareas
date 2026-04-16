const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || process.env.MYSQL_HOST     || 'localhost',
  user:     process.env.MYSQLUSER     || process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'tareas_db2',
  port:     process.env.MYSQLPORT     || process.env.MYSQL_PORT     || 3306,
  connectionLimit: 10,
});

module.exports = pool;
