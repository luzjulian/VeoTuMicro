const { z } = require('zod');

// Zod hace strip de cualquier campo no declarado en el schema,
// lo que evita mass assignment vulnerabilities.

// El front envía { email, password } (así lo pide su formulario de login).
// Se siguen aceptando { nombreUsuario, contrasenia } para no romper a quien ya use la API.
// El resultado normalizado es { identificador, contrasenia }.
const loginSchema = z
  .object({
    email:         z.string().trim().min(1).optional(),
    nombreUsuario: z.string().trim().min(1).optional(),
    password:      z.string().min(1).optional(),
    contrasenia:   z.string().min(1).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.email && !v.nombreUsuario) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'El email es obligatorio' });
    }
    if (!v.password && !v.contrasenia) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña es obligatoria' });
    }
  })
  .transform((v) => ({
    // Los emails se guardan en minúscula; los nombres de usuario viejos se respetan tal cual.
    identificador: v.email ? v.email.toLowerCase() : v.nombreUsuario,
    contrasenia:   v.password ?? v.contrasenia,
  }));

// Un campo opcional que llega como "" (formularios) se trata como ausente.
const vacioAUndefined = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

// Solo los pasajeros se registran desde la app, y el registro NO crea el usuario:
// crea una solicitud pendiente que un administrativo acepta o rechaza.
// Los nombres de campo son los del formulario del front (nombre, email, password, confirmPassword).
// Administrativos y choferes son cargados directamente en la BD.
const registerSchema = z
  .object({
    nombre:          z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(100),
    // Opcional por compatibilidad: si no llega, `nombre` se toma como nombre completo.
    apellido:        z.preprocess(vacioAUndefined, z.string().trim().max(100).optional()),
    email:           z.string('El email es obligatorio').trim().toLowerCase().pipe(z.email('Email inválido').max(254)),
    password:        z.string('La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
    confirmPassword: z.string().optional(),

    // Opcionales: el formulario actual no los envía (ver plan, punto P1).
    dni: z.preprocess(
      vacioAUndefined,
      z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido (7 u 8 dígitos)').optional()
    ),
    fechaNacimiento: z.preprocess(
      vacioAUndefined,
      z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, 'Fecha inválida, usar formato AAAA-MM-DD')
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida')
        .optional()
    ),
  })
  .refine((v) => v.confirmPassword === undefined || v.confirmPassword === v.password, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

// DTO de salida — nunca exponer la contraseña ni datos internos
const toPublicCuenta = (cuenta) => ({
  oid:           cuenta.oid,
  nombreUsuario: cuenta.nombreUsuario,
});

module.exports = { loginSchema, registerSchema, toPublicCuenta };