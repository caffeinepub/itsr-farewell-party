// Service Worker for offline media caching
const CACHE_NAME = 'itsr-media-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isMedia = /\.(mp4|webm|mov|avi|jpg|jpeg|png|gif|webp|heic)$/i.test(url.pathname);
  const isAsset = url.pathname.includes('/assets/') || url.pathname.includes('/uploads/');
  const isCrossOriginMedia = url.hostname !== self.location.hostname && isMedia;
  const shouldCache = isMedia || isAsset || isCrossOriginMedia;

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
