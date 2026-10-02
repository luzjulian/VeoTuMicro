// backend/src/services/kpis.service.js
//
// Indicadores del panel administrativo.
//
//   certPendientes    → solicitudes de registro en estado PENDIENTE
//   solicitudesHoy    → solicitudes de registro recibidas hoy (hora de Argentina)
//   deltaVsAyer       → solicitudesHoy menos las recibidas ayer (diferencia absoluta)
//   pasajerosActivos  → pasajeros con certificado aprobado (tienen un administrativo que los validó)
//   conductoresEnRuta → choferes distintos con un turno (Conduce) sin fecha de fin

const prisma = require('../config/prisma');

// Argentina está en UTC-3 todo el año (sin horario de verano).
const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

// Devuelve el instante (UTC) en que empezó el día de `fecha` en hora argentina.
const inicioDelDiaArgentina = (fecha) => {
  const local = new Date(fecha.getTime() - OFFSET_ARGENTINA_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET_ARGENTINA_MS);
};

// Lo que cambia "en vivo" cuando se aprueba un pasajero o un chofer empieza/termina un turno.
const calcularKpisEnVivo = async () => {
  const [pasajerosActivos, conductores] = await Promise.all([
    prisma.pasajero.count({ where: { adminOid: { not: null } } }),
    prisma.conduce.groupBy({ by: ['choferOid'], where: { fechaHoraFin: null } }),
  ]);

  return { pasajerosActivos, conductoresEnRuta: conductores.length };
};

const calcularKpis = async (ahora = new Date()) => {
  const inicioHoy  = inicioDelDiaArgentina(ahora);
  const inicioAyer = new Date(inicioHoy.getTime() - DIA_MS);

  const [enVivo, certPendientes, solicitudesHoy, solicitudesAyer] = await Promise.all([
    calcularKpisEnVivo(),
    prisma.solicitudRegistro.count({ where: { estado: 'PENDIENTE' } }),
    prisma.solicitudRegistro.count({ where: { createdAt: { gte: inicioHoy } } }),
    prisma.solicitudRegistro.count({ where: { createdAt: { gte: inicioAyer, lt: inicioHoy } } }),
  ]);

  return {
    solicitudesHoy,
    deltaVsAyer: solicitudesHoy - solicitudesAyer,
    pasajerosActivos: enVivo.pasajerosActivos,
    certPendientes,
    conductoresEnRuta: enVivo.conductoresEnRuta,
  };
};

// Emite a la sala "admins" el evento que ya escucha useAdminKpis en el front.
// Es "best effort": si falla, se registra y no interrumpe la operación que lo disparó.
const emitirKpis = async (io) => {
  if (!io) return;
  try {
    io.to('admins').emit('kpis_actualizados', await calcularKpisEnVivo());
  } catch (err) {
    console.error('[kpis] no se pudo emitir kpis_actualizados:', err.message);
  }
};

module.exports = { calcularKpis, calcularKpisEnVivo, emitirKpis, inicioDelDiaArgentina };
