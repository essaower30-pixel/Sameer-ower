import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with auto-update detection and reload
if ('serviceWorker' in navigator) {
  // When a new SW takes control, reload immediately so user gets latest code
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New ServiceWorker controller activated, reloading...');
    window.location.reload();
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      console.log('SW_UPDATED received, reloading...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Force update check on every load
        reg.update().catch(() => {});

        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // A new version has been found and installed!
                  installing.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            };
          }
        };
      })
      .catch((err) => console.debug('ServiceWorker registration info:', err));
  });

  // Re-check for updates whenever user returns to the app tab
  window.addEventListener('focus', () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) reg.update().catch(() => {});
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
