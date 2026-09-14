const { verifyAccessToken } = require('../lib/tokens');
const { UnauthorizedError, ForbiddenError } = require('../lib/http-errors');
const { ACCESS_COOKIE_NAME } = require('../lib/auth-cookies');

// Verifica que el request tenga un access token válido en la cookie.
// Si pasa, adjunta el payload a req.usuario para que los controllers lo usen.
const requireAuth = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!token) return next(new UnauthorizedError('Falta el token de autenticación'));

  try {
    req.usuario = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
};

// Restringe el acceso a uno o más roles específicos.
// Siempre se usa DESPUÉS de requireAuth.
// Uso: soloRol('administrativo') | soloRol('chofer', 'administrativo')
const soloRol = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return next(new ForbiddenError('No tenés permisos para esta acción'));
  }
  next();
};

module.exports = { requireAuth, soloRol };