require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDB() {
  try {
    const connection = await mysql.createConnection({
      host:     process.env.MYSQLHOST     || process.env.MYSQL_HOST     || 'localhost',
      user:     process.env.MYSQLUSER     || process.env.MYSQL_USER     || 'root',
      password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'tareas_db2',
      port:     process.env.MYSQLPORT     || process.env.MYSQL_PORT     || 3306,
    });

    console.log('✅ Conectado a MySQL');

    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.query(createUsersTableQuery);
    console.log('✅ Tabla "usuarios" verificada/creada');

    console.log('🎉 Setup de base de datos finalizado correctamente.');
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error.message);
    process.exit(1);
  }
}

setupDB();
