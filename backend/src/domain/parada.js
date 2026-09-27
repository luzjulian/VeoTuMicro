// backend/src/domain/parada.js
// Esquemas de validación Zod para los endpoints de paradas

const { z } = require('zod');

// GET /api/paradas/cercana?lat=&lon=
const paradaCercanaSchema = z.object({
  lat: z
    .string({ required_error: 'La latitud es requerida' })
    .transform((v) => parseFloat(v))
    .pipe(z.number({ invalid_type_error: 'lat debe ser un número' }).finite()),

  lon: z
    .string({ required_error: 'La longitud es requerida' })
    .transform((v) => parseFloat(v))
    .pipe(z.number({ invalid_type_error: 'lon debe ser un número' }).finite()),
});

module.exports = { paradaCercanaSchema };