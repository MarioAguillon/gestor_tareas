const express = require('express');
const app = express();

// Importar la app de backend original que tiene todas las rutas configuradas
const backendApp = require('../../backend/index.js');

// Vercel redirige todo a /api/..., así que montamos nuestra app original bajo ese prefijo
app.use('/api', backendApp);

module.exports = app;
