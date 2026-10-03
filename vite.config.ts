import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // satellite.js 7 ships a WASM worker that uses top-level await.
  worker: { format: 'es' },
  server: {
    port: 5174,
    strictPort: false
  }
});
