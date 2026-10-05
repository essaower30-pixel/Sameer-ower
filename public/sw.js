const CACHE_NAME = 'workshop-cache-v6';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.debug('Precache assets notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event listener: Offline-first & auth-resilient navigation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never intercept internal control plane or live OAuth flow requests
  if (
    url.search.includes('__aistudio') ||
    url.pathname.includes('applet-auth-bridge')
  ) {
    return;
  }

  // For HTML navigation (e.g. launching installed app or opening links):
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // If server responded with redirect to cookie_check / auth or server error
          // (common on external devices or standalone WebAPK when not logged in to AI Studio),
          // fallback to the cached app shell so the app opens immediately!
          if (
            !response ||
            response.status >= 400 ||
            response.url.includes('cookie_check') ||
            response.url.includes('applet-auth') ||
            response.url.includes('__aistudio')
          ) {
            const cached = (await caches.match(event.request)) || (await caches.match('/'));
            if (cached) return cached;
          }

          // Otherwise update cached app shell with clean response
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cached = (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('تطبيق ورشة الألمنيوم أوفلاين', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // For static assets (scripts, styles, icons, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          // Cache successful responses for subsequent offline/standalone launches
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(async () => {
          const fallback = await caches.match(event.request);
          if (fallback) return fallback;
          return new Response('', { status: 504, statusText: 'Resource not available' });
        });
    })
  );
});
