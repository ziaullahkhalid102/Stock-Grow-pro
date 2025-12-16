
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This handles the variable globally so the app doesn't crash on load
    'process.env': {} 
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
