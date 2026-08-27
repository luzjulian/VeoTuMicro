// src/services/mock/mockRealtimeService.js
let idCounter = 1;

export function crearSolicitudMock({ nroLinea, paradaSubida, paradaDestino }) {
  return {
    numeroSolicitud: idCounter++,
    nroLinea,
    paradaSubida,
    paradaDestino,
    estado: "pendiente",
    fechaHoraInicio: new Date().toISOString(),
  };
}

const MINUTOS_INICIALES = 8;
const MINUTOS_RECALCULO = 6;
const MS_POR_MINUTO_SIMULADO = 4000;

function iniciarCicloArribo(numeroSolicitud, minutosIniciales, onEvent, timersOut) {
  let minutosRestantes = minutosIniciales;

  const interval = setInterval(() => {
    minutosRestantes -= 1;

    if (minutosRestantes === 1) {
      onEvent("aviso_un_minuto", { numeroSolicitud });
    }

    if (minutosRestantes <= 0) {
      clearInterval(interval);
      onEvent("colectivo_llego", { numeroSolicitud });
      return;
    }

    onEvent("eta_actualizado", { minutosRestantes });
  }, MS_POR_MINUTO_SIMULADO);

  timersOut.push(interval);
}

export function suscribirseAViajeMock(numeroSolicitud, onEvent) {
  const timers = [];

  timers.push(
    setTimeout(
      () => onEvent("conductor_confirmado", { numeroSolicitud, minutosIniciales: MINUTOS_INICIALES }),
      1500
    )
  );

  timers.push(
    setTimeout(() => iniciarCicloArribo(numeroSolicitud, MINUTOS_INICIALES, onEvent, timers), 1600)
  );

  return () => timers.forEach(clearTimeout);
}

export function reiniciarCicloArriboMock(numeroSolicitud, onEvent) {
  const timers = [];
  onEvent("recalculando", { numeroSolicitud });

  timers.push(
    setTimeout(() => {
      onEvent("eta_recalculada", { numeroSolicitud, minutosRestantes: MINUTOS_RECALCULO });
      iniciarCicloArribo(numeroSolicitud, MINUTOS_RECALCULO, onEvent, timers);
    }, 1200)
  );

  return () => timers.forEach(clearTimeout);
}

export function simularEventosDeBajadaMock(onEvent) {
  const timers = [
    setTimeout(() => onEvent("conductor_va_a_detenerse", {}), 4000),
    setTimeout(() => onEvent("descenso_confirmado", {}), 9000),
  ];
  return () => timers.forEach(clearTimeout);
}

// TODO: reemplazar por evento Socket.io real cuando exista el backend y
// el Panel del Conductor (2.8).
export function notificarCancelacionAlConductorMock(numeroSolicitud) {
  console.info(`[mock] Notificando cancelación del viaje ${numeroSolicitud} al conductor`);
}