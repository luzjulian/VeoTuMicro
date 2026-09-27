// src/services/pasajeroService.js
//
// Reemplaza mockRealtimeService.js — misma interfaz, llamadas reales.
//
// Swap de 1 línea en cada importador:
//   ANTES: import { ... } from '@/services/mock/mockRealtimeService'
//   AHORA: import { ... } from '@/services/pasajeroService'
// ─────────────────────────────────────────────────────────────────────────────

import { getSocket }       from './socket.js';
import { createViajesApi } from './api/viajesApi.js';
import { DEV_USERS }       from '@/config/devAuth.js';

const api    = createViajesApi(DEV_USERS.pasajero);
const socket = () => getSocket(DEV_USERS.pasajero);

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
 * Reemplaza crearSolicitudMock — ahora es ASYNC.
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
 * Reemplaza suscribirseAViajeMock.
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
 * Reemplaza reiniciarCicloArriboMock.
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
 * Notifica al conductor que el pasajero canceló (no implementado aún en backend).
 * Reemplaza notificarCancelacionAlConductorMock.
 */
export function notificarCancelacionAlConductor(nroViaje) {
  // TODO: cuando haya endpoint de cancelación, llamar a la API aquí
  console.info(`[pasajeroService] Cancelación local del viaje ${nroViaje}`);
}

/**
 * Confirma el ascenso al colectivo → notifica al conductor vía backend.
 * NUEVO — no existía en el mock.
 *
 * @param {string} nroViaje
 */
export async function confirmarAscenso(nroViaje) {
  return api.confirmarAscenso(nroViaje);
}