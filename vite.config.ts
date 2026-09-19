import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  // 🔒 PRODUCTION ANTI-THEFT & OBFUSCATION CONFIG
  build: {
    sourcemap: false, // Disables source maps so nobody can see your raw TypeScript code
    minify: 'esbuild', // Compresses and mangles all variables into unreadable machine code
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-core': ['pdf-lib', 'pdfjs-dist'],
          'ui-vendor': ['react', 'react-dom', 'lucide-react'],
        },
      },
    },
  },
});