// backend/src/routes/viajes.routes.js

const { Router }               = require('express');
const viajesController         = require('../controllers/viajes.controller');
// 🔧 DEV: importando dev-auth mientras el módulo de auth está en construcción.
// Cuando auth esté listo, cambiar esta línea por:
// const { requireAuth, soloRol } = require('../middlewares/require-auth');
const { requireAuth, soloRol } = require('../middlewares/dev-auth');
const { validate }                          = require('../middlewares/validate');
const { iniciarViajeSchema, nroViajeParamSchema } = require('../domain/viaje');
const { requireIdempotencyKey } = require('../middlewares/idempotency');

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
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-0000-4000-8000-000000000001"
 *         description: >
 *           UUID v4 generado por el cliente para evitar viajes duplicados.
 *           Si se reintenta la misma petición con la misma key, el servidor
 *           devuelve el viaje ya creado sin crear uno nuevo.
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
 *                 example: "0001"
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
 *         headers:
 *           Location:
 *             description: URL del viaje recién creado
 *             schema:
 *               type: string
 *               example: "/api/viajes/1"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nroViaje:
 *                   type: integer
 *                   example: 1
 *                 estado:
 *                   type: string
 *                   example: "PENDIENTE"
 *                 destino:
 *                   type: string
 *                   example: "7 y 47"
 *                 nroParada:
 *                   type: string
 *                   example: "0001"
 *                 nroLinea:
 *                   type: string
 *                   example: "307"
 *                 ramal:
 *                   type: string
 *                   example: "A"
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
  requireIdempotencyKey,
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
 *           type: integer
 *         description: Identificador numérico del viaje (oid autoincremental)
 *     responses:
 *       200:
 *         description: Viaje confirmado — pasajero notificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   example: "CONFIRMADO"
 *                 estimadoArribo:
 *                   type: integer
 *                   nullable: true
 *                   example: 5
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
  validate(nroViajeParamSchema, 'params'),
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Reasignado o cancelado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   enum: [PENDIENTE, CANCELADO]
 *                   example: "CANCELADO"
 *                 reasignado:
 *                   type: boolean
 *                   example: false
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
  validate(nroViajeParamSchema, 'params'),
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Ascenso confirmado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   example: "ABORDO"
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
  validate(nroViajeParamSchema, 'params'),
  viajesController.confirmarAscenso
);

/**
 * @swagger
 * /api/viajes/{nroViaje}/proximidad:
 *   post:
 *     summary: Avisa al pasajero que se acerca a su parada de descenso (conductor)
 *     description: >
 *       Simula la proximidad a la parada de bajada (en producción la dispararía el GPS).
 *       Solo funciona con el viaje en estado ABORDO y notifica al pasajero vía Socket.io
 *       (evento viaje:proximidad). Es idempotente: si ya se avisó, un reintento devuelve
 *       200 con notificado=false y no vuelve a emitir el evento.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: path
 *         name: nroViaje
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Aviso enviado (o ya enviado previamente)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notificado:
 *                   type: boolean
 *                   example: true
 *                 mensaje:
 *                   type: string
 *                   example: "Notificación de proximidad enviada"
 *       400:
 *         description: El viaje no está en estado ABORDO
 *       403:
 *         description: No es tu viaje
 *       404:
 *         description: Viaje no encontrado
 */
router.post(
  '/:nroViaje/proximidad',
  requireAuth,
  soloRol('chofer'),
  validate(nroViajeParamSchema, 'params'),
  viajesController.notificarProximidad
);

/**
 * @swagger
 * /api/viajes/{nroViaje}/descenso:
 *   post:
 *     summary: Confirma el descenso del pasajero (conductor)
 *     description: >
 *       El conductor confirma que el pasajero bajó. El viaje pasa a FINALIZADO y se
 *       notifica al pasajero vía Socket.io (evento descenso:confirmado).
 *       Es idempotente: si el viaje ya estaba FINALIZADO devuelve 200 sin volver a notificar.
 *     tags: [Viajes]
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: path
 *         name: nroViaje
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descenso confirmado (o ya confirmado previamente)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   example: "FINALIZADO"
 *       400:
 *         description: El viaje no está en estado ABORDO
 *       403:
 *         description: No es tu viaje
 *       404:
 *         description: Viaje no encontrado
 */
router.post(
  '/:nroViaje/descenso',
  requireAuth,
  soloRol('chofer'),
  validate(nroViajeParamSchema, 'params'),
  viajesController.confirmarDescenso
);

module.exports = router;                                                                             