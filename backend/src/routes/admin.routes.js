const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth, soloRol } = require('../middlewares/require-auth');
const { validate } = require('../middlewares/validate');
const { listarQuerySchema, idParamSchema } = require('../domain/solicitud');

const router = Router();

// Todo el módulo es solo para administrativos, con sesión real (cookie).
// No usa dev-auth: el <iframe> que muestra el PDF no puede mandar headers personalizados.
router.use(requireAuth, soloRol('administrativo'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Panel administrativo (solo rol administrativo)
 */

/**
 * @swagger
 * /api/admin/kpis:
 *   get:
 *     summary: Indicadores del panel
 *     description: >
 *       pasajerosActivos = pasajeros con certificado aprobado.
 *       conductoresEnRuta = choferes con un turno sin finalizar.
 *       solicitudesHoy y deltaVsAyer usan la hora de Argentina (UTC-3).
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Indicadores actuales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Kpis'
 *       401:
 *         description: Sin sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No es administrativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/kpis', adminController.kpis);

/**
 * @swagger
 * /api/admin/solicitudes:
 *   get:
 *     summary: Lista las solicitudes de registro de pasajeros
 *     description: Devuelve todas (más recientes primero). El front calcula los contadores de cada pestaña sobre esta lista, por eso no hay paginación.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pendiente, aceptado, rechazado]
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Solicitud'
 *       400:
 *         description: Filtro inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Sin sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No es administrativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/solicitudes', validate(listarQuerySchema, 'query'), adminController.listarSolicitudes);

/**
 * @swagger
 * /api/admin/solicitudes/{id}/certificado:
 *   get:
 *     summary: Muestra el certificado PDF de una solicitud
 *     description: Devuelve el PDF con Content-Disposition inline, para verlo en el navegador o en un iframe.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: El archivo PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Sin sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No es administrativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Solicitud o archivo inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/solicitudes/:id/certificado', validate(idParamSchema, 'params'), adminController.verCertificado);

/**
 * @swagger
 * /api/admin/solicitudes/{id}/aceptar:
 *   post:
 *     summary: Acepta una solicitud
 *     description: >
 *       Crea Persona, Cuenta (el email es el nombre de usuario) y Pasajero en una transacción,
 *       y envía un mail a la persona. Si el mail falla, la aceptación se mantiene y mailEnviado es false.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud aceptada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SolicitudResuelta'
 *       401:
 *         description: Sin sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No es administrativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Solicitud inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La solicitud ya fue resuelta, o ya existe un usuario con ese email o DNI
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/solicitudes/:id/aceptar', validate(idParamSchema, 'params'), adminController.aceptarSolicitud);

/**
 * @swagger
 * /api/admin/solicitudes/{id}/rechazar:
 *   post:
 *     summary: Rechaza una solicitud
 *     description: Marca la solicitud como rechazada y avisa por mail. La persona puede volver a registrarse.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SolicitudResuelta'
 *       401:
 *         description: Sin sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No es administrativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Solicitud inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La solicitud ya fue resuelta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/solicitudes/:id/rechazar', validate(idParamSchema, 'params'), adminController.rechazarSolicitud);

module.exports = router;
