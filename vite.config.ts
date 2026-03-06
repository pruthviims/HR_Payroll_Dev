
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Professional libraries like jsPDF and Recharts are large.
    // We increase this limit to 2MB to silence build warnings.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          utils: ['jspdf', 'jspdf-autotable', 'jszip', 'papaparse'],
          charts: ['recharts']
        }
      }
    }
  },
  server: {
    port: 3000,
  }
});
