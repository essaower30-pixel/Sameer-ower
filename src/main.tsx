import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with auto-update detection and proactive offline caching
if ('serviceWorker' in navigator) {
  // Guard reload so offline sessions are never interrupted or terminated
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (navigator.onLine) {
      console.log('New ServiceWorker controller activated, reloading...');
      window.location.reload();
    }
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED' && navigator.onLine) {
      console.log('SW_UPDATED received, reloading...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates if online
        if (navigator.onLine) {
          reg.update().catch(() => {});
        }

        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === 'installed') {
                if (navigator.serviceWorker.controller && navigator.onLine) {
                  installing.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            };
          }
        };

        // Proactively send all loaded scripts, styles, and resources to the Service Worker for 100% offline persistence
        setTimeout(() => {
          try {
            const controller = navigator.serviceWorker.controller;
            if (!controller) return;

            const urlsToCache = new Set<string>();
            urlsToCache.add(window.location.origin + '/');
            urlsToCache.add(window.location.origin + '/index.html');
            urlsToCache.add(window.location.origin + '/manifest.webmanifest');
            urlsToCache.add(window.location.origin + '/manifest.json');

            // 1. Gather all <script src> and <link rel="stylesheet">
            document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((el) => {
              if (el.src) urlsToCache.add(el.src);
            });
            document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((el) => {
              if (el.href) urlsToCache.add(el.href);
            });

            // 2. Gather from performance entries
            if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
              const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
              for (const entry of entries) {
                if (
                  entry.name &&
                  (entry.name.startsWith(window.location.origin) ||
                    entry.name.includes('fonts.googleapis.com') ||
                    entry.name.includes('fonts.gstatic.com'))
                ) {
                  urlsToCache.add(entry.name);
                }
              }
            }

            controller.postMessage({
              type: 'CACHE_PAGE_RESOURCES',
              urls: Array.from(urlsToCache),
            });
          } catch (e) {
            console.debug('Asset caching trigger info:', e);
          }
        }, 1500);
      })
      .catch((err) => console.debug('ServiceWorker registration info:', err));
  });

  // Re-check for updates whenever user returns to the app tab (only if online)
  window.addEventListener('focus', () => {
    if (navigator.onLine) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update().catch(() => {});
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
