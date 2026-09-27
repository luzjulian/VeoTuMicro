// src/services/socket.js
//
// Fábrica de sockets Socket.io por rol.
// En DEV: autentica con devUser en handshake.auth (proxy de Vite → backend).
// En PROD: el backend lee la cookie JWT (sin cambios aquí).
//
// Cada rol tiene su propia instancia para que pasajero y chofer
// puedan coexistir en la misma ventana durante pruebas locales.
// ─────────────────────────────────────────────────────────────────────────────

import { io } from 'socket.io-client';

/** @type {Map<string, import('socket.io-client').Socket>} */
const sockets = new Map();

/**
 * Devuelve (o crea) el socket para el rol del devUser dado.
 * @param {{ sub: string, nombreUsuario: string, rol: string }} devUser
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket(devUser) {
  const key = devUser.rol;

  if (!sockets.has(key)) {
    const devUserJson = JSON.stringify(devUser);
    const socket = io({
      // Sin host → misma origin; el proxy de Vite reenvía /socket.io al backend.
      // devUser va en AMBOS lugares:
      //   auth  → CONNECT packet de Socket.io (ruta normal)
      //   query → query string del handshake HTTP (fallback cuando Vite no
      //           transporta correctamente el CONNECT packet por el proxy ws)
      auth:  { devUser: devUserJson },
      query: { devUser: devUserJson },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () =>
      console.log(`[Socket] ${devUser.nombreUsuario} conectado (id=${socket.id})`)
    );
    socket.on('connect_error', (err) =>
      console.error(`[Socket] Error (${devUser.rol}): ${err.message}`)
    );
    socket.on('disconnect', (reason) =>
      console.log(`[Socket] ${devUser.nombreUsuario} desconectado: ${reason}`)
    );

    sockets.set(key, socket);
  }

  return sockets.get(key);
}

/**
 * Desconecta el socket de un rol y lo elimina del pool.
 * Llamar al desmontar el componente raíz del rol.
 * @param {string} rol  'pasajero' | 'chofer'
 */
export function disconnectSocket(rol) {
  if (sockets.has(rol)) {
    sockets.get(rol).disconnect();
    sockets.delete(rol);
    console.log(`[Socket] Pool: socket '${rol}' eliminado`);
  }
}