// src/services/mock/mockAdminService.js
//
// Datos y emisores de eventos falsos para el Panel Administrativo (2.9).
// Mismo estilo que mockRealtimeService.js: cuando exista el backend, este
// archivo se reemplaza por adminService.js (fetch a /api/admin/...) sin
// tocar hooks ni componentes.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- KPIs ----------

let kpisState = {
  solicitudesHoy: 43,
  deltaVsAyer: 12,
  pasajerosActivos: 128,
  certPendientes: 3, // se recalcula desde la bandeja al arrancar
  conductoresEnRuta: 12,
};

export async function obtenerKpisMock() {
  await delay(300);
  kpisState.certPendientes = solicitudesState.filter(
    (s) => s.estado === "pendiente"
  ).length;
  return { ...kpisState };
}

// TODO: reemplazar por evento Socket.io real cuando exista el backend.
const MS_TICK_LIVE = 5000;

export function suscribirseAKpisMock(onEvent) {
  const interval = setInterval(() => {
    const deltaPasajeros = Math.floor(Math.random() * 7) - 3;
    const deltaConductores = Math.floor(Math.random() * 3) - 1;

    kpisState.pasajerosActivos = Math.max(
      0,
      kpisState.pasajerosActivos + deltaPasajeros
    );
    kpisState.conductoresEnRuta = Math.max(
      0,
      kpisState.conductoresEnRuta + deltaConductores
    );

    onEvent("kpis_actualizados", {
      pasajerosActivos: kpisState.pasajerosActivos,
      conductoresEnRuta: kpisState.conductoresEnRuta,
    });
  }, MS_TICK_LIVE);

  return () => clearInterval(interval);
}

// ---------- Solicitudes de registro de pasajeros ----------
//
// Modelo alineado al DER (Pasajero): nombre, apellido, DNI y el certificado
// de discapacidad adjunto. `fechaHoraRegistro` es metadata de la solicitud
// (cuándo fue enviada), no del pasajero en sí.

const CERTIFICADO_MOCK_URL = "/mock-certificado.pdf";

let solicitudesState = [
  {
    id: "sol-001",
    nombre: "Marina",
    apellido: "García",
    dni: "34901567",
    fechaHoraRegistro: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    estado: "pendiente",
    certificadoUrl: CERTIFICADO_MOCK_URL,
  },
  {
    id: "sol-002",
    nombre: "Diego",
    apellido: "Romero",
    dni: "35012890",
    fechaHoraRegistro: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    estado: "pendiente",
    certificadoUrl: CERTIFICADO_MOCK_URL,
  },
  {
    id: "sol-003",
    nombre: "Laura B.",
    apellido: "Núñez",
    dni: "34778123",
    fechaHoraRegistro: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    estado: "aceptado",
    certificadoUrl: CERTIFICADO_MOCK_URL,
  },
  {
    id: "sol-004",
    nombre: "Andrés",
    apellido: "Pérez",
    dni: "34612445",
    fechaHoraRegistro: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    estado: "rechazado",
    certificadoUrl: CERTIFICADO_MOCK_URL,
  },
  {
    id: "sol-005",
    nombre: "Sofía",
    apellido: "Ledesma",
    dni: "35110902",
    fechaHoraRegistro: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    estado: "pendiente",
    certificadoUrl: CERTIFICADO_MOCK_URL,
  },
];

export async function obtenerSolicitudesMock() {
  await delay(400);
  return solicitudesState.map((s) => ({ ...s }));
}

export async function evaluarSolicitudMock(id, decision) {
  await delay(500);

  const nuevoEstado = decision === "aceptar" ? "aceptado" : "rechazado";
  const idx = solicitudesState.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Solicitud ${id} no encontrada`);

  solicitudesState[idx] = { ...solicitudesState[idx], estado: nuevoEstado };

  // TODO: el backend real dispara el mail de notificación al pasajero
  // (aceptación con creación de cuenta / rechazo).
  return { ...solicitudesState[idx] };
}