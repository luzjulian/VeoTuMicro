const { Router } = require('express');
const ctrl = require('../controllers/perfil.controller');
const { requireAuth, soloRol } = require('../middlewares/require-auth');
const { validate } = require('../middlewares/validate');
const { actualizarPerfilSchema } = require('../domain/perfil');

const router = Router();

// Cualquier rol logueado puede ver y editar SU perfil.
router.use(requireAuth);

router.get('/', ctrl.obtener);
router.patch('/', validate(actualizarPerfilSchema), ctrl.actualizar);

// El certificado solo existe para pasajeros. La cookie viaja sola, así que sirve para el <iframe>.
router.get('/certificado', soloRol('pasajero'), ctrl.verCertificado);

module.exports = router;