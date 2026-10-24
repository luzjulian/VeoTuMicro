// backend/src/domain/perfil.js
//
// Validación y forma de salida del perfil propio (GET / PATCH /api/perfil).

const { z } = require('zod');

// El DNI no se puede editar. El teléfono es opcional: vacío = "sin teléfono".
const actualizarPerfilSchema = z.object({
  nombre:   z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string('El apellido es obligatorio').trim().min(1, 'El apellido es obligatorio').max(100),
  email:    z.string('El email es obligatorio').trim().toLowerCase().pipe(z.email('Email inválido').max(254)),
  telefono: z.string().trim().regex(/^(\+?[\d\s()-]{6,20})?$/, 'Teléfono inválido').default(''),
});

// Mismo orden que resolverRol de auth.service.
const rolDe = (persona) => {
  if (persona.chofer)         return 'chofer';
  if (persona.pasajero)       return 'pasajero';
  if (persona.administrativo) return 'administrativo';
  return null;
};

/**
 * @param cuenta     Cuenta con persona { telefonos, pasajero, chofer, administrativo }
 * @param solicitud  SolicitudRegistro de la que salió el certificado (o null: cuentas del seed)
 */
const toPerfilDTO = (cuenta, solicitud) => {
  const { persona } = cuenta;
  const { pasajero } = persona;

  return {
    rol:      rolDe(persona),
    nombre:   persona.nombre,
    apellido: persona.apellido,
    dni:      persona.dni ?? null,
    email:    persona.email ?? '',
    telefono: persona.telefonos[0]?.nroTelefono ?? '',
    // Solo los pasajeros pasan por una solicitud: para los demás roles es null.
    fechaAceptacion: pasajero?.aceptadaAt?.toISOString() ?? null,
    certificado: pasajero
      ? {
          nombreArchivo: solicitud?.certificadoNombre ?? 'certificado.pdf',
          fechaCarga:    (solicitud?.createdAt ?? pasajero.aceptadaAt)?.toISOString() ?? null,
          url:           '/api/perfil/certificado',
        }
      : null,
  };
};

module.exports = { actualizarPerfilSchema, toPerfilDTO };