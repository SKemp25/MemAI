import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// For GitHub Pages: base is set in deploy workflow via VITE_BASE (e.g. /MemAI/)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
