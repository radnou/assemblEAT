/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import { installSerwist } from '@serwist/sw';
import { NetworkFirst, ExpirationPlugin } from 'serwist';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: string[] };

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: 'off-api-cache',
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 3600 }),
        ],
      }),
    },
  ],
});
