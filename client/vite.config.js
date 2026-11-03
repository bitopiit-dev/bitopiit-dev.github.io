import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE is set by the GitHub Pages workflow:
//   "/" for a <user>.github.io repo, "/<repo>/" for any other repo.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } }, // lets the dev server read ../shared/profile.json
});
