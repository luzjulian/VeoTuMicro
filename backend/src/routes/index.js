const { Router } = require('express');
const authRoutes = require('./auth.routes');

const router = Router();

router.use('/auth', authRoutes);

// Acá se van a ir montando los demás módulos:
// router.use('/viajes',   require('./viaje.routes'));
// router.use('/lineas',   require('./linea.routes'));
// router.use('/paradas',  require('./parada.routes'));

module.exports = router;