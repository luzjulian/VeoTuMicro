// src/services/mock/mockConductorService.js
//
// Fuente MOCK y AUTÓNOMA de solicitudes para el Panel del Conductor (2.8).
// Simula, con timers, el ciclo de vida completo de un pasajero
// (solicitud → abordaje) sin depender todavía de un backend ni de la vista
// real del pasajero.
//
// Es la contraparte receptora de `notificarCancelacionAlConductorMock` de
// mockRealtimeService: escrito para que, cuando exista Socket.io, se reemplace
// SÓLO el interior de este archivo (new BroadcastChannel/io en vez de timers)
// dejando intactos el hook, la página y los componentes.

const MS_POR_MINUTO_SIMULADO = 4000; // misma compresión de tiempo que el mock del pasajero

// Cada cuánto "entra" una solicitud nueva de forma autónoma.
const NUEVA_SOLICITUD_MS = 20000;

// Cuánto tarda el pasajero en subir tras que el conductor acepta la solicitud.
const ABORDAJE_MS = 6000;

let idCounter = 100;

const ahoraMenos = (minutos) =>
  new Date(Date.now() - minutos * 60000).toISOString();

// Solicitudes que ya están en curso al abrir el panel (reflejan el mockup 2.8).
function solicitudesSeed() {
  return [
    {
      numeroSolicitud: 1,
      nroLinea: "307",
      ramal: "La Plata — La Plata Centro",
      paradaSubida: "Calle 60 y 125",
      paradaDestino: "Calle 7 y 50",
      pasajero: "Martina G.",
      discapacidadVisual: true,
      estado: "pendiente",
      fechaHoraInicio: ahoraMenos(2),
    },
    {
      numeroSolicitud: 2,
      nroLinea: "307",
      ramal: "La Plata — La Plata Centro",
      paradaSubida: "Calle 44 y 8",
      paradaDestino: "Calle 14 y 55",
      pasajero: "Diego R.",
      discapacidadVisual: true,
      estado: "a_bordo",
      fechaHoraInicio: ahoraMenos(13),
    },
  ];
}

const PARADAS_DEMO = [
  { subida: "Calle 7 y 32", destino: "Plaza San Martín" },
  { subida: "Calle 13 y 60", destino: "Calle 1 y 44" },
  { subida: "Diagonal 74 y 8", destino: "Calle 66 y 120" },
];

const NOMBRES_DEMO = ["Lucía P.", "Marco T.", "Sofía R.", "Julián A."];

function crearSolicitudAleatoria() {
  const paradas = PARADAS_DEMO[Math.floor(Math.random() * PARADAS_DEMO.length)];
  const pasajero = NOMBRES_DEMO[Math.floor(Math.random() * NOMBRES_DEMO.length)];

  return {
    numeroSolicitud: idCounter++,
    nroLinea: "307",
    ramal: "La Plata — La Plata Centro",
    paradaSubida: paradas.subida,
    paradaDestino: paradas.destino,
    pasajero,
    discapacidadVisual: true,
    estado: "pendiente",
    fechaHoraInicio: new Date().toISOString(),
  };
}

/**
 * Suscribe el panel del conductor al flujo de solicitudes.
 * Emite `solicitudes_iniciales` una vez y luego `nueva_solicitud` de forma
 * periódica. Devuelve una función de limpieza.
 */
export function suscribirsePanelConductor(onEvent) {
  const timers = [];

  timers.push(
    setTimeout(
      () => onEvent("solicitudes_iniciales", { solicitudes: solicitudesSeed() }),
      300
    )
  );

  const interval = setInterval(
    () => onEvent("nueva_solicitud", { solicitud: crearSolicitudAleatoria() }),
    NUEVA_SOLICITUD_MS
  );
  timers.push(interval);

  return () => {
    timers.forEach(clearTimeout);
    clearInterval(interval);
  };
}

/**
 * Simula que, tras aceptar la solicitud, el pasajero sube al colectivo.
 * Emite `pasajero_a_bordo` luego de un breve retardo. Devuelve limpieza.
 */
export function simularAbordajeMock(numeroSolicitud, datos, onEvent) {
  const t = setTimeout(
    () => onEvent("pasajero_a_bordo", { numeroSolicitud, ...datos }),
    ABORDAJE_MS
  );
  return () => clearTimeout(t);
}

// TODO: reemplazar por evento Socket.io real cuando exista el backend.
// Hoy es la contraparte del rechazo del lado conductor: sólo deja traza.
export function notificarRechazoMock(numeroSolicitud) {
  console.info(`[mock] Solicitud ${numeroSolicitud} rechazada por el conductor`);
}