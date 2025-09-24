import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Make environment variables available in the app
      __APP_ENV__: JSON.stringify(mode),
    },
    server: {
      // Development server configuration
      ...(mode === 'development' && {
        cors: true,
        host: true,
      }),
    },
    build: {
      // Production build configuration
      ...(mode === 'production' && {
        sourcemap: false,
        minify: 'terser',
      }),
    },
  }
})
