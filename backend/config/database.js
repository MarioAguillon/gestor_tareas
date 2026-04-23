// config/database.js — Conexión y Auto-Healing de la Base de Datos
// Compatible con TiDB Cloud (MySQL protocol + SSL/TLS)
const mysql = require('mysql2');
const env = require('./env');
const { seedAdmin, seedUsuarios } = require('../seed');

// ─────────────────────────────────────────────
// Configuración de conexión BASE (sin database, para auto-healing)
// ─────────────────────────────────────────────
function buildBaseConfig() {
  const cfg = {
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    port: env.db.port,
    charset: 'utf8mb4',
    connectTimeout: 20000, // 20s — TiDB Cloud puede ser lento en cold start
  };

  if (env.db.ssl) {
    cfg.ssl = env.db.ssl;
  }

  return cfg;
}

// ─────────────────────────────────────────────
// Configuración completa (con database)
// ─────────────────────────────────────────────
function buildFullConfig() {
  const cfg = buildBaseConfig();
  cfg.database = env.db.name;
  return cfg;
}

// ─────────────────────────────────────────────
// Auto-Healing: DDL (Data Definition Language)
// Crea la base de datos y todas las tablas si no existen al arrancar
// ─────────────────────────────────────────────

const DDL_STATEMENTS = [
  // 1. Tabla administradores (sin dependencias)
  {
    name: 'administradores',
    sql: `CREATE TABLE IF NOT EXISTS administradores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  // 2. Tabla usuarios (ANTES de tareas, por la FK)
  {
    name: 'usuarios',
    sql: `CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      avatar VARCHAR(255) DEFAULT 'avatar1.jpg',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  // 3. Tabla tareas (con FK a usuarios en cascada)
  {
    name: 'tareas',
    sql: `CREATE TABLE IF NOT EXISTS tareas (
      id VARCHAR(50) PRIMARY KEY,
      idUsuario VARCHAR(50) NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      resumen TEXT,
      expira DATE,
      completada TINYINT(1) DEFAULT 0,
      CONSTRAINT fk_tareas_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
    )`
  },
];

// ─────────────────────────────────────────────
// Índices de rendimiento (se crean si no existen)
// ─────────────────────────────────────────────
const INDEX_STATEMENTS = [
  {
    name: 'idx_tareas_idUsuario',
    sql: `CREATE INDEX idx_tareas_idUsuario ON tareas(idUsuario)`,
    table: 'tareas',
  },
  {
    name: 'idx_tareas_expira',
    sql: `CREATE INDEX idx_tareas_expira ON tareas(expira)`,
    table: 'tareas',
  },
];

/**
 * Crea la base de datos si no existe (conexión SIN database seleccionada).
 * @returns {Promise<void>}
 */
function crearBaseDeDatos() {
  return new Promise((resolve, reject) => {
    const tempConn = mysql.createConnection(buildBaseConfig());

    tempConn.connect((err) => {
      if (err) {
        console.error('❌ No se pudo conectar para crear la DB:', err.message);
        return reject(err);
      }

      const dbName = env.db.name;
      tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (errCreate) => {
        if (errCreate) {
          console.error(`❌ Error al crear base de datos "${dbName}":`, errCreate.message);
          tempConn.end();
          return reject(errCreate);
        }
        console.log(`🗄️  Base de datos "${dbName}" verificada/creada`);
        tempConn.end();
        resolve();
      });
    });
  });
}

/**
 * Ejecuta los DDL de creación de tablas de forma secuencial (respetando orden de FK).
 * @param {mysql.Connection} connection
 * @returns {Promise<void>}
 */
function ejecutarDDL(connection) {
  return new Promise((resolve, reject) => {
    let idx = 0;

    function next() {
      if (idx >= DDL_STATEMENTS.length) return resolve();

      const { name, sql } = DDL_STATEMENTS[idx];
      connection.query(sql, (err) => {
        if (err) {
          console.error(`❌ Error al crear tabla "${name}":`, err.message);
          return reject(err);
        }
        console.log(`✅ Tabla "${name}" verificada/creada`);
        idx++;
        next();
      });
    }

    next();
  });
}

/**
 * Verifica si un índice ya existe y lo crea si no.
 * @param {mysql.Connection} connection
 * @returns {Promise<void>}
 */
function crearIndices(connection) {
  return new Promise((resolve, reject) => {
    let idx = 0;

    function next() {
      if (idx >= INDEX_STATEMENTS.length) return resolve();

      const { name, sql, table } = INDEX_STATEMENTS[idx];

      // Verificar si el índice ya existe antes de crearlo
      const checkSql = `
        SELECT COUNT(*) AS cnt
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `;

      connection.query(checkSql, [table, name], (errCheck, results) => {
        if (errCheck) {
          console.warn(`⚠️ No se pudo verificar índice "${name}":`, errCheck.message);
          idx++;
          return next(); // Continuar, no es fatal
        }

        if (results[0].cnt > 0) {
          // El índice ya existe
          idx++;
          return next();
        }

        // Crear el índice
        connection.query(sql, (errCreate) => {
          if (errCreate) {
            // Ignorar error de índice duplicado (1061)
            if (errCreate.errno === 1061) {
              idx++;
              return next();
            }
            console.warn(`⚠️ Error al crear índice "${name}":`, errCreate.message);
          } else {
            console.log(`📇 Índice "${name}" creado`);
          }
          idx++;
          next();
        });
      });
    }

    next();
  });
}

// ─────────────────────────────────────────────
// Conexión principal (lazy — se crea después del auto-healing)
// ─────────────────────────────────────────────
let db = null;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = () => {
  let retries = 0;

  async function attemptConnection() {
    try {
      // PASO 0: Crear la base de datos si no existe
      await crearBaseDeDatos();
    } catch (err) {
      retries++;
      if (retries <= MAX_RETRIES) {
        console.warn(`⚠️ Intento ${retries}/${MAX_RETRIES} — ${err.message}`);
        console.warn(`   Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
        setTimeout(attemptConnection, RETRY_DELAY_MS);
        return;
      }
      console.error('❌ No se pudo crear/verificar la base de datos tras todos los reintentos.');
      process.exit(1);
    }

    // PASO 1: Crear conexión principal con la DB seleccionada
    db = mysql.createConnection(buildFullConfig());

    db.connect(async (err) => {
      if (err) {
        retries++;
        if (retries <= MAX_RETRIES) {
          console.warn(`⚠️ Intento ${retries}/${MAX_RETRIES} — Error conexión MySQL: ${err.message}`);
          console.warn(`   Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
          setTimeout(attemptConnection, RETRY_DELAY_MS);
          return;
        }
        console.error('❌ Error conexión MySQL tras todos los reintentos:', err.message);
        process.exit(1);
      }

      console.log('✅ Conectado a MySQL/TiDB Cloud');

      try {
        // PASO 2: Auto-Healing — Crear tablas si no existen
        await ejecutarDDL(db);
        console.log('🏗️  Auto-healing: Todas las tablas verificadas');

        // PASO 3: Crear índices de rendimiento
        await crearIndices(db);
        console.log('📇 Índices de rendimiento verificados');

        // PASO 4: Seed — solo DESPUÉS de que todas las tablas existen
        await seedAdmin(db);
        await seedUsuarios(db);
        console.log('🌱 Seeding completado');

        console.log('🎉 Base de datos lista para recibir peticiones');
      } catch (healErr) {
        console.error('❌ Auto-healing falló:', healErr.message);
        // No hacemos process.exit aquí — las tablas podrían ya existir
        // y el error ser cosmético. La app intenta funcionar igualmente.
      }
    });

    // Manejo de desconexiones inesperadas
    db.on('error', (err) => {
      console.error('❌ Error de conexión MySQL:', err.message);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
        console.warn('🔄 Conexión perdida. Reintentando...');
        retries = 0; // Reiniciar contador
        attemptConnection();
      }
    });
  }

  attemptConnection();
};

// ─────────────────────────────────────────────
// Proxy para acceder a 'db' de forma segura
// (la conexión se crea asíncronamente, pero las rutas
// la usan síncronamente vía require — este getter
// garantiza que siempre se use la instancia actual)
// ─────────────────────────────────────────────
const dbProxy = new Proxy({}, {
  get(_, prop) {
    if (!db) {
      throw new Error('La base de datos aún no está conectada.');
    }
    const val = db[prop];
    if (typeof val === 'function') {
      return val.bind(db);
    }
    return val;
  }
});

module.exports = { db: dbProxy, connectDB };
