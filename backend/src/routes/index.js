// backend/src/routes/index.js

const { Router }    = require('express');
const authRoutes    = require('./auth.routes');
const viajesRoutes  = require('./viajes.routes');
const lineasRoutes  = require('./lineas.routes');
const paradasRoutes = require('./paradas.routes');
const adminRoutes   = require('./admin.routes');

const router = Router();

router.use('/auth',    authRoutes);
router.use('/viajes',  viajesRoutes);
router.use('/lineas',  lineasRoutes);
router.use('/paradas', paradasRoutes);
router.use('/admin',   adminRoutes);

module.exports = router;