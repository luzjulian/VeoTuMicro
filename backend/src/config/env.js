require('dotenv').config();
const { z } = require('zod');

// Validar el .env al arrancar, no con process.env.X disperso por el código.
// Si falta una variable crítica o JWT_SECRET es demasiado corto, el proceso
// NO arranca: un crash temprano y explícito es mejor que un default inseguro silencioso.
const envSchema = z.object({
  PORT:     z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  CORS_ORIGIN:  z.string().min(1, 'CORS_ORIGIN es obligatoria'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),

  JWT_ACCESS_EXPIRES_IN:  z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER:   z.string().default('veotumicro-api'),
  JWT_AUDIENCE: z.string().default('veotumicro-frontend'),

  // Rate limiting — defaults estrictos de producción
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX:       z.coerce.number().int().positive().default(5),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  GLOBAL_RATE_LIMIT_MAX:       z.coerce.number().int().positive().default(300),

  // Certificados de discapacidad (PDF) subidos en el registro
  UPLOADS_DIR:        z.string().min(1).default('./uploads/certificados'),
  MAX_CERTIFICADO_MB: z.coerce.number().positive().default(5),

  // Mail (nodemailer). En desarrollo, si falta SMTP_HOST el mail NO se envía:
  // se imprime en consola. En producción SMTP_HOST es obligatorio (ver superRefine).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().min(1).default('VeoTuMicro <no-reply@veotumicro.local>'),
  APP_URL:   z.string().default('http://localhost:5173'),
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === 'production' && !v.SMTP_HOST) {
    ctx.addIssue({
      code: 'custom',
      path: ['SMTP_HOST'],
      message: 'SMTP_HOST es obligatoria en producción (sin ella no se pueden enviar los mails de validación)',
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas o faltantes:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

module.exports = { env };