// backend/src/server.js

const http               = require('http');
const { Server }         = require('socket.io');
const { env }            = require('./config/env');
const { createApp }      = require('./app');
const { initSocket }     = require('./sockets/viajes.socket');

const app    = createApp();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin:      env.CORS_ORIGIN,
    credentials: true,   // necesario para que las cookies lleguen en el handshake
    methods:     ['GET', 'POST'],
  },
});

// Hacer accesible el io desde los controllers vía req.app.get('io')
app.set('io', io);

// Registrar el middleware de auth y los handlers
initSocket(io);

// ---------------------------------------------------------------------------
// Arrancar
// ---------------------------------------------------------------------------
server.listen(env.PORT, () => {
  console.log(`🚀 API    escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`🔌 Socket escuchando en ws://localhost:${env.PORT}`);
});