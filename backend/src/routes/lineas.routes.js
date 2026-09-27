// backend/src/routes/lineas.routes.js

const { Router }   = require('express');
const ctrl         = require('../controllers/lineas.controller');
// 🔧 DEV: usando dev-auth mientras el módulo de auth real está en construcción.
// En producción cambiar a: const { requireAuth } = require('../middlewares/require-auth');
const { requireAuth } = require('../middlewares/dev-auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Lineas
 *   description: Consulta de líneas de colectivo
 */

/**
 * @swagger
 * /api/lineas/activas:
 *   get:
 *     tags: [Lineas]
 *     summary: Lista todas las líneas con al menos un chofer activo
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     responses:
 *       200:
 *         description: Array de líneas activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nroLinea: { type: string, example: "307" }
 *                   ramal:    { type: string, example: "A" }
 */
router.get('/activas', requireAuth, ctrl.listarLineasActivas);

/**
 * @swagger
 * /api/lineas/disponible:
 *   get:
 *     tags: [Lineas]
 *     summary: Valida si una línea tiene arrivals en la parada detectada por GPS
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: query
 *         name: nroLinea
 *         required: true
 *         schema: { type: string, example: "307" }
 *       - in: query
 *         name: ramal
 *         required: true
 *         schema: { type: string, example: "A" }
 *       - in: query
 *         name: nroParada
 *         required: true
 *         schema: { type: string, example: "P001" }
 *     responses:
 *       200:
 *         description: La línea está disponible en esa parada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disponible: { type: boolean, example: true }
 *       400:
 *         description: La línea no tiene arrivals en esa parada
 */
router.get('/disponible', requireAuth, ctrl.chequearDisponibilidad);

module.exports = router;