const rateLimit = require('express-rate-limit');
const { env }   = require('../config/env');

// Rate limit global para toda la API
const globalRateLimit = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  max:      env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes, intentá más tarde' },
});

// Rate limit más agresivo para login y register
// Evita ataques de fuerza bruta sobre credenciales
const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max:      env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiados intentos, esperá unos minutos e intentá de nuevo' },
});

// Cada búsqueda de intersección consulta un servicio externo gratuito (Nominatim):
// se limita por IP para no abusar de él.
const geocodingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas búsquedas seguidas, esperá un minuto e intentá de nuevo' },
});

module.exports = { globalRateLimit, authRateLimit, geocodingRateLimit };