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
    port: 3000
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  }
})
