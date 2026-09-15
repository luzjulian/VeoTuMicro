const { z } = require('zod');

// Zod hace strip de cualquier campo no declarado en el schema,
// lo que evita mass assignment vulnerabilities.

const loginSchema = z.object({
  nombreUsuario: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
  contrasenia:   z.string().min(1, 'La contraseña es obligatoria'),
});

// Solo los pasajeros se registran desde la app.
// Administrativos y choferes son cargados directamente en la BD.
const registerSchema = z.object({
  nombreUsuario: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo puede tener letras, números y guion bajo'),
  contrasenia:             z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  dni:                     z.string().trim().min(7, 'DNI inválido').max(8),
  nombreApellido:          z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  fechaNacimiento:         z.string().datetime({ message: 'Fecha inválida, usar formato ISO 8601' }),
  certificadoDiscapacidad: z.string().min(1, 'El certificado de discapacidad es obligatorio'),
});

// DTO de salida — nunca exponer la contraseña ni datos internos
const toPublicCuenta = (cuenta) => ({
  oid:           cuenta.oid,
  nombreUsuario: cuenta.nombreUsuario,
});

module.exports = { loginSchema, registerSchema, toPublicCuenta };