const perfilService = require('../services/perfil.service');

// Los controllers solo traducen HTTP <-> servicio.

const obtener = async (req, res, next) => {
  try {
    res.status(200).json(await perfilService.obtenerPerfil(req.usuario.sub));
  } catch (err) {
    next(err);
  }
};

const actualizar = async (req, res, next) => {
  try {
    res.status(200).json(await perfilService.actualizarPerfil(req.usuario.sub, req.validated.body));
  } catch (err) {
    next(err);
  }
};

const verCertificado = async (req, res, next) => {
  try {
    const { stream, size } = await perfilService.abrirCertificado(req.usuario.sub);

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', 'inline; filename="certificado.pdf"');
    res.setHeader('Cache-Control', 'private, no-store'); // dato sensible

    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { obtener, actualizar, verCertificado };