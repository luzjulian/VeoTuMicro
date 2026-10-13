// backend/src/domain/solicitud.js
//
// Schemas de validación y DTOs del módulo de solicitudes de registro (panel admin).
// Las formas de salida son EXACTAMENTE las que hoy devuelve mockAdminService del front.

const { z } = require('zod');

// Estados: la base usa mayúsculas (enum), el front usa minúsculas y "aceptado"/"rechazado".
const ESTADO_A_FRONT = {
  PENDIENTE: 'pendiente',
  ACEPTADA:  'aceptado',
  RECHAZADA: 'rechazado',
};

const FRONT_A_ESTADO = {
  pendiente: 'PENDIENTE',
  aceptado:  'ACEPTADA',
  rechazado: 'RECHAZADA',
};

const listarQuerySchema = z.object({
  estado: z.enum(['pendiente', 'aceptado', 'rechazado'], 'Estado inválido: usar pendiente, aceptado o rechazado').optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number('Id inválido').int('Id inválido').positive('Id inválido'),
});

const toSolicitudDTO = (s) => ({
  id:                s.oid,
  nombre:            s.nombre,
  apellido:          s.apellido,
  dni:               s.dni ?? null,
  fechaHoraRegistro: s.createdAt.toISOString(),
  estado:            ESTADO_A_FRONT[s.estado],
  certificadoUrl:    `/api/admin/solicitudes/${s.oid}/certificado`,
});

module.exports = {
  ESTADO_A_FRONT,
  FRONT_A_ESTADO,
  listarQuerySchema,
  idParamSchema,
  toSolicitudDTO,
};
