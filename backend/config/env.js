// config/env.js — Validación y Carga de Entorno
require('dotenv').config();

// Lista de variables requeridas para que la aplicación arranque
const REQUIRED_VARS = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET'
];

// Validar variables obligatorias (Fail-Fast)
REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Falta la variable de entorno obligatoria: ${key}`);
    console.error('Por favor, revisa tu archivo .env o configuración en producción.');
    process.exit(1);
  }
});

// En producción, es altamente recomendable usar contraseñas. Localmente podría estar vacía,
// pero loggearemos una advertencia de seguridad si no está en entorno local.
if (!process.env.DB_PASSWORD && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ ADVERTENCIA: DB_PASSWORD está vacía en producción. Esto es un riesgo de seguridad.');
}

const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  }
};

module.exports = config;
