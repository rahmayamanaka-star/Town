import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  plugins: [react(), {
    name: 'town-deployment-url',
    transformIndexHtml(html) {
      const url = process.env.SITE_URL;
      if (!url) return html;
      const canonical = new URL(url).href.replace(/\/?$/, '/');
      return html.replaceAll('https://town-made-by-hand-nov17.guoguo186.chatgpt.site/', canonical);
    },
  }],
  build: { target: 'es2022', rolldownOptions: { output: { manualChunks(id) {
    if (id.includes('/node_modules/three/')) return 'three';
    if (id.includes('/node_modules/gsap/') || id.includes('/node_modules/lenis/')) return 'motion';
  } } } },
});
