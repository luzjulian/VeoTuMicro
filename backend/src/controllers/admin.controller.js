const kpisService        = require('../services/kpis.service');
const solicitudesService = require('../services/solicitudes.service');

// Los controllers solo traducen HTTP <-> servicio.

const kpis = async (_req, res, next) => {
  try {
    res.status(200).json(await kpisService.calcularKpis());
  } catch (err) {
    next(err);
  }
};

const listarSolicitudes = async (req, res, next) => {
  try {
    res.status(200).json(await solicitudesService.listar(req.validated.query));
  } catch (err) {
    next(err);
  }
};

const verCertificado = async (req, res, next) => {
  try {
    const { stream, size, oid } = await solicitudesService.abrirCertificado(req.validated.params.id);

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    // inline: el navegador lo muestra (iframe del modal) en vez de descargarlo.
    // El nombre es fijo a propósito: el original lo eligió el usuario y no se refleja en headers.
    res.setHeader('Content-Disposition', `inline; filename="certificado-${oid}.pdf"`);
    // Es un dato sensible: que ningún navegador ni proxy lo guarde.
    res.setHeader('Cache-Control', 'private, no-store');

    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

const aceptarSolicitud = async (req, res, next) => {
  try {
    const result = await solicitudesService.aceptar({
      oid:       req.validated.params.id,
      cuentaOid: req.usuario.sub,
      io:        req.app.get('io'),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const rechazarSolicitud = async (req, res, next) => {
  try {
    const result = await solicitudesService.rechazar({
      oid:       req.validated.params.id,
      cuentaOid: req.usuario.sub,
      io:        req.app.get('io'),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { kpis, listarSolicitudes, verCertificado, aceptarSolicitud, rechazarSolicitud };
