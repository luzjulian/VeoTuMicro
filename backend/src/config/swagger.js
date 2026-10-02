const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VeoTuMicro API',
      version: '1.0.0',
      description: 'API para la gestión integral de acceso a transporte público para personas con discapacidad visual.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
        devAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Dev-User',
          description: `Pasajero: {"sub":"2","nombreUsuario":"pasajero.ana","rol":"pasajero"}\n\nChofer: {"sub":"4","nombreUsuario":"chofer.carlos","rol":"chofer"}`,
        },
      },
      schemas: {

        // ─── Auth ──────────────────────────────────────────────────────────
        // multipart/form-data: los nombres de campo son los del formulario del front
        RegisterInput: {
          type: 'object',
          required: ['nombre', 'email', 'password', 'certificado'],
          properties: {
            nombre:          { type: 'string', example: 'Pepe Argento', description: 'Nombre completo' },
            email:           { type: 'string', format: 'email', example: 'pepeargento@correo.com', description: 'Será el nombre de usuario' },
            password:        { type: 'string', format: 'password', minLength: 8, maxLength: 72, example: 'miPassword123' },
            confirmPassword: { type: 'string', format: 'password', description: 'Opcional; si se envía debe coincidir con password' },
            dni:             { type: 'string', example: '12345678', description: 'Opcional (7 u 8 dígitos)' },
            fechaNacimiento: { type: 'string', example: '2000-05-15', description: 'Opcional (AAAA-MM-DD)' },
            certificado:     { type: 'string', format: 'binary', description: 'Certificado de discapacidad en PDF (máx. 5 MB)' },
          },
        },

        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Solicitud enviada. Te avisaremos por mail cuando validemos tu certificado' },
            estado:  { type: 'string', example: 'pendiente' },
          },
        },

        LoginInput: {
          type: 'object',
          description: 'Se entra con email y contraseña (también se acepta nombreUsuario y contrasenia).',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', example: 'pepeargento@correo.com' },
            password: { type: 'string', example: 'miPassword123' },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            nombreUsuario: { type: 'string', example: 'luzjulian' },
            rol: {
              type: 'string',
              enum: ['pasajero', 'chofer', 'administrativo'],
              example: 'pasajero',
            },
          },
        },

        // ─── Admin ─────────────────────────────────────────────────────────
        Solicitud: {
          type: 'object',
          properties: {
            id:                { type: 'integer', example: 12 },
            nombre:            { type: 'string', example: 'Pepe' },
            apellido:          { type: 'string', example: 'Argento', description: 'Última palabra del nombre completo (solo para mostrar)' },
            dni:               { type: 'string', nullable: true, example: '12345678' },
            fechaHoraRegistro: { type: 'string', format: 'date-time' },
            estado:            { type: 'string', enum: ['pendiente', 'aceptado', 'rechazado'] },
            certificadoUrl:    { type: 'string', example: '/api/admin/solicitudes/12/certificado' },
          },
        },

        SolicitudResuelta: {
          allOf: [
            { $ref: '#/components/schemas/Solicitud' },
            {
              type: 'object',
              properties: {
                mailEnviado: { type: 'boolean', description: 'false si el mail falló (la decisión se guardó igual)' },
              },
            },
          ],
        },

        Kpis: {
          type: 'object',
          properties: {
            solicitudesHoy:    { type: 'integer', example: 4 },
            deltaVsAyer:       { type: 'integer', example: 1, description: 'Solicitudes de hoy menos las de ayer' },
            pasajerosActivos:  { type: 'integer', example: 128, description: 'Pasajeros con certificado aprobado' },
            certPendientes:    { type: 'integer', example: 3 },
            conductoresEnRuta: { type: 'integer', example: 12 },
          },
        },

        // ─── Errores comunes ───────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje de error' },
          },
        },

        SuccessMessage: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operación exitosa' },
          },
        },

      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;