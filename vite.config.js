import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Base is set via VITE_BASE when building on CI (e.g. Vercel); defaults to '/'
export default defineConfig({
  plugins: [react()],
  // eslint-disable-next-line no-undef
  base: (typeof process !== 'undefined' && process.env?.VITE_BASE) || '/',
})
