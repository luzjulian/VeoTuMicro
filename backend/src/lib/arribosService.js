// backend/src/lib/arribosService.js
// Adaptador de próximos arribos.
//
// HOY: lee del JSON mock local (proximosArribos.json).
// MAÑANA: reemplazar el cuerpo de cada función con la llamada a la API real
// (ej: "cuando llega tu micro") — los callers no necesitan cambiar nada,
// porque las firmas ya son async.

const arribosMock = require('../data/proximosArribos.json');
const { BadRequestError } = require('./http-errors');

/**
 * Devuelve la lista de próximos arribos de una parada filtrada por línea y ramal.
 * El array viene ordenado por estimadoArribo (menor → mayor) en el JSON mock.
 *
 * @param {string} nroParada
 * @param {string} nroLinea
 * @param {string} ramal
 * @returns {Promise<Array>}
 * @throws {BadRequestError} si la parada no tiene datos o la línea no pasa por ella
 *
 * TODO (API real): reemplazar el cuerpo por:
 *   const data = await apiCuandoLlega.getArribos(nroParada);
 *   const filtrados = data.filter(a => a.nroLinea === nroLinea && a.ramal === ramal);
 *   ...
 */
const getArribos = async (nroParada, nroLinea, ramal) => {
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
  return filtrados;
};

/**
 * Consulta si una línea tiene próximos arrivals en la parada indicada.
 * Devuelve boolean — no lanza error cuando no hay coincidencia.
 *
 * @param {string} nroParada
 * @param {string} nroLinea
 * @param {string} ramal
 * @returns {Promise<boolean>}
 *
 * TODO (API real): reemplazar el cuerpo por:
 *   const data = await apiCuandoLlega.getArribos(nroParada);
 *   return data.some(a => a.nroLinea === nroLinea && a.ramal === ramal);
 */
const consultarDisponibilidad = async (nroParada, nroLinea, ramal) => {
  const todos = arribosMock[nroParada];
  if (!todos || todos.length === 0) return false;
  return todos.some((a) => a.nroLinea === nroLinea && a.ramal === ramal);
};

module.exports = { getArribos, consultarDisponibilidad };