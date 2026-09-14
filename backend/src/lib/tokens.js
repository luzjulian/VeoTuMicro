const crypto = require('node:crypto');
const jwt    = require('jsonwebtoken');
const { env } = require('../config/env');

// Firmado no es lo mismo que cifrado: cualquiera puede leer el payload en jwt.io.
// Nunca poner contraseñas ni datos realmente sensibles acá.
// oid, nombreUsuario y rol son claims públicos que el frontend necesita
// para mostrar la UI sin consultar la BD en cada request.

const signAccessToken = (cuenta, rol) =>
  jwt.sign(
    { sub: String(cuenta.oid), nombreUsuario: cuenta.nombreUsuario, rol },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer:    env.JWT_ISSUER,
      audience:  env.JWT_AUDIENCE,
    }
  );

// Tira error si la firma no cierra, si expiró, o si el issuer/audience no matchea.
const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'], // whitelist explícita, no confiar en el header del token
    issuer:    env.JWT_ISSUER,
    audience:  env.JWT_AUDIENCE,
  });

// El refresh token NO es un JWT, es un valor aleatorio opaco.
// Guardamos su hash (sha256 alcanza porque ya es aleatorio, no una contraseña elegida por una persona)
// para poder revocarlo en la BD sin guardar el valor real.
const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashRefreshToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

// Convierte strings tipo "15m", "7d", "1h" a milisegundos
const parseExpiresInToMs = (expiresIn) => {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) throw new Error(`Formato de expiración inválido: "${expiresIn}" (usar algo como "15m" o "7d")`);

  const value  = Number(match[1]);
  const unit   = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

  return value * unitMs[unit];
};

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken, parseExpiresInToMs };