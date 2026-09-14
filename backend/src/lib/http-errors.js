// Error base con statusCode HTTP asociado.
// El error-handler central lo traduce a JSON sin que cada controller arme el status a mano.
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name    = 'AppError';
    this.statusCode = statusCode;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida') { super(400, message); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') { super(401, message); }
}

// 403 = autenticado pero sin permisos (distinto de 401 que es "no identificado")
class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para hacer esto') { super(403, message); }
}

class NotFoundError extends AppError {
  constructor(message = 'No encontrado') { super(404, message); }
}

class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') { super(409, message); }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};