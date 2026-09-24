// backend/src/middlewares/dev-auth.js
//
// Middleware temporal de autenticación para desarrollo.
// Reemplaza a require-auth.js SOLO en las rutas que lo importan,
// sin tocar el módulo de auth.
//
// ✅ Misma interfaz que require-auth.js → el swap es un cambio de 1 línea.
// ❌ No usar en producción.
//
// Uso en Postman / Thunder Client / curl:
//   Header: X-Dev-User
//   Valor:  {"sub":"1","nombreUsuario":"pasajero.ana","rol":"pasajero"}
//           {"sub":"3","nombreUsuario":"chofer.carlos","rol":"chofer"}
//
// El campo "sub" debe ser el oid real de la Cuenta en la BD (ver seed).
// ----------------------------------------------------------------------------

const { UnauthorizedError, ForbiddenError } = require('../lib/http-errors');

const requireAuth = (req, _res, next) => {
  const raw = req.headers['x-dev-user'];

  if (!raw) {
    return next(
      new UnauthorizedError(
        '[DEV] Falta el header X-Dev-User. ' +
        'Ejemplo: {"sub":"1","nombreUsuario":"pasajero.ana","rol":"pasajero"}'
      )
    );
  }

  try {
    const payload = JSON.parse(raw);

    if (!payload.sub || !payload.nombreUsuario || !payload.rol) {
      return next(
        new UnauthorizedError(
          '[DEV] X-Dev-User debe tener sub, nombreUsuario y rol'
        )
      );
    }

    req.usuario = payload;
    next();
  } catch {
    next(new UnauthorizedError('[DEV] X-Dev-User no es JSON válido'));
  }
};

const soloRol = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return next(
      new ForbiddenError(
        `[DEV] Rol '${req.usuario?.rol}' no autorizado. Se requiere: ${roles.join(' | ')}`
      )
    );
  }
  next();
};

module.exports = { requireAuth, soloRol };