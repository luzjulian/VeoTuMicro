// backend/src/routes/viajes.routes.js

const { Router }           = require('express');
const viajesController     = require('../controllers/viajes.controller');
// 🔧 DEV: importando dev-auth mientras el módulo de auth está en construcción.
// Cuando auth esté listo, cambiar esta línea por:
// const { requireAuth, soloRol } = require('../middlewares/require-auth');
const { requireAuth, soloRol } = require('../middlewares/dev-auth');
const { validate }         = require('../middlewares/validate');
const { iniciarViajeSchema } = require('../domain/viaje');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Viajes
 *   description: Gestión del ciclo de vida de un viaje
 */

/**
 * @swagger
 * /api/viajes:
 *   post:
 *     summary: Inicia un nuevo viaje (pasajero)
 *     description: >
 *       El pasajero solicita un ascenso enviando la parada (obtenida por GPS),
 *       la línea y ramal deseados, y su destino de bajada.
 *       El sistema consulta el mock de próximos arribos, asigna el conductor
 *       más cercano y notifica al mismo vía Socket.io.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nroParada, nroLinea, ramal, destino]
 *             properties:
 *               nroParada:
 *                 type: string
 *                 example: "P001"
 *               nroLinea:
 *                 type: string
 *                 example: "307"
 *               ramal:
 *                 type: string
 *                 example: "A"
 *               destino:
 *                 type: string
 *                 example: "7 y 47"
 *     responses:
 *       201:
 *         description: Viaje creado — se notificó al conductor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nroViaje:
 *                   type: string
 *                   example: "a3f1b2c4-..."
 *       400:
 *         description: Datos inválidos o parada/línea no encontrada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: El usuario no tiene perfil de pasajero
 */
router.post(
  '/',
  requireAuth,
  soloRol('pasajero'),
  validate(iniciarViajeSchema),
  viajesController.iniciarViaje
);

/**
 * @swagger
 * /api/viajes/{nroViaje}/confirmar:
 *   post:
 *     summary: Confirma el viaje (conductor)
 *     description: >
 *       El conductor acepta la solicitud del pasajero.
 *       El viaje pasa a estado CONFIRMADO y se notifica al pasajero
 *       con el tiempo estimado de arribo vía Socket.io.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: path
 *         name: nroViaje
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del viaje (numeroSolicitud)
 *     responses:
 *       200:
 *         description: Viaje confirmado — pasajero notificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: El viaje no está en estado PENDIENTE
 *       403:
 *         description: No es tu viaje para confirmar
 *       404:
 *         description: Viaje no encontrado
 */
router.post(
  '/:nroViaje/confirmar',
  requireAuth,
  soloRol('chofer'),
  viajesController.confirmarViaje
);

/**
 * @swagger
 * /api/viajes/{nroViaje}/rechazar:
 *   post:
 *     summary: Rechaza el viaje (conductor)
 *     description: >
 *       El conductor rechaza la solicitud. El sistema busca el siguiente
 *       conductor disponible en el mock y reasigna el viaje.
 *       Si no hay más conductores, el viaje se cancela y se notifica al pasajero.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: path
 *         name: nroViaje
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reasignado o cancelado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 reasignado:
 *                   type: boolean
 *       400:
 *         description: El viaje no está en estado PENDIENTE
 *       403:
 *         description: No es tu viaje para rechazar
 *       404:
 *         description: Viaje no encontrado
 */
router.post(
  '/:nroViaje/rechazar',
  requireAuth,
  soloRol('chofer'),
  viajesController.rechazarViaje
);

/**
 * @swagger
 * /api/viajes/{nroViaje}/abordo:
 *   post:
 *     summary: Confirma el ascenso al colectivo (pasajero)
 *     description: >
 *       El pasajero confirma que subió al colectivo.
 *       El viaje pasa a estado ABORDO y se notifica al conductor.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: path
 *         name: nroViaje
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ascenso confirmado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: El viaje no está en estado CONFIRMADO
 *       403:
 *         description: No es tu viaje
 *       404:
 *         description: Viaje no encontrado
 */
router.post(
  '/:nroViaje/abordo',
  requireAuth,
  soloRol('pasajero'),
  viajesController.confirmarAscenso
);

module.exports = router;