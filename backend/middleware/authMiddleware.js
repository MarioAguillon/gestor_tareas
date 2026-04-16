const jwt = require('jsonwebtoken');

function verifyTokenWithSecret(secret) {
  return function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido o no autorizado' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      req.admin = decoded; // The existing architecture expects req.admin
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
      }
      return res.status(401).json({ error: 'No autorizado / Token inválido' });
    }
  }
}

module.exports = { verifyTokenWithSecret };
