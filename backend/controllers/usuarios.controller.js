const db = require('../db/connection');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios ORDER BY created_at ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al cargar los usuarios. Intenta de nuevo.' });
  }
};

exports.crearUsuario = async (req, res) => {
  const { id, nombre, avatar } = req.body;
  if (!id || !nombre) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const defaultAvatar = avatar || 'avatar1.jpg';
    await db.query('INSERT INTO usuarios (id, nombre, avatar) VALUES (?, ?, ?)', [id, nombre, defaultAvatar]);
    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error guardando usuario:', error);
    res.status(500).json({ error: 'Error al guardar el usuario. Verifica los datos.' });
  }
};

exports.editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, avatar } = req.body;

  if (!nombre && !avatar) {
    return res.status(400).json({ error: 'Datos no proporcionados' });
  }

  try {
    let sqlParams = [];
    let setQuery = [];
    if (nombre) {
      setQuery.push('nombre = ?');
      sqlParams.push(nombre);
    }
    if (avatar) {
      setQuery.push('avatar = ?');
      sqlParams.push(avatar);
    }
    sqlParams.push(id);

    const [result] = await db.query(`UPDATE usuarios SET ${setQuery.join(', ')} WHERE id = ?`, sqlParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
