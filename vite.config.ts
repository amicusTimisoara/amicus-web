import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, /api/* is proxied to the live backend so the client can use
    // same-origin relative URLs (no CORS, no hardcoded host). Production points
    // VITE_API_BASE at the deployed API instead — see src/lib/api.ts.
    proxy: {
      '/api': {
        target: 'https://thorsp.ddns.net/amicus',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
