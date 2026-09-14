const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const { env }      = require('./config/env');
const routes       = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');
const { globalRateLimit } = require('./middlewares/rate-limit');

const createApp = () => {
  const app = express();

  // Necesario para que express-rate-limit lea la IP real del cliente
  // desde X-Forwarded-For cuando hay un proxy/nginx delante en producción
  app.set('trust proxy', 1);

  // Helmet agrega headers de seguridad y saca los que revelan info de más (X-Powered-By)
  app.use(helmet());

  // Un único origen permitido con credentials: true (nunca '*' con cookies)
  app.use(cors({
    origin:      env.CORS_ORIGIN,
    credentials: true,
  }));

  // Limitamos el tamaño del body para evitar DoS con payloads enormes
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Rate limit global para toda la API
  app.use('/api', globalRateLimit);

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api', routes);

  // Estos siempre van al final
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };