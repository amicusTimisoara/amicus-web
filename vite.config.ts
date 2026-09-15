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
    //
    // thorsp.net is a stand-in until AMiCUS has its own domain; when it does,
    // only this target and VITE_API_BASE change — the app code does not.
    //
    // Set AMICUS_API_PROXY to work against a local backend instead, e.g.
    //   AMICUS_API_PROXY=http://localhost:5080 bun run dev
    // which is how you get real slots on screen without touching the shared one.
    proxy: {
      '/api': {
        target: process.env.AMICUS_API_PROXY ?? 'https://thorsp.net/amicus',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
