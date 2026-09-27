// backend/src/controllers/lineas.controller.js

const { getLineasActivas, validarDisponibilidad } = require('../services/lineas.service');

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
 * Valida si la línea tiene próximos arrivals en la parada detectada.
 * 200 → disponible   |   400 → no disponible (con mensaje descriptivo)
 */
function chequearDisponibilidad(req, res, next) {
  try {
    const { nroLinea, ramal, nroParada } = req.query;

    if (!nroLinea || !ramal || !nroParada) {
      return res.status(400).json({
        error: 'Se requieren los parámetros nroLinea, ramal y nroParada',
      });
    }

    validarDisponibilidad(nroLinea, ramal, nroParada);
    res.json({ disponible: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarLineasActivas, chequearDisponibilidad };