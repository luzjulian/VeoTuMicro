// backend/src/routes/paradas.routes.js

const { Router }   = require('express');
const ctrl         = require('../controllers/paradas.controller');
// 🔧 DEV: usando dev-auth mientras el módulo de auth real está en construcción.
// En producción cambiar a: const { requireAuth } = require('../middlewares/require-auth');
const { requireAuth } = require('../middlewares/dev-auth');
const { validate }    = require('../middlewares/validate');
const { paradaCercanaSchema } = require('../domain/parada');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Paradas
 *   description: Consulta de paradas de ascenso
 */

/**
 * @swagger
 * /api/paradas/cercana:
 *   get:
 *     tags: [Paradas]
 *     summary: Retorna la parada de ascenso más cercana a las coordenadas GPS del pasajero
 *     security:
 *       - cookieAuth: []
 *       - devAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: -34.9205 }
 *         description: Latitud GPS del pasajero
 *       - in: query
 *         name: lon
 *         required: true
 *         schema: { type: number, example: -57.9562 }
 *         description: Longitud GPS del pasajero
 *     responses:
 *       200:
 *         description: Parada más cercana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nroParada: { type: string,  example: "0001"    }
 *                 latitud:   { type: number,  example: -34.9205  }
 *                 longitud:  { type: number,  example: -57.9562  }
 *       400:
 *         description: Parámetros lat/lon inválidos o ausentes
 */
router.get('/cercana', requireAuth, validate(paradaCercanaSchema, 'query'), ctrl.paradaCercana);

module.exports = router;