import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true // Abre el navegador automáticamente al iniciar
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public' // Aquí irán los assets en el futuro
});
