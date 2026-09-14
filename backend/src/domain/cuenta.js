const { z } = require('zod');

// Zod hace strip de cualquier campo no declarado en el schema (ej. un
// { "rol": "administrativo" } enviado de más se descarta automáticamente),
// lo que evita mass assignment vulnerabilities.

const loginSchema = z.object({
  nombreUsuario: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
  contrasenia:   z.string().min(1, 'La contraseña es obligatoria'),
});

const registerSchema = z.object({
  // Datos de Cuenta
  nombreUsuario: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo puede tener letras, números y guion bajo'),
  contrasenia: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),

  // Datos de Persona
  dni:             z.string().trim().min(7, 'DNI inválido').max(8),
  nombreApellido:  z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  fechaNacimiento: z.string().datetime({ message: 'Fecha inválida, usar formato ISO 8601' }),

  // Rol — determina qué tabla de especialización se crea
  rol: z.enum(['pasajero', 'chofer', 'administrativo'], {
    errorMap: () => ({ message: 'El rol debe ser pasajero, chofer o administrativo' }),
  }),

  // Campos extra por rol (opcionales a nivel schema, validados en el service)
  certificadoDiscapacidad: z.string().optional(), // pasajero
  adminOid:                z.number().int().optional(), // pasajero
  nroLicenciaConducir:     z.string().optional(), // chofer
  legajo:                  z.string().optional(), // administrativo
});

// DTO de salida — nunca exponer la contraseña ni datos internos
const toPublicCuenta = (cuenta) => ({
  oid:          cuenta.oid,
  nombreUsuario: cuenta.nombreUsuario,
});

module.exports = { loginSchema, registerSchema, toPublicCuenta };