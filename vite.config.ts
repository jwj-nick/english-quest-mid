import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  base: '/english-quest-mid/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,json,mp3}'],
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
      manifest: {
        name: 'English Quest — Mid',
        short_name: 'EngQuest Mid',
        description: '매일 5분, 던전 클리어하며 영어 정복 (중학생용)',
        theme_color: '#0891b2',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/english-quest-mid/',
        start_url: '/english-quest-mid/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
