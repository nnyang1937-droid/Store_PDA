import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/192.png', 'icons/512.png'],
      manifest: {
        name: '바코드 매장 관리',
        short_name: '매장관리',
        start_url: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0284c7',
        lang: 'ko',
        scope: base,
        icons: [
          {
            src: `${base}icons/192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${base}icons/512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${base}icons/512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
