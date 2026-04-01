import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // On GitHub Pages the site lives at /<repo-name>/ — set base so asset paths resolve correctly.
  // Locally (or on a custom domain / Vercel) this env var is unset and base defaults to '/'.
  base: process.env.GITHUB_ACTIONS ? '/spotify-playlist-to-json/' : '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
