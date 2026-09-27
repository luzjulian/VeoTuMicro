// backend/src/services/lineas.service.js

const prisma         = require('../config/prisma');
const arribosMock    = require('../data/proximosArribos.json');
const { BadRequestError } = require('../lib/http-errors');

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Reutiliza la misma lógica de arribosMock que viajes.service.js
 * para verificar si una línea tiene próximos arrivals en una parada.
 * Lanza BadRequestError si no hay información o la línea no pasa por la parada.
 */
const checkArribos = (nroParada, nroLinea, ramal) => {
  const todos = arribosMock[nroParada];
  if (!todos || todos.length === 0) {
    throw new BadRequestError(
      `No hay información de arrivals para la parada ${nroParada}`
    );
  }
  const filtrados = todos.filter(
    (a) => a.nroLinea === nroLinea && a.ramal === ramal
  );
  if (filtrados.length === 0) {
    throw new BadRequestError(
      `La línea ${nroLinea}-${ramal} no tiene próximos arrivals en la parada ${nroParada}`
    );
  }
};

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
 * Valida que la línea tenga próximos arrivals en la parada indicada.
 * No devuelve nada si es válida; lanza BadRequestError si no.
 *
 * @param {string} nroLinea
 * @param {string} ramal
 * @param {string} nroParada
 */
function validarDisponibilidad(nroLinea, ramal, nroParada) {
  checkArribos(nroParada, nroLinea, ramal);
}

module.exports = { getLineasActivas, validarDisponibilidad };