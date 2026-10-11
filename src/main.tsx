import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Build / Modification Version identifier - synced with public/version.json
export const APP_BUILD_VERSION = 'v17-20261011-direct-whatsapp-fix';
const ACTIVE_CACHE_NAME = 'workshop-cache-v17-20261011-direct-whatsapp-fix';

const isDev = import.meta.env.DEV;

if (typeof window !== 'undefined') {
  if (isDev) {
    // In development / preview mode: ensure no Service Worker interferes with HMR or dev server
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
    // Record current build version without triggering any reloads
    try {
      localStorage.setItem('al_fann_build_version', APP_BUILD_VERSION);
    } catch {}
  } else {
    // In production mode: safe background cache cleanup without aggressive auto-reload
    try {
      const savedVersion = localStorage.getItem('al_fann_build_version');
      if (savedVersion !== APP_BUILD_VERSION) {
        localStorage.setItem('al_fann_build_version', APP_BUILD_VERSION);
        if ('caches' in window) {
          caches.keys().then((keys) => {
            return Promise.all(
              keys
                .filter((key) => key !== ACTIVE_CACHE_NAME)
                .map((key) => caches.delete(key))
            );
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.debug('[Cache Manager] Note:', e);
    }

    // Register Service Worker safely for offline PWA capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.debug('ServiceWorker registered:', reg.scope);
            if (navigator.onLine && reg) {
              reg.update().catch(() => {});
            }
          })
          .catch((err) => console.debug('ServiceWorker registration note:', err));

        // Listen for broadcast messages from Service Worker without auto-reloading
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'OLD_CACHE_PURGED') {
            console.debug('[Cache Manager] Old cache purged:', event.data.cacheName);
          }
        });
      });
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
