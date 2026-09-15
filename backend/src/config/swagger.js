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
      },
      schemas: {

        // ─── Auth ──────────────────────────────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['nombreUsuario', 'contrasenia', 'dni', 'nombreApellido', 'fechaNacimiento', 'certificadoDiscapacidad'],
          properties: {
            nombreUsuario:           { type: 'string', example: 'luzjulian' },
            contrasenia:             { type: 'string', example: 'miPassword123' },
            dni:                     { type: 'string', example: '12345678' },
            nombreApellido:          { type: 'string', example: 'Julian Luz' },
            fechaNacimiento:         { type: 'string', format: 'date-time', example: '2000-05-15T00:00:00.000Z' },
            certificadoDiscapacidad: { type: 'string', example: 'CERT-001' },
          },
        },

        LoginInput: {
          type: 'object',
          required: ['nombreUsuario', 'contrasenia'],
          properties: {
            nombreUsuario: { type: 'string', example: 'luzjulian' },
            contrasenia:   { type: 'string', example: 'miPassword123' },
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