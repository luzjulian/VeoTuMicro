// backend/src/middlewares/upload.js
//
// Subida del certificado de discapacidad con multer.
// Uso en una ruta:  router.post('/x', subirCertificado, validate(...), controller, borrarArchivoSiFalla)

const multer = require('multer');
const { env } = require('../config/env');
const storage = require('../lib/storage');
const { BadRequestError, AppError } = require('../lib/http-errors');

const MAX_BYTES = Math.round(env.MAX_CERTIFICADO_MB * 1024 * 1024);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storage.DIRECTORIO),
    // El nombre lo genera el servidor; el original solo se guarda para mostrarlo.
    filename: (_req, _file, cb) => cb(null, storage.nuevaClave()),
  }),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 20 },
  fileFilter: (_req, file, cb) => {
    // El mimetype lo declara el cliente: es un primer filtro, no una garantía.
    // La verificación real ("%PDF-") se hace después de guardar el archivo.
    if (file.mimetype !== 'application/pdf') {
      return cb(new BadRequestError('El certificado debe ser un archivo PDF'));
    }
    cb(null, true);
  },
}).single('certificado');

// Traduce los errores propios de multer a errores HTTP del proyecto.
const traducirErrorMulter = (err) => {
  if (err instanceof AppError) return err;
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError(413, `El certificado supera el tamaño máximo de ${env.MAX_CERTIFICADO_MB} MB`);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return new BadRequestError('Solo se admite un archivo, en el campo "certificado"');
    }
    return new BadRequestError('No se pudo procesar el archivo enviado');
  }
  return err;
};

const subirCertificado = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(traducirErrorMulter(err));

    if (!req.file) {
      return next(new BadRequestError('El certificado de discapacidad (PDF) es obligatorio'));
    }

    try {
      if (!(await storage.esPdfReal(req.file.filename))) {
        await storage.borrar(req.file.filename);
        req.file = undefined;
        return next(new BadRequestError('El archivo no es un PDF válido'));
      }
      next();
    } catch (e) {
      next(e);
    }
  });
};

// Middleware de error: si algo falló DESPUÉS de guardar el archivo
// (validación de datos, base de datos, etc.) lo borramos para no dejar huérfanos.
// Se coloca al final de la cadena de la ruta.
// eslint-disable-next-line no-unused-vars
const borrarArchivoSiFalla = async (err, req, _res, next) => {
  if (req.file?.filename) {
    try {
      await storage.borrar(req.file.filename);
    } catch (e) {
      console.error('[upload] no se pudo borrar el archivo huérfano:', e.message);
    }
  }
  next(err);
};

module.exports = { subirCertificado, borrarArchivoSiFalla };
