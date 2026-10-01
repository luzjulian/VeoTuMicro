const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate }      = require('../middlewares/validate');
const { authRateLimit } = require('../middlewares/rate-limit');
const { subirCertificado, borrarArchivoSiFalla } = require('../middlewares/upload');
const { loginSchema, registerSchema } = require('../domain/cuenta');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Solicita el registro de un pasajero
 *     description: >
 *       Solo los pasajeros se registran desde la app (administrativos y choferes se cargan en la BD).
 *       NO crea el usuario: guarda una solicitud pendiente con los datos y el certificado de discapacidad (PDF).
 *       Cuando un administrativo la acepta se crea la cuenta (el email es el nombre de usuario) y se avisa por mail.
 *       Si la rechaza, también se avisa por mail y la persona puede volver a registrarse.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Solicitud recibida, pendiente de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Datos inválidos, archivo que no es PDF o certificado faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Ya existe una cuenta o una solicitud en curso con esos datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: El certificado supera el tamaño máximo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiados intentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Orden: límite de intentos -> subida del PDF -> validación de los datos -> controller.
// borrarArchivoSiFalla va al final: si algo falla después de guardar el PDF, lo borra.
router.post(
  '/register',
  authRateLimit,
  subirCertificado,
  validate(registerSchema),
  authController.register,
  borrarArchivoSiFalla
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión
 *     description: >
 *       Válido para pasajeros, choferes y administrativos. Se entra con el email y la contraseña
 *       (también se acepta nombreUsuario y contrasenia). Un pasajero con solicitud pendiente o rechazada
 *       no tiene cuenta todavía y recibe 401.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso — setea cookies accessToken y refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiados intentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authRateLimit, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renueva el access token usando el refresh token de la cookie
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tokens renovados — setea nuevas cookies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cierra sesión y revoca el refresh token
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', authController.logout);

module.exports = router;