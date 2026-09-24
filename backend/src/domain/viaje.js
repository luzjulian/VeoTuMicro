// backend/src/domain/viaje.js
// Esquemas de validación Zod para los endpoints de viaje

const { z } = require('zod');

// POST /api/viajes → Pasajero inicia un viaje
const iniciarViajeSchema = z.object({
  nroParada: z
    .string({ required_error: 'El número de parada es requerido' })
    .min(1, 'El número de parada no puede estar vacío'),

  nroLinea: z
    .string({ required_error: 'El número de línea es requerido' })
    .min(1, 'El número de línea no puede estar vacío'),

  ramal: z
    .string({ required_error: 'El ramal es requerido' })
    .min(1, 'El ramal no puede estar vacío'),

  destino: z
    .string({ required_error: 'El destino es requerido' })
    .min(3, 'El destino debe tener al menos 3 caracteres')
    .max(100, 'El destino no puede superar los 100 caracteres'),
});

// POST /api/viajes/:nroViaje/confirmar → Conductor confirma viaje
// POST /api/viajes/:nroViaje/rechazar  → Conductor rechaza viaje
// POST /api/viajes/:nroViaje/abordo    → Pasajero confirma ascenso
// (sin body — el nroViaje viene en params)

module.exports = { iniciarViajeSchema };