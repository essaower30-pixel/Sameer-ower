import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline capability & Chrome installability
if ('serviceWorker' in navigator) {
  try {
    registerSW({ immediate: true });
  } catch (e) {
    console.debug('Virtual registerSW error, falling back:', e);
  }
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .catch((err) => console.debug('Direct SW registration:', err));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
