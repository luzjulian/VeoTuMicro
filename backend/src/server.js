const { env }       = require('./config/env');
const { createApp } = require('./app');

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});