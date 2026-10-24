// backend/src/routes/paradas.routes.js

const { Router }   = require('express');
const ctrl         = require('../controllers/paradas.controller');
const { requireAuth } = require('../middlewares/require-auth');
const { validate }    = require('../middlewares/validate');
const { geocodingRateLimit } = require('../middlewares/rate-limit');
const { paradaCercanaSchema, interseccionSchema } = require('../domain/parada');

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

/**
 * @swagger
 * /api/paradas/por-interseccion:
 *   get:
 *     tags: [Paradas]
 *     summary: Retorna la parada de ascenso más cercana a una intersección de calles
 *     description: >
 *       Ubicación manual, para cuando el GPS ubica mal al pasajero. Convierte la intersección
 *       en coordenadas y busca la parada más cercana con el mismo criterio de proximidad que
 *       /api/paradas/cercana. Acepta números ("60", "calle 60"), tipo y número ("av 7",
 *       "diagonal 73") o nombres ("Camino Centenario").
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: calle1
 *         required: true
 *         schema: { type: string, example: "60" }
 *         description: Primera calle de la intersección
 *       - in: query
 *         name: calle2
 *         required: true
 *         schema: { type: string, example: "125" }
 *         description: Segunda calle de la intersección
 *     responses:
 *       200:
 *         description: Parada más cercana a la intersección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nroParada: { type: string,  example: "0001"    }
 *                 latitud:   { type: number,  example: -34.9205  }
 *                 longitud:  { type: number,  example: -57.9562  }
 *       400:
 *         description: Calles inválidas, iguales, o sin paradas cerca de la intersección
 *       404:
 *         description: No se encontró esa intersección
 *       429:
 *         description: Demasiadas búsquedas seguidas
 *       503:
 *         description: El servicio de búsqueda de calles no está disponible
 */
router.get(
  '/por-interseccion',
  requireAuth,
  geocodingRateLimit,
  validate(interseccionSchema, 'query'),
  ctrl.paradaPorInterseccion
);

module.exports = router;