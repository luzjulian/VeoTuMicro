// backend/src/services/paradas.service.js

const prisma = require('../config/prisma');
const { AppError, BadRequestError } = require('../lib/http-errors');

/**
 * Distancia euclidiana máxima aceptable (en grados² lat/lon).
 *
 * A la latitud de La Plata (~-35°):
 *   1° lat  ≈ 111 km  →  0.00045° ≈ 50 m
 *   1° lon  ≈  91 km  →  0.00055° ≈ 50 m
 *
 * Umbral diagonal de ~50 m (media cuadra):
 *   0.00045² + 0.00055² ≈ 5e-7
 */
const MAX_DIST_SQ = 5e-7;

/**
 * Encuentra la ParadaAscenso más cercana a las coordenadas dadas,
 * siempre que esté dentro del radio máximo definido por MAX_DIST_SQ.
 * Lanza BadRequestError si no hay ninguna parada cercana.
 *
 * @param {number} lat   latitud GPS del pasajero
 * @param {number} lon   longitud GPS del pasajero
 * @returns {Promise<{ nroParada: string, latitud: number, longitud: number }>}
 */
async function getParadaCercana(lat, lon) {
  const paradas = await prisma.paradaAscenso.findMany({
    select: { nroParada: true, latitud: true, longitud: true },
  });

  if (!paradas.length) {
    throw new AppError(503, 'No hay paradas registradas en el sistema');
  }

  let nearest = null;
  let minDist = Infinity;

  for (const p of paradas) {
    const dlat = p.latitud  - lat;
    const dlon = p.longitud - lon;
    const dist = dlat * dlat + dlon * dlon; // raíz innecesaria para comparar
    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  }

  if (minDist > MAX_DIST_SQ) {
    throw new BadRequestError(
      'No hay paradas de ascenso registradas cerca de tu ubicación'
    );
  }

  return nearest;
}

module.exports = { getParadaCercana };