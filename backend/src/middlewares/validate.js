const { BadRequestError } = require('../lib/http-errors');

// Middleware genérico que valida body/query/params con un schema Zod
// antes de llegar al controller. Nunca confiamos en la forma del request tal como llega.
// Zod además devuelve el dato ya normalizado y sin los campos que no declaramos (strip).
const validate = (schema, target = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[target]);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || target}: ${issue.message}`)
      .join('; ');
    return next(new BadRequestError(message));
  }

  // Guardamos el resultado validado en req.validated para no pisar req.body
  req.validated = { ...req.validated, [target]: result.data };
  next();
};

module.exports = { validate };