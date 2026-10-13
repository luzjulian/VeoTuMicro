// src/services/pasajeroService.js
//
// Capa de acceso del flujo del Pasajero: encapsula el backend REST (/api/viajes)
// y los eventos de Socket.io. Las páginas no saben de transporte.
// ─────────────────────────────────────────────────────────────────────────────

import { getSocket }       from './socket.js';
import { createViajesApi } from './api/viajesApi.js';

const api    = createViajesApi();
const socket = () => getSocket();

// ── Countdown client-side (mismo que el mock pero con ETA real del backend) ──

const MS_POR_MINUTO_SIMULADO = 60_000; // 1 min real en producción

/**
 * Inicia el ciclo de countdown de arribo.
 * Emite: eta_actualizado, aviso_un_minuto, colectivo_llego.
 * @returns {() => void} cleanup
 */
function iniciarCicloArribo(nroViaje, minutosIniciales, onEvent) {
  let minutosRestantes = minutosIniciales;
  const timers = [];

  const interval = setInterval(() => {
    minutosRestantes -= 1;

    if (minutosRestantes === 1) {
      onEvent('aviso_un_minuto', { numeroSolicitud: nroViaje });
    }

    if (minutosRestantes <= 0) {
      clearInterval(interval);
      onEvent('colectivo_llego', { numeroSolicitud: nroViaje });
      return;
    }

    onEvent('eta_actualizado', { minutosRestantes });
  }, MS_POR_MINUTO_SIMULADO);

  timers.push(interval);
  return () => timers.forEach((t) => clearInterval(t));
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un viaje en el backend.
 *
 * Genera un UUID v4 como Idempotency-Key antes de llamar al backend,
 * lo que evita viajes duplicados si la red falla y el usuario reintenta.
 *
 * @param {{ nroParada: string, nroLinea: string, ramal: string, destino: string }} datos
 * @returns {Promise<{ nroViaje: number }>}
 */
export async function crearSolicitud({ nroParada, nroLinea, ramal, destino }) {
  const idempotencyKey = crypto.randomUUID(); // UUID v4 nativo del navegador
  return api.iniciarViaje({ nroParada, nroLinea, ramal, destino }, idempotencyKey);
}

/**
 * Suscribe al pasajero a los eventos de su viaje vía Socket.io.
 *
 * Eventos emitidos al onEvent:
 *   conductor_confirmado → { numeroSolicitud, minutosIniciales }
 *   eta_actualizado      → { minutosRestantes }
 *   aviso_un_minuto      → { numeroSolicitud }
 *   colectivo_llego      → { numeroSolicitud }
 *   viaje:cancelado      → { nroViaje, mensaje }
 *
 * @param {number} nroViaje ID autoincremental del viaje
 * @param {(evento: string, payload: object) => void} onEvent
 * @returns {() => void} cleanup
 */
export function suscribirseAViaje(nroViaje, onEvent) {
  const s = socket();
  let cleanupCiclo = null;

  const handleConfirmado = ({ nroViaje: id, estimadoArribo }) => {
    if (id !== nroViaje) return;
    onEvent('conductor_confirmado', { numeroSolicitud: id, minutosIniciales: estimadoArribo });
    cleanupCiclo = iniciarCicloArribo(id, estimadoArribo, onEvent);
  };

  const handleCancelado = (payload) => {
    if (payload.nroViaje !== nroViaje) return;
    onEvent('viaje:cancelado', payload);
  };

  s.on('viaje:confirmado', handleConfirmado);
  s.on('viaje:cancelado',  handleCancelado);

  return () => {
    s.off('viaje:confirmado', handleConfirmado);
    s.off('viaje:cancelado',  handleCancelado);
    cleanupCiclo?.();
  };
}

/**
 * Reinicia el ciclo de arribo (pasajero dijo que no pudo abordar).
 *
 * @param {string} nroViaje
 * @param {(evento: string, payload: object) => void} onEvent
 * @returns {() => void} cleanup
 */
export function reiniciarCicloArribo(nroViaje, onEvent) {
  const MINUTOS_RECALCULO = 6;
  const timers = [];

  onEvent('recalculando', { numeroSolicitud: nroViaje });

  timers.push(
    setTimeout(() => {
      onEvent('eta_recalculada', { numeroSolicitud: nroViaje, minutosRestantes: MINUTOS_RECALCULO });
      const cleanup = iniciarCicloArribo(nroViaje, MINUTOS_RECALCULO, onEvent);
      timers.push(cleanup); // no es un timer ID, pero cleanup() lo maneja
    }, 1200)
  );

  return () => timers.forEach((t) => (typeof t === 'function' ? t() : clearTimeout(t)));
}

/**
 * Cancela el viaje en el backend. El conductor se entera en tiempo real vía
 * socket 'solicitud:cancelada' (ver conductorService → suscribirsePanelConductor).
 *
 * A diferencia del resto de las acciones de este servicio, propaga el error en
 * lugar de tragárselo: quien llama necesita saber si la cancelación realmente
 * ocurrió para no sacar al pasajero de la espera con el viaje todavía vivo.
 *
 * @param {number} nroViaje
 * @returns {Promise<{ estado: 'CANCELADO', notificado: boolean }>}
 */
export async function notificarCancelacionAlConductor(nroViaje) {
  return api.cancelarViaje(nroViaje);
}

/**
 * Confirma el ascenso al colectivo → notifica al conductor vía backend.
 *
 * @param {string} nroViaje
 */
export async function confirmarAscenso(nroViaje) {
  return api.confirmarAscenso(nroViaje);
}

/**
 * Suscribe al pasajero (ya a bordo) a los eventos de descenso vía Socket.io.
 *
 * Eventos emitidos al onEvent:
 *   conductor_va_a_detenerse → {}  (viaje:proximidad del backend)
 *   descenso_confirmado      → {}  (descenso:confirmado del backend)
 *
 * @param {number} nroViaje ID autoincremental del viaje
 * @param {(evento: string) => void} onEvent
 * @returns {() => void} cleanup
 */
export function suscribirseABordo(nroViaje, onEvent) {
  const s = socket();

  const handleProximidad = (payload) => {
    if (payload.nroViaje !== nroViaje) return;
    onEvent('conductor_va_a_detenerse');
  };

  const handleDescenso = (payload) => {
    if (payload.nroViaje !== nroViaje) return;
    onEvent('descenso_confirmado');
  };

  s.on('viaje:proximidad',     handleProximidad);
  s.on('descenso:confirmado',  handleDescenso);

  return () => {
    s.off('viaje:proximidad',    handleProximidad);
    s.off('descenso:confirmado', handleDescenso);
  };
}