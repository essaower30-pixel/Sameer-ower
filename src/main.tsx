import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Build / Modification Version identifier
export const APP_BUILD_VERSION = 'workshop-v12-20261006';
const ACTIVE_CACHE_NAME = 'workshop-cache-v12-20261006';

// 1. Automatic Old Cache Purge Mechanism after any modification / deployment
if (typeof window !== 'undefined') {
  try {
    const savedVersion = localStorage.getItem('al_fann_build_version');
    if (savedVersion !== APP_BUILD_VERSION) {
      console.log(`[Cache Manager] New modification detected (${savedVersion || 'initial'} -> ${APP_BUILD_VERSION}). Purging outdated caches...`);
      if ('caches' in window) {
        caches.keys().then((keys) => {
          return Promise.all(
            keys
              .filter((key) => key !== ACTIVE_CACHE_NAME)
              .map((key) => {
                console.log('[Cache Manager] Deleted legacy cache:', key);
                return caches.delete(key);
              })
          );
        }).catch((err) => {
          console.debug('[Cache Manager] Cache cleanup note:', err);
        });
      }
      localStorage.setItem('al_fann_build_version', APP_BUILD_VERSION);
    }
  } catch (e) {
    console.debug('[Cache Manager] Storage read note:', e);
  }
}

// 2. Register Service Worker with active update checking
if ('serviceWorker' in navigator) {
  // Automatically reload when a new service worker takes control so updates appear instantly
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.debug('ServiceWorker active scope:', reg.scope);
        // Promptly check for updates on each load so changes take effect immediately
        if (navigator.onLine && reg) {
          reg.update().catch(() => {});
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => console.debug('ServiceWorker registration info:', err));

    // Listen for broadcast messages from Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'OLD_CACHE_PURGED') {
        console.log('[Cache Manager] Service Worker confirmed old caches purged. Current cache:', event.data.cacheName);
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
