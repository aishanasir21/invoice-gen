import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // allows network access
    allowedHosts: [
      'bfe38ded-ff51-4f48-a3fc-89d41f94c7d1-00-1s4d0ank060e1.pike.replit.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // backend inside Replit
        changeOrigin: true,
        secure: false,
      }
    }
  }
})