// backend/src/routes/index.js

const { Router }    = require('express');
const authRoutes    = require('./auth.routes');
const viajesRoutes  = require('./viajes.routes');

const router = Router();

router.use('/auth',   authRoutes);
router.use('/viajes', viajesRoutes);

// Acá se van a ir montando los demás módulos:
// router.use('/lineas',   require('./linea.routes'));
// router.use('/paradas',  require('./parada.routes'));

module.exports = router;