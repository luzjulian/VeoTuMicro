// backend/src/routes/index.js

const { Router }    = require('express');
const authRoutes    = require('./auth.routes');
const viajesRoutes  = require('./viajes.routes');
const lineasRoutes  = require('./lineas.routes');
const paradasRoutes = require('./paradas.routes');

const router = Router();

router.use('/auth',    authRoutes);
router.use('/viajes',  viajesRoutes);
router.use('/lineas',  lineasRoutes);
router.use('/paradas', paradasRoutes);

module.exports = router;