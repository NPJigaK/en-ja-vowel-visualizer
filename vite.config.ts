import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: { manualChunks: () => 'main' }   // 単一チャンク化
    }
  },
  assetsInclude: ['**/*.wasm'],
  worker: { format: 'es' },  
});
