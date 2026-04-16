const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// This requires JWT_SECRET injection or importing the configured verifyToken
module.exports = (verifyToken) => {
  router.get('/', usuariosController.getUsuarios); // Public
  router.post('/', verifyToken, usuariosController.crearUsuario); // Protected
  router.put('/:id', verifyToken, usuariosController.editarUsuario); // Protected
  router.delete('/:id', verifyToken, usuariosController.eliminarUsuario); // Protected
  return router;
};
