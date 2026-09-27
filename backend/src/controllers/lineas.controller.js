// backend/src/controllers/lineas.controller.js

const { getLineasActivas, consultarDisponibilidadLinea } = require('../services/lineas.service');

/**
 * GET /api/lineas/activas
 * Lista las líneas con al menos un chofer activo.
 */
async function listarLineasActivas(req, res, next) {
  try {
    const lineas = await getLineasActivas();
    res.json(lineas);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/lineas/disponible?nroLinea=307&ramal=A&nroParada=P001
 * Consulta si la línea tiene próximos arrivals en la parada detectada por GPS.
 * Siempre responde 200 { disponible: boolean } — no usa 400 para "sin resultados".
 * La validación de parámetros la realiza el middleware validate() en la ruta.
 */
async function chequearDisponibilidad(req, res, next) {
  try {
    const { nroLinea, ramal, nroParada } = req.validated.query;
    const disponible = await consultarDisponibilidadLinea(nroLinea, ramal, nroParada);
    res.json({ disponible });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarLineasActivas, chequearDisponibilidad };