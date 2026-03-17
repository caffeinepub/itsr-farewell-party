// Service Worker for offline media caching — pre-caches ALL media on first online load
const CACHE_NAME = 'itsr-media-v2';

// Pre-cache a list of URLs sent from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urls) {
        try {
          const already = await cache.match(url);
          if (!already) {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          }
        } catch {
          // Network unavailable — skip silently
        }
      }
    });
  }
});

// Serve from cache first for media/asset requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isMedia = /\.(mp4|webm|mov|avi|jpg|jpeg|png|gif|webp|heic)$/i.test(url.pathname);
  const isAsset = url.pathname.includes('/assets/') || url.pathname.includes('/uploads/');
  const isBlobStorage = url.pathname.includes('/v1/blob/');
  const shouldCache = isMedia || isAsset || isBlobStorage;

  if (shouldCache) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
  }
});

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});
