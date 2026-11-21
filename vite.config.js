import { defineConfig } from 'vite';

// base './' => relative asset paths, so the build works on Cloudflare Pages,
// GitHub Pages (sub-path) or any static host.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  server: { host: true },
});
