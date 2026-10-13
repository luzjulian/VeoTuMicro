// src/services/conductorService.js
//
// Capa de acceso del Panel del Conductor: encapsula el backend REST (/api/viajes)
// y los eventos de Socket.io. La UI y los hooks no saben de transporte.
// ─────────────────────────────────────────────────────────────────────────────

import { getSocket }                from './socket.js';
import { createViajesApi }         from './api/viajesApi.js';
import { geocodificarCoordenadas } from '@/services/geocodingService.js';

const api    = createViajesApi();
const socket = () => getSocket();

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suscribe el Panel del Conductor a los eventos de Socket.io.
 *
 * Eventos emitidos al onEvent:
 *   solicitudes_iniciales → { solicitudes: [] }  (sin endpoint aún)
 *   nueva_solicitud       → { solicitud }
 *   pasajero_a_bordo      → { numeroSolicitud, paradaDestino, pasajero }
 *   solicitud_cancelada   → { numeroSolicitud, pasajero }
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

  const handleSolicitudCancelada = ({ nroViaje, pasajero }) => {
    onEvent('solicitud_cancelada', {
      numeroSolicitud: nroViaje,
      pasajero:        pasajero ?? 'El pasajero',
    });
  };

  s.on('nueva:solicitud',     handleNuevaSolicitud);
  s.on('pasajero:abordo',     handlePasajeroAbordo);
  s.on('solicitud:cancelada', handleSolicitudCancelada);

  return () => {
    clearTimeout(t);
    s.off('nueva:solicitud',     handleNuevaSolicitud);
    s.off('pasajero:abordo',     handlePasajeroAbordo);
    s.off('solicitud:cancelada', handleSolicitudCancelada);
  };
}

/**
 * El conductor acepta la solicitud → llama al backend (confirmar).
 *
 * Firma SÍNCRONA: dispara la llamada y no espera. La notificación real de
 * abordaje llega luego vía socket 'pasajero:abordo' (cuando el pasajero
 * confirma que subió) y es manejada en suscribirsePanelConductor.
 *
 * @param {number} nroViaje  ID autoincremental del viaje
 * @param {object} _datos    (ignorado — el evento real viene del socket)
 * @param {Function} _onEvent (ignorado — ya registrado en suscribirsePanelConductor)
 * @returns {() => void} cleanup noop
 */
export function confirmarViaje(nroViaje, _datos, _onEvent) {
  api.confirmarViaje(nroViaje).catch((err) =>
    console.error('[conductorService] Error al confirmar viaje:', err.message)
  );
  return () => {}; // el evento real llega por socket
}

/**
 * El conductor rechaza la solicitud → llama al backend (rechazar).
 * El backend reasigna el viaje al siguiente conductor, o lo cancela si no hay.
 *
 * @param {number} nroViaje ID autoincremental del viaje
 */
export function rechazarViaje(nroViaje) {
  api.rechazarViaje(nroViaje).catch((err) =>
    console.error('[conductorService] Error al rechazar viaje:', err.message)
  );
}

/**
 * Avisa al pasajero que el colectivo se acerca a su parada de descenso
 * (simulado — en producción lo dispararía el GPS).
 *
 * Idempotente en el backend: si ya se notificó este viaje, no vuelve
 * a emitir el evento al pasajero (ver notificado:false en la respuesta).
 *
 * @param {number} nroViaje ID autoincremental del viaje
 */
export function notificarProximidad(nroViaje) {
  api.notificarProximidad(nroViaje).catch((err) =>
    console.error('[conductorService] Error al notificar proximidad:', err.message)
  );
}

/**
 * El conductor confirma el descenso del pasajero → llama al backend.
 * El viaje pasa a FINALIZADO.
 *
 * El pasajero se entera en tiempo real vía socket 'descenso:confirmado'
 * (manejado en pasajeroService → suscribirseABordo).
 *
 * @param {number} nroViaje ID autoincremental del viaje
 */
export function confirmarDescenso(nroViaje) {
  api.confirmarDescenso(nroViaje).catch((err) =>
    console.error('[conductorService] Error al confirmar descenso:', err.message)
  );
}