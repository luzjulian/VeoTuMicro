const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const cookieParser   = require('cookie-parser');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./config/swagger');
const { env }        = require('./config/env');
const routes         = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');
const { globalRateLimit } = require('./middlewares/rate-limit');

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  // Helmet agrega headers de seguridad — desactivamos contentSecurityPolicy
  // para que la UI de Swagger pueda cargar sus estilos y scripts
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cors({
    origin:      env.CORS_ORIGIN,
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Documentación Swagger — disponible en /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api', globalRateLimit);

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };