import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, /api/* is proxied to the STAGE backend so the client can use
    // same-origin relative URLs (no CORS, no hardcoded host) and never touches
    // prod. The deployed builds set VITE_API_BASE instead — see src/lib/api.ts
    // (main -> https://api.thorsp.net, PR previews -> https://stage.thorsp.net).
    //
    // Set AMICUS_API_PROXY to work against a local backend, e.g.
    //   AMICUS_API_PROXY=http://localhost:5080 bun run dev
    proxy: {
      '/api': {
        target: process.env.AMICUS_API_PROXY ?? 'https://stage.thorsp.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
