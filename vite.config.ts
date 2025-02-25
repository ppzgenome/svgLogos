import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Configure CORS for development server
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
    // Proxy certain requests to avoid CORS issues with external APIs
    proxy: {
      // Example: If needed, add proxies for specific APIs that have CORS restrictions
      // '/api/logos': {
      //   target: 'https://example-api.com',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api\/logos/, '')
      // }
    }
  }
})
