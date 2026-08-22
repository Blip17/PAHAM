/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localApiDevPlugin } from './src/dev/server/localApiServer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiDevPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase') || id.includes('dexie')) {
              return 'vendor-db';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
            if (id.includes('lucide-react') || id.includes('canvas-confetti')) {
              return 'vendor-ui';
            }
            if (id.includes('ts-fsrs')) {
              return 'vendor-fsrs';
            }
            return 'vendor-libs';
          }
        },
      },
    },
  },
});
