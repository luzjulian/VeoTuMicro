// backend/src/sockets/viajes.socket.js
//
// Configura el servidor Socket.io:
//   - Middleware de autenticación (verifica el JWT de la cookie)
//   - Asignación de rooms según el rol del usuario
//
// Rooms utilizadas:
//   conductor:{nombreUsuario}  →  recibe 'nueva:solicitud', 'pasajero:abordo'
//   pasajero:{nombreUsuario}   →  recibe 'viaje:confirmado', 'viaje:cancelado'
//
// Eventos que el SERVER emite (desde los services):
//   nueva:solicitud   → { nroViaje, parada, destino }
//   viaje:confirmado  → { nroViaje, estimadoArribo }
//   viaje:cancelado   → { nroViaje, mensaje }
//   pasajero:abordo   → { nroViaje }

const cookie         = require('cookie');
const { verifyAccessToken } = require('../lib/tokens');
const { ACCESS_COOKIE_NAME } = require('../lib/auth-cookies');

/**
 * Inicializa los handlers de Socket.io.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // -------------------------------------------------------------------
  // Middleware de autenticación — corre antes de que el socket se conecte
  // -------------------------------------------------------------------
  io.use((socket, next) => {
    try {
      // Intentar obtener el token desde la cookie del handshake
      const rawCookies = socket.handshake.headers.cookie ?? '';
      const cookies    = cookie.parse(rawCookies);
      const token      = cookies[ACCESS_COOKIE_NAME];

      if (!token) {
        return next(new Error('AUTH_REQUIRED: Falta el token de autenticación'));
      }

      const payload = verifyAccessToken(token);
      socket.usuario = payload; // { sub, nombreUsuario, rol }
      next();
    } catch {
      next(new Error('AUTH_INVALID: Token inválido o expirado'));
    }
  });

  // -------------------------------------------------------------------
  // Conexión
  // -------------------------------------------------------------------
  io.on('connection', (socket) => {
    const { nombreUsuario, rol } = socket.usuario;

    // Unir al room según el rol
    if (rol === 'chofer') {
      socket.join(`conductor:${nombreUsuario}`);
      console.log(`🚌 [Socket] Conductor conectado: conductor:${nombreUsuario}`);
    } else if (rol === 'pasajero') {
      socket.join(`pasajero:${nombreUsuario}`);
      console.log(`🧑 [Socket] Pasajero conectado:  pasajero:${nombreUsuario}`);
    } else {
      // Administrativos y otros roles no usan rooms de viaje
      console.log(`👤 [Socket] Usuario conectado sin room de viaje: ${nombreUsuario} (${rol})`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket] ${nombreUsuario} desconectado (${reason})`);
    });
  });
};

module.exports = { initSocket };