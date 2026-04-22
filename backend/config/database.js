// config/database.js — Conexión y Setup de la Base de Datos
const mysql = require('mysql2');
const env = require('./env');
const { seedAdmin, seedUsuarios } = require('../seed');

const dbConfig = {
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  charset: 'utf8mb4'
};

if (env.db.ssl) {
  dbConfig.ssl = env.db.ssl;
}

const db = mysql.createConnection(dbConfig);

const connectDB = () => {
  db.connect((err) => {
    if (err) {
      console.error('❌ Error conexión MySQL:', err.message);
      process.exit(1); // Fail-Fast si la DB no conecta
    }
    console.log('✅ Conectado a MySQL');

    // CREAR TABLAS SI NO EXISTEN
    const crearTablas = [
      // Tabla administradores PRIMERO (antes del seeding)
      `CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // Tabla usuarios (ANTES de tareas, por la FK)
      `CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        avatar VARCHAR(255) DEFAULT 'avatar1.jpg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // Tabla tareas (con FK a usuarios)
      `CREATE TABLE IF NOT EXISTS tareas (
        id VARCHAR(50) PRIMARY KEY,
        idUsuario VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        resumen TEXT,
        expira DATE,
        completada TINYINT(1) DEFAULT 0
      )`,
    ];

    let tablasPendientes = crearTablas.length;
    crearTablas.forEach((sql) => {
      db.query(sql, (errCrear) => {
        if (errCrear) {
          console.error('❌ Error al crear tabla:', errCrear.message);
          return;
        }
        tablasPendientes--;
        if (tablasPendientes === 0) {
          // SEED — solo DESPUÉS de que todas las tablas existen
          seedAdmin(db)
            .then(() => seedUsuarios(db))
            .catch((e) => console.error('❌ Seed falló:', e.message));
        }
      });
    });
  });
};

module.exports = { db, connectDB };
