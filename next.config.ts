import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'off-api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
      },
    },
    {
      urlPattern: /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
