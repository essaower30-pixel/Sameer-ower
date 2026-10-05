const CACHE_NAME = 'workshop-cache-v10';
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

// 1. Install event: Skip waiting immediately to activate fresh code
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
            // Silently continue if asset is missing
          }
        })
      );
    })
  );
});

// 2. Activate event: Automatically delete ALL older caches after any modification
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        // Delete EVERY cache that does not match the active current cache
        const deletions = keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.debug('[SW Cache Management] Deleting outdated cache:', key);
            return caches.delete(key);
          });
        await Promise.all(deletions);
      } catch (err) {
        console.debug('[SW Cache Management] Cache prune error:', err);
      }

      // Immediately take control of all open pages/clients
      await self.clients.claim();

      // Notify open clients that old cache was purged and new version is running
      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'OLD_CACHE_PURGED', cacheName: CACHE_NAME });
        }
      } catch {}
    })()
  );
});

// 3. Message event: Support on-demand cache cleanup and manual sync
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear all caches or only outdated ones
  if (event.data.type === 'PURGE_OLD_CACHES' || event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      const targets = event.data.type === 'PURGE_OLD_CACHES'
        ? keys.filter((k) => k !== CACHE_NAME)
        : keys;
      return Promise.all(targets.map((k) => caches.delete(k)));
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, activeCache: CACHE_NAME });
      }
    });
  }

  // Cache specific dynamic resources if requested by app
  if (event.data.type === 'CACHE_PAGE_RESOURCES' && Array.isArray(event.data.urls)) {
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        event.data.urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) await cache.put(url, res);
          } catch {}
        })
      );
    });
  }
});

// 4. Fetch event: Reliable navigation and offline fallback
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
