// backend/src/controllers/paradas.controller.js

const { getParadaCercana } = require('../services/paradas.service');

/**
 * GET /api/paradas/cercana?lat=&lon=
 * Devuelve la parada de ascenso más cercana al pasajero.
 */
async function paradaCercana(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Parámetros lat y lon requeridos (numéricos)' });
    }

    const parada = await getParadaCercana(lat, lon);
    res.json(parada);
  } catch (err) {
    next(err);
  }
}

module.exports = { paradaCercana };