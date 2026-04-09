// seed.js — Auto-seeding del administrador por defecto
// IMPORTANTE: Este script se llama DESPUÉS de que la tabla 'administradores' ya existe.
const bcrypt = require('bcryptjs');

async function seedAdmin(db) {
  return new Promise((resolve, reject) => {
    // 1. Verificar cuántos admins existen
    db.query('SELECT COUNT(*) AS total FROM administradores', async (err, results) => {
      if (err) {
        console.error('❌ Error al verificar administradores:', err.message);
        return reject(err);
      }

      const total = results[0].total;

      if (total > 0) {
        console.log(`ℹ️  Ya existen ${total} administrador(es). Seeding omitido.`);
        return resolve();
      }

      try {
        // 2. No existen admins — crear el admin por defecto
        const hash = await bcrypt.hash('admin123', 10);
        db.query(
          'INSERT INTO administradores (nombre_usuario, password_hash) VALUES (?, ?)',
          ['admin', hash],
          (errInsert) => {
            if (errInsert) {
              console.error('❌ Error al insertar admin por defecto:', errInsert.message);
              return reject(errInsert);
            }
            console.log('✅ Admin por defecto creado → usuario: admin | contraseña: admin123');
            resolve();
          }
        );
      } catch (hashErr) {
        console.error('❌ Error al hashear la contraseña:', hashErr.message);
        reject(hashErr);
      }
    });
  });
}

module.exports = { seedAdmin };
