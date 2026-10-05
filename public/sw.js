const CACHE_NAME = 'workshop-cache-v9';
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

// 1. Install event: Precache static shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (assetUrl) => {
          try {
            const res = await fetch(assetUrl, { cache: 'reload' });
            if (res.ok) {
              await cache.put(assetUrl, res);
            }
          } catch {
            // Silently continue if single file isn't found
          }
        })
      );
    })
  );
});

// 2. Activate event: Clean older caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('workshop-cache-')) {
              return caches.delete(key);
            }
          })
        );
      } catch (err) {
        console.debug('Cache prune error:', err);
      }
      await self.clients.claim();
    })()
  );
});

// 3. Message event: Support manual cache actions
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// 4. Fetch event: Reliable navigation and safe caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // NEVER intercept Vite internal dev bundles, auth bridges or control plane
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('cookie_check') ||
    url.pathname.includes('applet-auth') ||
    url.search.includes('__aistudio')
  ) {
    return;
  }

  // HTML Page Navigation Handling (Opening the app, refreshing, home screen launcher)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // If offline according to navigator, immediately use cached shell
        if (!navigator.onLine) {
          const cached = (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;
        }

        try {
          const fetchPromise = fetch(event.request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 3000)
          );

          const response = await Promise.race([fetchPromise, timeoutPromise]);

          // If redirected to cookie check or auth bridge on external mobile devices, fallback to cached HTML
          if (
            !response ||
            response.status >= 400 ||
            response.url.includes('cookie_check') ||
            response.url.includes('applet-auth')
          ) {
            const cached = (await caches.match(event.request)) || (await caches.match('/'));
            if (cached) return cached;
          }

          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        } catch {
          // Fallback to cache on network failure or offline
          const cached = (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;

          return new Response(
            `<!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>ورشة الألمنيوم</title>
              <style>
                body { font-family: system-ui, sans-serif; text-align: center; padding: 40px 20px; background: #0f172a; color: white; }
                .card { background: #1e293b; max-width: 420px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #334155; }
                button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>نظام ورشة الألمنيوم والديكور</h2>
                <p>يرجى فتح التطبيق مرة واحدة أثناء الاتصال بالإنترنت ليتم حفظ الشاشات بالكامل.</p>
                <button onclick="window.location.reload()">تحديث الصفحة 🔄</button>
              </div>
            </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }
      })()
    );
    return;
  }

  // Static Assets (Scripts, CSS, Fonts, Images)
  event.respondWith(
    (async () => {
      // 1. Check exact cache match
      const cached = await caches.match(event.request);
      if (cached) return cached;

      // 2. Fetch from network
      try {
        const response = await fetch(event.request);
        if (
          response &&
          (response.status === 200 || response.type === 'opaque') &&
          !response.url.includes('cookie_check')
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      } catch {
        // 3. Fallback to cache without search query params
        const fallback = await caches.match(event.request, { ignoreSearch: true });
        if (fallback) return fallback;

        return new Response('', { status: 504, statusText: 'Offline Resource Unavailable' });
      }
    })()
  );
});
