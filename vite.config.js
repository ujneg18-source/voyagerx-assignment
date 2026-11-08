import { defineConfig } from 'vite';

// GitHub Pages(프로젝트 페이지)에서도 경로가 깨지지 않도록 상대 경로로 빌드
export default defineConfig({
  base: './',
  server: { open: true },
});
