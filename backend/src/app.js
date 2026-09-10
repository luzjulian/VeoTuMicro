const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Backend funcionando' });
});

// Acá vamos a ir agregando las rutas reales:
// app.use('/api/viajes', require('./routes/viajes.routes'));
// app.use('/api/usuarios', require('./routes/usuarios.routes'));

module.exports = app;