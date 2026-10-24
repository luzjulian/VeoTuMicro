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

// GET /api/paradas/por-interseccion?calle1=&calle2=
// Solo letras, números y signos comunes en nombres de calle: el texto termina dentro de
// una consulta a un servicio externo, así que no se aceptan otros caracteres.
const nombreDeCalle = (campo) =>
  z
    .string({ error: `${campo} es requerida` })
    .trim()
    .min(1, `${campo} es requerida`)
    .max(60, `${campo} es demasiado larga`)
    .regex(/^[\p{L}\p{N} .'°ºª-]+$/u, `${campo} contiene caracteres no permitidos`);

const interseccionSchema = z.object({
  calle1: nombreDeCalle('La primera calle'),
  calle2: nombreDeCalle('La segunda calle'),
});

module.exports = { paradaCercanaSchema, interseccionSchema };