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

// La espera dura SIEMPRE lo mismo, sin importar el estimado del backend. El
// estimado (por ejemplo 7 minutos) se sigue mostrando y bajando de a uno, pero
// repartido parejo dentro de esta duración fija.
const DURACION_ESPERA_MS = 40_000;

// Cuánto dura cada "minuto" de la cuenta regresiva para que el total sea fijo.
const msPorMinutoDe = (minutosTotales) => DURACION_ESPERA_MS / minutosTotales;

// ── Referencia de reloj del arribo ───────────────────────────────────────────
//
// El backend devuelve el arribo como un offset ("5 minutos"), no como un
// instante, porque el JSON de próximos arribos es estático. Entonces al
// recargar la página volvía a leer el mismo 5 y la cuenta regresiva arrancaba
// de cero. Acá guardamos el instante en que vence ese arribo, para poder
// calcular cuánto falta de verdad después de una recarga.
//
// Ojo con el alcance: esto NO decide si el viaje existe — eso lo sigue
// diciendo el backend. Es solo una referencia de reloj, atada al nroViaje.
// Si no está, está corrupta o es de otro viaje, se ignora y queda el offset
// del backend, que es el comportamiento que había antes.

const CLAVE_ARRIBO = 'veotumicro:arribo';

/**
 * Recuerda cuándo vence el arribo de este viaje y cuánto dura cada "minuto".
 * Se guarda la duración del minuto porque, tras una recarga, ya no sabemos
 * cuál era el estimado original y hace falta para seguir al mismo ritmo.
 */
function guardarArribo(nroViaje, minutos) {
  try {
    localStorage.setItem(
      CLAVE_ARRIBO,
      JSON.stringify({
        nroViaje,
        venceEn: Date.now() + DURACION_ESPERA_MS,
        msPorMinuto: msPorMinutoDe(minutos),
      })
    );
  } catch {
    // Modo privado o storage bloqueado: seguimos sin persistir.
  }
}

/** Olvida el arribo guardado. Se llama cuando el viaje deja de estar en espera. */
function olvidarArribo() {
  try {
    localStorage.removeItem(CLAVE_ARRIBO);
  } catch {
    // Nada que hacer: si no se puede borrar, el guard por nroViaje alcanza.
  }
}

/** Lee el arribo guardado de este viaje, o null si no hay dato utilizable. */
function leerArribo(nroViaje) {
  try {
    const crudo = localStorage.getItem(CLAVE_ARRIBO);
    if (!crudo) return null;

    const { nroViaje: guardado, venceEn, msPorMinuto } = JSON.parse(crudo);
    if (guardado !== nroViaje) return null;
    if (typeof venceEn !== 'number' || typeof msPorMinuto !== 'number' || msPorMinuto <= 0) {
      return null;
    }
    return { venceEn, msPorMinuto };
  } catch {
    return null;
  }
}

/**
 * Minutos que faltan para el arribo de este viaje según el instante guardado.
 * Devuelve `etaDelBackend` si no hay dato utilizable.
 */
function minutosRestantesDeArribo(nroViaje, etaDelBackend) {
  const arribo = leerArribo(nroViaje);
  if (!arribo) return etaDelBackend;

  const minutos = Math.ceil((arribo.venceEn - Date.now()) / arribo.msPorMinuto);

  // Más tiempo que el offset original significa reloj cambiado o dato
  // corrupto: no le creemos y volvemos al dato del backend.
  if (etaDelBackend != null && minutos > etaDelBackend) return etaDelBackend;

  return Math.max(minutos, 0); // 0 = el arribo ya venció
}

/**
 * Inicia el ciclo de countdown de arribo.
 * Emite: eta_actualizado, aviso_un_minuto, colectivo_llego.
 * `msPorMinuto` es lo que dura cada "minuto"; por defecto reparte la duración
 * fija entre los minutos iniciales.
 * @returns {() => void} cleanup
 */
function iniciarCicloArribo(nroViaje, minutosIniciales, onEvent, msPorMinuto = msPorMinutoDe(minutosIniciales)) {
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
  }, msPorMinuto);

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
 * Pregunta al backend si el pasajero tiene un viaje en curso. Se usa al montar
 * el flujo para recuperarlo después de recargar la página o perder la conexión.
 *
 * La fuente de verdad es la base y no el navegador: un viaje guardado en
 * localStorage podría haber sido cancelado o finalizado mientras la app estaba
 * sin conexión, y dejaría al pasajero esperando un viaje que ya no existe.
 *
 * @returns {Promise<object | null>} el viaje en curso, o null si no hay
 */
export async function obtenerViajeActivo() {
  const viaje = (await api.obtenerViajeActivo()) ?? null;
  if (!viaje) {
    olvidarArribo(); // no hay viaje: lo guardado ya no sirve para nada
    return null;
  }

  // El offset del backend no sabe cuánto tiempo estuvo el pasajero esperando.
  // Lo corregimos con el instante de vencimiento que guardamos al arrancar la
  // cuenta regresiva, así una recarga no reinicia el contador.
  return {
    ...viaje,
    estimadoArribo: minutosRestantesDeArribo(viaje.nroViaje, viaje.estimadoArribo ?? null),
  };
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
 * @param {{ estimadoArribo?: number | null }} [opciones]
 *   estimadoArribo arranca la cuenta regresiva al suscribirse, sin esperar el
 *   evento viaje:confirmado. Se usa al recuperar un viaje ya confirmado tras
 *   recargar la página: ese evento ya se disparó y no vuelve a llegar, así que
 *   sin esto el ETA quedaría vacío y nunca llegaría el aviso de arribo.
 *   Si viene en 0 el arribo ya venció y se avisa la llegada enseguida.
 * @returns {() => void} cleanup
 */
export function suscribirseAViaje(nroViaje, onEvent, { estimadoArribo = null } = {}) {
  const s = socket();
  let cleanupCiclo = null;

  /**
   * Un solo ciclo vivo a la vez: si ya había uno corriendo lo cortamos antes
   * de arrancar el nuevo, para no dejar un setInterval huérfano.
   *
   * `persistir` queda en false al recuperar un viaje: el instante guardado ya
   * existe y es el exacto, así que reescribirlo con el resto redondeado haría
   * que cada recarga sume unos segundos.
   */
  const arrancarCiclo = (minutos, { persistir = true } = {}) => {
    cleanupCiclo?.();

    if (minutos <= 0) {
      // El arribo venció mientras el pasajero estaba sin conexión: avisamos la
      // llegada enseguida en lugar de esperar un tick del contador.
      onEvent('colectivo_llego', { numeroSolicitud: nroViaje });
      return;
    }

    if (persistir) guardarArribo(nroViaje, minutos);
    // Al recuperar un viaje se sigue al mismo ritmo que tenía guardado.
    const msPorMinuto = leerArribo(nroViaje)?.msPorMinuto;
    cleanupCiclo = iniciarCicloArribo(nroViaje, minutos, onEvent, msPorMinuto);
  };

  if (typeof estimadoArribo === 'number') {
    arrancarCiclo(estimadoArribo, { persistir: false });
  }

  const handleConfirmado = ({ nroViaje: id, estimadoArribo: eta }) => {
    if (id !== nroViaje) return;
    onEvent('conductor_confirmado', { numeroSolicitud: id, minutosIniciales: eta });
    arrancarCiclo(eta);
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
      // Nueva cuenta regresiva → nuevo instante de vencimiento, para que una
      // recarga después del recálculo también retome donde iba.
      guardarArribo(nroViaje, MINUTOS_RECALCULO);
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
  const resultado = await api.cancelarViaje(nroViaje);
  olvidarArribo(); // el viaje ya no espera arribo
  return resultado;
}

/**
 * Confirma el ascenso al colectivo → notifica al conductor vía backend.
 *
 * @param {string} nroViaje
 */
export async function confirmarAscenso(nroViaje) {
  const resultado = await api.confirmarAscenso(nroViaje);
  olvidarArribo(); // el pasajero ya subió: la espera terminó
  return resultado;
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