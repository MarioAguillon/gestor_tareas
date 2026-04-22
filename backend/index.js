// index.js — Tarea Fácil API Backend
// Stack: Node.js + Express + MySQL2 + JWT (HS256) + bcryptjs
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
// 1. CONFIGURACIÓN, ENTORNO Y BASE DE DATOS
// ─────────────────────────────────────────────
const env = require('./config/env');
const { db, connectDB } = require('./config/database');

// Inicializar la base de datos
connectDB();

const JWT_SECRET = env.jwtSecret;

// ─────────────────────────────────────────────
// 2. CONFIGURACIÓN EXPRESS + CORS SEGURO
// ─────────────────────────────────────────────
const app = express();

// Render utiliza proxys inversos. Requerido para leer la IP real del cliente.
app.set('trust proxy', 1);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir cualquier origen de manera dinámica para evitar errores en producción
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
const path = require('path');
app.use('/public', express.static(path.join(__dirname, 'public')));

// Healthcheck — Railway necesita esto para confirmar que la app responde
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Tarea Fácil API funcionando' });
});

// ─────────────────────────────────────────────
// 3. RUTAS Y LÓGICA DE NEGOCIO
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 5. MIDDLEWARE DE AUTENTICACIÓN JWT (HS256)
// ─────────────────────────────────────────────
const { verifyTokenWithSecret } = require('./middleware/authMiddleware');
const verifyToken = verifyTokenWithSecret(JWT_SECRET);

// ─────────────────────────────────────────────
// RUTAS EXTERNAS
// ─────────────────────────────────────────────
const usuariosRoutes = require('./routes/usuarios.routes')(verifyToken);
const avataresRoutes = require('./routes/avatares.routes');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/avatares', avataresRoutes);

// ─────────────────────────────────────────────
// 6. ENDPOINTS DE AUTENTICACIÓN
// ─────────────────────────────────────────────

// POST /auth/login — Público
app.post('/auth/login', (req, res) => {
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  db.query(
    'SELECT * FROM administradores WHERE nombre_usuario = ?',
    [nombre_usuario],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error interno del servidor' });
      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const admin = results[0];
      const esValido = await bcrypt.compare(password, admin.password_hash);
      if (!esValido) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const token = jwt.sign(
        { id: admin.id, nombre_usuario: admin.nombre_usuario },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '8h' }
      );

      res.json({
        mensaje: 'Sesión iniciada correctamente',
        token,
        nombre_usuario: admin.nombre_usuario,
      });
    }
  );
});

// POST /auth/register — Protegido (solo admins pueden crear admins)
app.post('/auth/register', verifyToken, async (req, res) => {
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO administradores (nombre_usuario, password_hash) VALUES (?, ?)',
      [nombre_usuario, hash],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
          }
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.status(201).json({ mensaje: 'Administrador creado exitosamente' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Error al procesar la contraseña' });
  }
});

// ⛔ Endpoint de emergencia ELIMINADO por razones de seguridad.
// Si necesitas recuperar acceso, ejecuta seed.js manualmente en Railway.

// PUT /auth/perfil — Protegido (editar propio perfil)
app.put('/auth/perfil', verifyToken, async (req, res) => {
  const { nombre_usuario, password } = req.body;
  const adminId = req.admin.id;

  if (!nombre_usuario && !password) {
    return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar' });
  }

  const campos = [];
  const valores = [];

  if (nombre_usuario) {
    campos.push('nombre_usuario = ?');
    valores.push(nombre_usuario);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const hash = await bcrypt.hash(password, 10);
    campos.push('password_hash = ?');
    valores.push(hash);
  }

  valores.push(adminId);
  const sql = `UPDATE administradores SET ${campos.join(', ')} WHERE id = ?`;

  db.query(sql, valores, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ mensaje: 'Perfil actualizado exitosamente' });
  });
});

// GET /auth/admins — Protegido (listar administradores)
app.get('/auth/admins', verifyToken, (req, res) => {
  db.query('SELECT id, nombre_usuario, creado_en FROM administradores ORDER BY nombre_usuario ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error interno del servidor' });
    res.json(results);
  });
});

// DELETE /auth/admins/:id — Protegido (eliminar administrador)
app.delete('/auth/admins/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.admin.id) {
    return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta en sesión.' });
  }

  db.query('SELECT COUNT(*) AS total FROM administradores', (errCount, results) => {
    if (errCount) return res.status(500).json({ error: 'Error del servidor' });
    if (results[0].total <= 1) {
      return res.status(403).json({ error: 'No puedes eliminar al único administrador del sistema.' });
    }

    db.query('DELETE FROM administradores WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar administrador' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Administrador no encontrado' });
      res.json({ mensaje: 'Administrador eliminado exitosamente' });
    });
  });
});

// PUT /auth/admins/:id — Protegido (editar cualquier administrador)
app.put('/auth/admins/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario && !password) {
    return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar' });
  }

  const campos = [];
  const valores = [];

  if (nombre_usuario) {
    campos.push('nombre_usuario = ?');
    valores.push(nombre_usuario);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const hash = await bcrypt.hash(password, 10);
    campos.push('password_hash = ?');
    valores.push(hash);
  }

  valores.push(id);
  const sql = `UPDATE administradores SET ${campos.join(', ')} WHERE id = ?`;

  db.query(sql, valores, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ mensaje: 'Administrador actualizado exitosamente' });
  });
});


// ─────────────────────────────────────────────
// 7. ENDPOINTS DE TAREAS
// ─────────────────────────────────────────────

// GET /tareas — PÚBLICO (visualización pública)
app.get('/tareas', (req, res) => {
  db.query('SELECT * FROM tareas ORDER BY expira ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tareas' });
    res.json(results);
  });
});

// POST /tareas — PROTEGIDO
app.post('/tareas', verifyToken, (req, res) => {
  const { id, titulo, resumen, expira, idUsuario } = req.body;

  if (!titulo || titulo.trim().length < 3) {
    return res.status(400).json({ error: 'El título debe tener al menos 3 caracteres' });
  }
  
  if (!idUsuario) {
    return res.status(400).json({ error: 'Usuario no proporcionado' });
  }

  // RF-03 Verificar integridad referencial
  db.query('SELECT id FROM usuarios WHERE id = ?', [idUsuario], (errUser, userResults) => {
    if (errUser) return res.status(500).json({ error: 'Error del servidor al verificar usuario' });
    if (userResults.length === 0) {
      return res.status(400).json({ error: 'Usuario no válido' });
    }

    const sql = `INSERT INTO tareas (id, titulo, resumen, expira, idUsuario, completada) VALUES (?, ?, ?, ?, ?, 0)`;
    db.query(sql, [id, titulo, resumen, expira, idUsuario], (err) => {
      if (err) return res.status(500).json({ error: 'Error al crear la tarea' });
      res.status(201).json({ mensaje: 'Tarea creada exitosamente' });
    });
  });
});

// PUT /tareas/:id — PROTEGIDO (edición completa de la tarea)
app.put('/tareas/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { titulo, resumen, expira, completada } = req.body;

  // Si solo se manda 'completada' (marcar como terminada)
  if (completada !== undefined && !titulo && !resumen && !expira) {
    db.query('UPDATE tareas SET completada = ? WHERE id = ?', [completada, id], (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar la tarea' });
      res.json({ mensaje: 'Tarea actualizada exitosamente' });
    });
    return;
  }

  // Edición de contenido
  if (!titulo || titulo.trim().length < 3) {
    return res.status(400).json({ error: 'El título debe tener al menos 3 caracteres' });
  }
  if (!resumen || resumen.trim().length < 5) {
    return res.status(400).json({ error: 'El resumen debe tener al menos 5 caracteres' });
  }

  const sql = 'UPDATE tareas SET titulo = ?, resumen = ?, expira = ? WHERE id = ?';
  db.query(sql, [titulo.trim(), resumen.trim(), expira, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al editar la tarea' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ mensaje: 'Tarea editada exitosamente' });
  });
});

// DELETE /tareas/:id — PROTEGIDO
app.delete('/tareas/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tareas WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar la tarea' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ mensaje: 'Tarea eliminada exitosamente' });
  });
});

// ─────────────────────────────────────────────
// 8. ARRANQUE DEL SERVIDOR
// ─────────────────────────────────────────────
const port = env.port;

// El servidor siempre escucha — requerido por Railway en producción
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Tarea Fácil en http://0.0.0.0:${port}`);
});

module.exports = app;