import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// VITE_BASE is set by the GitHub Pages workflow:
//   "/" for a <user>.github.io repo, "/<repo>/" for any other repo.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } }, // lets the dev server read ../shared/profile.json
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
