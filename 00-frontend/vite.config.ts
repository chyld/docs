import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Proxy API requests to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Enable SPA fallback for client-side routing
  appType: 'spa',
});
