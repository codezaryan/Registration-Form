import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Make environment variables available in the app
      __APP_ENV__: JSON.stringify(mode),
    },
    base: isProduction ? './' : '/',
    server: {
      // Development server configuration
      ...(mode === 'development' && {
        cors: true,
        host: true,
      }),
    },
    build: {
      // Production build configuration
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
      // Ensure proper handling of client-side routing
      assetsInlineLimit: 4096,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'axios', 'react-router-dom'],
    },
  }
})
