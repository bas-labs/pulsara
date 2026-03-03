import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pulsara-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pulsara — Eventos Deportivos de México',
        short_name: 'Pulsara',
        description: 'Descubre, inscríbete y vive los mejores eventos deportivos de México.',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'es-MX',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pulsara-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pulsara-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pulsara-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/oauth/],
        runtimeCaching: [
          {
            urlPattern: /\.appsync-api\..*\.amazonaws\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'appsync-api',
              networkTimeoutSeconds: 10,
              expiration: { maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /(?:\.amazoncognito\.com|cognito-idp\.)/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/images\/.*\.jpg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sport-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.s3\..*\.amazonaws\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 's3-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-amplify-core': ['aws-amplify'],
          'vendor-amplify-ui': ['@aws-amplify/ui-react'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
