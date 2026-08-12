import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['ytautomatictools.duckdns.org'],
    proxy: {
      '/api': {
        target: 'http://localhost:4500',
        changeOrigin: true,
      },
    },
  },
})
