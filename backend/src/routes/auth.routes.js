const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate }       = require('../middlewares/validate');
const { authRateLimit }  = require('../middlewares/rate-limit');
const { loginSchema, registerSchema } = require('../domain/cuenta');

const router = Router();

router.post('/login',    authRateLimit, validate(loginSchema),    authController.login);
router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authController.logout);

module.exports = router;