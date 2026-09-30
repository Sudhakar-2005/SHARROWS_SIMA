/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': src },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
  build: {
    target: 'es2022',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('motion') || id.includes('framer')) return 'vendor-motion'
            if (id.includes('@tanstack')) return 'vendor-virtual'
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
