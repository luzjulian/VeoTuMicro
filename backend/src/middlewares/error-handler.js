const { AppError } = require('../lib/http-errors');
const { env }      = require('../config/env');

const isProduction = env.NODE_ENV === 'production';

// Centralizamos acá el manejo de errores.
// Un AppError expone su mensaje, pensado para mostrarse al cliente.
// Cualquier otro error devuelve un mensaje genérico; el detalle real (con el stack)
// solo va al log, nunca a la respuesta en producción, para no filtrar rutas del
// filesystem ni versiones de librerías.
const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(`[unhandled] ${req.method} ${req.path}:`, err);

  res.status(500).json({
    error: 'Ocurrió un error interno',
    // En desarrollo mostramos el stack para facilitar el debug
    ...(isProduction ? {} : { detail: err instanceof Error ? err.stack : String(err) }),
  });
};

// Se registra después de todas las rutas conocidas para capturar el resto
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `No existe ${req.method} ${req.path}` });
};

module.exports = { errorHandler, notFoundHandler };