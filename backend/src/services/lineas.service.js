// backend/src/services/lineas.service.js

const prisma = require('../config/prisma');
const { consultarDisponibilidad } = require('../lib/arribosService');

// ---------------------------------------------------------------------------
// Casos de uso
// ---------------------------------------------------------------------------

/**
 * Devuelve todas las Líneas con al menos un Conduce activo (fechaHoraFin === null).
 * @returns {Promise<Array<{ nroLinea: string, ramal: string }>>}
 */
async function getLineasActivas() {
  return prisma.linea.findMany({
    where: {
      conduce: { some: { fechaHoraFin: null } },
    },
    select: { nroLinea: true, ramal: true },
    orderBy: [{ nroLinea: 'asc' }, { ramal: 'asc' }],
  });
}

/**
 * Consulta si la línea tiene próximos arrivals en la parada indicada.
 * Devuelve true/false en lugar de lanzar error, para que el controller
 * siempre responda 200 { disponible: boolean } sin depender del error handler.
 *
 * @param {string} nroLinea
 * @param {string} ramal
 * @param {string} nroParada
 * @returns {Promise<boolean>}
 */
async function consultarDisponibilidadLinea(nroLinea, ramal, nroParada) {
  return consultarDisponibilidad(nroParada, nroLinea, ramal);
}

module.exports = { getLineasActivas, consultarDisponibilidadLinea };