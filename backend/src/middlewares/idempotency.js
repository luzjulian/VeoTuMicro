// backend/src/middlewares/idempotency.js
//
// Middleware de idempotencia para POST /api/viajes.
//
// El cliente debe enviar el header:
//   Idempotency-Key: <uuid-v4>
//
// Si el header falta o tiene formato inválido → 400.
// Si el header es válido → adjunta req.idempotencyKey y pasa al siguiente handler.
// La lógica de deduplicación vive en el servicio: si ya existe un Viaje con esa
// key, se devuelve el resultado original sin crear un nuevo registro.

const { BadRequestError } = require('../lib/http-errors');

// Expresión regular de UUID v4
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * requireIdempotencyKey
 *
 * Valida que el header `Idempotency-Key` exista y sea un UUID v4.
 * Adjunta el valor normalizado (minúsculas) en `req.idempotencyKey`.
 */
const requireIdempotencyKey = (req, res, next) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return next(
      new BadRequestError('El header Idempotency-Key es obligatorio para esta operación')
    );
  }

  if (!UUID_REGEX.test(key)) {
    return next(
      new BadRequestError(
        'El header Idempotency-Key debe ser un UUID v4 válido (ej: "a3b4c5d6-...")'
      )
    );
  }

  req.idempotencyKey = key.toLowerCase();
  next();
};

module.exports = { requireIdempotencyKey };