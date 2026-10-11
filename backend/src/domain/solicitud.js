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

// El registro pide un solo campo "Nombre completo" y el panel muestra apellido y nombre
// por separado. Se arma SOLO PARA MOSTRAR: apellido = última palabra, nombre = el resto.
// El nombre completo se guarda intacto en la base.
const separarNombre = (nombreApellido) => {
  const partes = String(nombreApellido).trim().split(/\s+/);
  if (partes.length === 1) return { nombre: partes[0], apellido: '' };
  const apellido = partes.pop();
  return { nombre: partes.join(' '), apellido };
};

// Si la solicitud guardó nombre y apellido por separado se usan tal cual; si no (registros
// anteriores o enviados con un solo campo), se separan con la regla de arriba.
const nombresParaMostrar = (s) =>
  s.nombre && s.apellido
    ? { nombre: s.nombre, apellido: s.apellido }
    : separarNombre(s.nombreApellido);

const toSolicitudDTO = (s) => ({
  id:                s.oid,
  ...nombresParaMostrar(s),
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
  separarNombre,
  toSolicitudDTO,
};
