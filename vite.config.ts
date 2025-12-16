
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This prevents "process is not defined" error in browser
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
