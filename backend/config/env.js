// config/env.js — Validación y Carga de Entorno
// Compatible con TiDB Cloud (SSL/TLS requerido)
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

// ─────────────────────────────────────────────
// Configuración SSL para TiDB Cloud
// TiDB Cloud requiere TLS en endpoints públicos.
// Usamos rejectUnauthorized: true con el CA de ISRG Root X1
// que es el emisor de los certificados de TiDB Cloud.
// Node.js 18+ ya incluye ISRG Root X1 en su trust store,
// por lo que no necesitamos proveer un archivo CA externo.
// ─────────────────────────────────────────────
function buildSSLConfig() {
  const sslEnabled = process.env.DB_SSL === 'true';

  if (!sslEnabled) return undefined;

  const sslConfig = {
    // TiDB Cloud usa certificados de Let's Encrypt (ISRG Root X1)
    // Node.js 18+ confía en este CA de forma nativa.
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  };

  // Si el usuario provee un CA personalizado (path o contenido PEM)
  if (process.env.DB_SSL_CA) {
    const fs = require('fs');
    const caValue = process.env.DB_SSL_CA;

    // Si parece un path a archivo, leer el contenido
    if (caValue.endsWith('.pem') || caValue.endsWith('.crt')) {
      try {
        sslConfig.ca = fs.readFileSync(caValue);
        console.log('🔐 SSL CA cargado desde archivo:', caValue);
      } catch (err) {
        console.warn('⚠️ No se pudo leer el archivo CA:', err.message);
        console.warn('   Usando CA del sistema operativo.');
      }
    } else {
      // Asumir que es contenido PEM directo (para Render env vars)
      sslConfig.ca = caValue;
      console.log('🔐 SSL CA cargado desde variable de entorno');
    }
  }

  return sslConfig;
}

const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    ssl: buildSSLConfig()
  }
};

module.exports = config;
