// backend/src/domain/linea.js
// Esquemas de validación Zod para los endpoints de líneas

const { z } = require('zod');

// GET /api/lineas/disponible?nroLinea=&ramal=&nroParada=
const disponibilidadSchema = z.object({
  nroLinea: z
    .string({ required_error: 'El número de línea es requerido' })
    .min(1, 'El número de línea no puede estar vacío'),

  ramal: z
    .string({ required_error: 'El ramal es requerido' })
    .min(1, 'El ramal no puede estar vacío'),

  nroParada: z
    .string({ required_error: 'El número de parada es requerido' })
    .min(1, 'El número de parada no puede estar vacío'),
});

module.exports = { disponibilidadSchema };