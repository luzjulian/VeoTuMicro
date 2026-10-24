// backend/src/controllers/paradas.controller.js

const { getParadaCercana, getParadaPorInterseccion } = require('../services/paradas.service');

/**
 * GET /api/paradas/cercana?lat=&lon=
 * Devuelve la parada de ascenso más cercana al pasajero.
 */
async function paradaCercana(req, res, next) {
  try {
    // lat y lon ya vienen parseados y validados por el middleware validate()
    const { lat, lon } = req.validated.query;
    const parada = await getParadaCercana(lat, lon);
    res.json(parada);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/paradas/por-interseccion?calle1=&calle2=
 * Ubicación manual: parada más cercana a la intersección de dos calles.
 */
async function paradaPorInterseccion(req, res, next) {
  try {
    const { calle1, calle2 } = req.validated.query;
    const parada = await getParadaPorInterseccion(calle1, calle2);
    res.json(parada);
  } catch (err) {
    next(err);
  }
}

module.exports = { paradaCercana, paradaPorInterseccion };