import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zolvency/sdk': path.resolve(__dirname, '../src'),
      // Mapeia o módulo 'buffer' para o pacote que instalamos
      buffer: 'buffer',
      process: 'process/browser',
    }
  },
  define: {
    // Injeta o global Buffer de forma que o SDK consiga encontrar
    'global': 'globalThis',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  }
})
