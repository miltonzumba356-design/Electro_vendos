/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/* Redirect all non-asset requests to index.html so SPA routes survive F5 / direct navigation */
function spaFallback(): import('vite').Plugin {
  const rewrite = (req: import('http').IncomingMessage) => {
    const url = req.url ?? '/'
    if (!url.includes('.') && !url.startsWith('/api')) req.url = '/'
  }
  return {
    name: 'spa-fallback',
    configureServer(s)        { s.middlewares.use((req, _res, next) => { rewrite(req); next() }) },
    configurePreviewServer(s) { s.middlewares.use((req, _res, next) => { rewrite(req); next() }) },
  }
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  plugins: [
    spaFallback(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/lib/**', 'src/app/pages/**'],
      reporter: ['text', 'html'],
    },
  },
})
