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
    // Hosts permitidos además de localhost. Necesario para exponer el dev server
    // por un túnel HTTPS (Cloudflare / ngrok): sin esto responde 403.
    // El punto inicial habilita el dominio y todos sus subdominios, así no hay
    // que tocar esto cada vez que el túnel genera una URL nueva.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.app'],
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