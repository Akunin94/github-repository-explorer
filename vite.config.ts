import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/ — defineConfig is imported from vitest/config so the
// `test` block is type-checked alongside the Vite config.
export default defineConfig({
  plugins: [
    vue(),
    // Auto-imports Vuetify components/directives and tree-shakes unused styles.
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Vuetify ships as ESM that needs transforming for the test runner.
    server: { deps: { inline: ['vuetify'] } },
  },
})
