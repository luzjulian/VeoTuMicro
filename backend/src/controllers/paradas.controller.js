// backend/src/controllers/paradas.controller.js

const { getParadaCercana } = require('../services/paradas.service');

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

module.exports = { paradaCercana };