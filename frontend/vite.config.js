import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Todo el backend cuelga de /api: endpoints REST y el handshake
      // y los WebSockets de Socket.io (/api/socket.io).
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, //← activa el proxy WebSocket
      },
    },
  },
})