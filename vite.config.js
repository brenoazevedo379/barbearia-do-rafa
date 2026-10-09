import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Funciona também quando o projeto é publicado em uma subpasta do GitHub Pages.
  base: './',
})
