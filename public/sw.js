const CACHE_NAME = 'workshop-cache-v8';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Helper: safe cache put
async function safeCachePut(cacheName, request, response) {
  try {
    if (!response || (response.status !== 200 && response.type !== 'opaque')) {
      return;
    }
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch (err) {
    // Ignore cache put errors for cross-origin or unsupported schemes
  }
}

// Helper: match across all caches with search param tolerance
async function matchAnywhere(request) {
  // 1. Exact match in current cache
  let res = await caches.match(request);
  if (res) return res;

  // 2. Ignore search params match (e.g. Vite ?v=... or ?t=...)
  res = await caches.match(request, { ignoreSearch: true });
  if (res) return res;

  // 3. Match across any other active cache
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const found = (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
    if (found) return found;
  }

  // 4. Try matching URL pathname alone
  try {
    const url = new URL(request.url || request, location.origin);
    res = await caches.match(url.pathname);
    if (res) return res;
  } catch {
    // ignore URL parsing error
  }

  return null;
}

// 1. Install event: Precache core shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache each item individually so a single missing file doesn't fail the whole install
      await Promise.allSettled(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Silently continue if individual dev asset isn't present
          }
        })
      );
    })
  );
});

// 2. Activate event: Claim clients immediately and clean older caches safely
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Only delete outdated versions if we are online or have confirmed the new cache
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
        console.debug('Cache cleanup notice:', err);
      }
      await self.clients.claim();
    })()
  );
});

// 3. Message event: Handle caching requests and skip waiting
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Proactive caching of all live page assets sent from main.tsx
  if (event.data.type === 'CACHE_PAGE_RESOURCES' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(
          event.data.urls.map(async (url) => {
            try {
              if (typeof url !== 'string' || !url.startsWith('http')) return;
              const u = new URL(url);
              // Skip auth bridge and dev control plane
              if (u.pathname.includes('cookie_check') || u.pathname.includes('applet-auth') || u.search.includes('__aistudio')) {
                return;
              }
              const existing = await cache.match(url);
              if (!existing) {
                const response = await fetch(url, { mode: 'cors', credentials: 'omit' }).catch(() => null);
                if (response && (response.ok || response.type === 'opaque')) {
                  await cache.put(url, response);
                }
              }
            } catch {
              // Ignore individual asset cache failure
            }
          })
        );
      })()
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// 4. Fetch event: Stale-While-Revalidate and offline resilience
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never intercept control plane or internal OAuth bridge
  if (url.search.includes('__aistudio') || url.pathname.includes('applet-auth-bridge')) {
    return;
  }

  // HTML Navigation Handling (Opening the app, refreshing, home screen launcher)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Fast path: if completely offline according to navigator, return cached shell instantly
        if (!navigator.onLine) {
          const offlineCached = (await matchAnywhere(event.request)) || (await matchAnywhere('/')) || (await matchAnywhere('/index.html'));
          if (offlineCached) return offlineCached;
        }

        try {
          // Attempt network fetch with a 2.5s timeout to prevent hanging on slow or captive portals
          const fetchPromise = fetch(event.request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          );

          const response = await Promise.race([fetchPromise, timeoutPromise]);

          // Detect AI Studio cookie-check redirects or auth errors on external mobile devices
          if (
            !response ||
            response.status >= 400 ||
            response.url.includes('cookie_check') ||
            response.url.includes('applet-auth') ||
            response.url.includes('__aistudio')
          ) {
            const cachedShell = (await matchAnywhere(event.request)) || (await matchAnywhere('/')) || (await matchAnywhere('/index.html'));
            if (cachedShell) return cachedShell;
          }

          if (response && response.status === 200) {
            safeCachePut(CACHE_NAME, event.request, response);
            safeCachePut(CACHE_NAME, '/', response);
          }
          return response;
        } catch (fetchErr) {
          // Network failed or offline: ALWAYS fallback to the cached app shell
          const cached =
            (await matchAnywhere(event.request)) ||
            (await matchAnywhere('/')) ||
            (await matchAnywhere('/index.html'));

          if (cached) return cached;

          // Ultimate offline fallback HTML
          return new Response(
            `<!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>ورشة الألمنيوم - أوفلاين</title>
              <style>
                body { font-family: system-ui, sans-serif; text-align: center; padding: 40px 20px; background: #0f172a; color: white; }
                .card { background: #1e293b; max-width: 420px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #334155; }
                button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>ورشة الألمنيوم والديكور</h2>
                <p>أنت حالياً في وضع عدم الاتصال (أوفلاين). يرجى فتح التطبيق مرة واحدة أثناء الاتصال بالإنترنت ليتم تحميل كل الواجهات تلقائياً.</p>
                <button onclick="window.location.reload()">إعادة المحاولة 🔄</button>
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

  // Static Assets (Scripts, Styles, Fonts, Images)
  event.respondWith(
    (async () => {
      // 1. Check if asset is already cached
      const cachedResponse = await matchAnywhere(event.request);
      if (cachedResponse) {
        // Stale-while-revalidate in background if online
        if (navigator.onLine) {
          fetch(event.request)
            .then((freshRes) => {
              if (freshRes && (freshRes.status === 200 || freshRes.type === 'opaque')) {
                safeCachePut(CACHE_NAME, event.request, freshRes);
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      // 2. If not cached, fetch from network
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          safeCachePut(CACHE_NAME, event.request, networkResponse);
        }
        return networkResponse;
      } catch (err) {
        // 3. Network failed: Offline fallback
        const fallback = await matchAnywhere(event.request);
        if (fallback) return fallback;

        // Fallbacks by content type to avoid script errors
        const pathname = url.pathname.toLowerCase();
        if (pathname.endsWith('.css')) {
          return new Response('/* offline fallback css */', {
            status: 200,
            headers: { 'Content-Type': 'text/css; charset=utf-8' }
          });
        }
        if (pathname.endsWith('.js') || pathname.endsWith('.tsx') || pathname.endsWith('.ts')) {
          return new Response('export default {};', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
          });
        }

        return new Response('', { status: 504, statusText: 'Offline Resource Unavailable' });
      }
    })()
  );
});
