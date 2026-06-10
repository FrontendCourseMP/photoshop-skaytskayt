import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = 'photoshop-skaytskayt';

export default defineConfig(() => ({
  plugins: [react()],
  // GitHub Pages раздаёт сайт из подпапки /photoshop-skaytskayt/, Vercel — из корня
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
}));
