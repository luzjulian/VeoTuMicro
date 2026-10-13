// src/services/socket.js
//
// Socket.io del cliente: una única instancia por sesión.
// Autentica con la cookie del access token, que viaja en el handshake porque
// el socket vive bajo /api (ver backend/src/server.js). Un navegador tiene una
// sola sesión, así que un solo socket alcanza.
// ─────────────────────────────────────────────────────────────────────────────

import { io } from 'socket.io-client';

/** @type {import('socket.io-client').Socket | null} */
let socket = null;

/**
 * Devuelve (o crea) el socket de la sesión actual.
 * No recibe parámetros: el backend identifica al usuario por la cookie.
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket() {
  if (!socket) {
    const s = io({
      // Sin host → mismo origen; el proxy de Vite reenvía /api al backend.
      // El path tiene que coincidir con el del servidor (ver backend/src/server.js):
      // bajo /api para que el navegador adjunte la cookie del access token.
      path: '/api/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on('connect',       ()       => console.log(`[Socket] conectado (id=${s.id})`));
    s.on('connect_error', (err)    => console.error(`[Socket] Error: ${err.message}`));
    s.on('disconnect',    (reason) => console.log(`[Socket] desconectado: ${reason}`));

    socket = s;
  }

  return socket;
}

/**
 * Cierra el socket de la sesión.
 * Llamar al cerrar sesión, para que el próximo login abra una conexión nueva
 * con la cookie del usuario que corresponde.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] cerrado');
  }
}