// seed.js — Auto-seeding del administrador por defecto
// IMPORTANTE: Este script se llama DESPUÉS de que la tabla 'administradores' ya existe.
const bcrypt = require('bcryptjs');

async function seedAdmin(db) {
  return new Promise((resolve, reject) => {
    // Verificar si existe el superadmin maestro
    db.query('SELECT * FROM administradores WHERE nombre_usuario = ?', ['mario'], async (err, results) => {
      if (err) {
        console.error('❌ Error al verificar administradores:', err.message);
        return reject(err);
      }

      if (results.length > 0) {
        console.log(`ℹ️  Usuario maestro ya existe. Seeding omitido.`);
        return resolve();
      }

      try {
        // No existe mario — crear de forma forzada
        const hash = await bcrypt.hash('mario123', 10);
        db.query(
          'INSERT INTO administradores (nombre_usuario, password_hash) VALUES (?, ?)',
          ['mario', hash],
          (errInsert) => {
            if (errInsert) {
              console.error('❌ Error al insertar admin maestro:', errInsert.message);
              return reject(errInsert);
            }
            console.log('✅ Admin maestro creado → usuario: mario | contraseña: mario123');
            resolve();
          }
        );
      } catch (hashErr) {
        console.error('❌ Error al hashear la contraseña maestra:', hashErr.message);
        reject(hashErr);
      }
    });
  });
}

module.exports = { seedAdmin };
