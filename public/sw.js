const CACHE_NAME = 'workshop-cache-v7';
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
            console.log('Cleaning old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify all open client windows that a new version is active
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME }));
      });
    })
  );
});

// Allow clients to trigger skipWaiting directly
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'CLEAR_CACHE')) {
    self.skipWaiting();
    if (event.data.type === 'CLEAR_CACHE') {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
  }
});

// Fetch event listener: Network-first for navigation, cache-first for static assets
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

  // For HTML navigation: Network-first with instant fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // If response redirects to cookie_check or auth failure (common on external devices),
          // fallback to cached app shell so the app opens immediately!
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

          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
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

  // For static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
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
