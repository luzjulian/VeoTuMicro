// src/services/conductorService.js
//
// Reemplaza mockConductorService.js — misma interfaz, eventos reales de Socket.io.
//
// Swap de 1 línea en cada importador:
//   ANTES: import { ... } from '@/services/mock/mockConductorService'
//   AHORA: import { ... } from '@/services/conductorService'
// ─────────────────────────────────────────────────────────────────────────────

import { getSocket }                from './socket.js';
import { createViajesApi }         from './api/viajesApi.js';
import { DEV_USERS }               from '@/config/devAuth.js';
import { geocodificarCoordenadas } from '@/services/geocodingService.js';

const api    = createViajesApi(DEV_USERS.chofer);
const socket = () => getSocket(DEV_USERS.chofer);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suscribe el Panel del Conductor a los eventos de Socket.io.
 * Reemplaza suscribirsePanelConductor del mock — misma firma.
 *
 * Eventos emitidos al onEvent:
 *   solicitudes_iniciales → { solicitudes: [] }  (sin endpoint aún)
 *   nueva_solicitud       → { solicitud }
 *   pasajero_a_bordo      → { numeroSolicitud, paradaDestino, pasajero }
 *
 * @param {(evento: string, payload: object) => void} onEvent
 * @returns {() => void} cleanup
 */
export function suscribirsePanelConductor(onEvent) {
  const s = socket();

  // Sin endpoint de "viajes activos" por ahora → lista vacía al arrancar
  const t = setTimeout(
    () => onEvent('solicitudes_iniciales', { solicitudes: [] }),
    300
  );

  const handleNuevaSolicitud = async ({ nroViaje, parada, paradaLatitud, paradaLongitud, destino, pasajero }) => {
    // Geocodificar la parada si tenemos coordenadas; si falla usamos el nroParada
    let paradaSubida = parada;
    if (paradaLatitud != null && paradaLongitud != null) {
      try {
        paradaSubida = await geocodificarCoordenadas({
          latitud:  paradaLatitud,
          longitud: paradaLongitud,
        });
      } catch {
        // Silencioso: quedamos con el nroParada como fallback
      }
    }

    /** @type {import('@/services/mock/mockConductorService').Solicitud} */
    const solicitud = {
      numeroSolicitud:  nroViaje,
      nroLinea:         '307',   // TODO: incluir en el evento del backend si se necesita
      ramal:            'A',
      paradaSubida,
      paradaDestino:    destino,
      pasajero:         pasajero ?? 'Pasajero',
      discapacidadVisual: true,
      estado:           'pendiente',
      fechaHoraInicio:  new Date().toISOString(),
    };
    onEvent('nueva_solicitud', { solicitud });
  };

  const handlePasajeroAbordo = ({ nroViaje, destino, pasajero }) => {
    onEvent('pasajero_a_bordo', {
      numeroSolicitud: nroViaje,
      paradaDestino:   destino   ?? '(ver solicitud)',
      pasajero:        pasajero  ?? 'Pasajero',
    });
  };

  s.on('nueva:solicitud',  handleNuevaSolicitud);
  s.on('pasajero:abordo',  handlePasajeroAbordo);

  return () => {
    clearTimeout(t);
    s.off('nueva:solicitud',  handleNuevaSolicitud);
    s.off('pasajero:abordo',  handlePasajeroAbordo);
  };
}

/**
 * El conductor acepta la solicitud → llama al backend (confirmar).
 * Reemplaza simularAbordajeMock — misma firma SÍNCRONA.
 *
 * La notificación real de abordaje llega luego vía socket 'pasajero:abordo'
 * (cuando el pasajero confirma que subió) y es manejada en suscribirsePanelConductor.
 *
 * @param {string} nroViaje  UUID del viaje
 * @param {object} _datos    (ignorado — el evento real viene del socket)
 * @param {Function} _onEvent (ignorado — ya registrado en suscribirsePanelConductor)
 * @returns {() => void} cleanup noop
 */
export function simularAbordajeMock(nroViaje, _datos, _onEvent) {
  api.confirmarViaje(nroViaje).catch((err) =>
    console.error('[conductorService] Error al confirmar viaje:', err.message)
  );
  return () => {}; // el evento real llega por socket
}

/**
 * El conductor rechaza la solicitud → llama al backend (rechazar).
 * Reemplaza notificarRechazoMock — misma firma.
 *
 * @param {string} nroViaje UUID del viaje
 */
export function notificarRechazoMock(nroViaje) {
  api.rechazarViaje(nroViaje).catch((err) =>
    console.error('[conductorService] Error al rechazar viaje:', err.message)
  );
}