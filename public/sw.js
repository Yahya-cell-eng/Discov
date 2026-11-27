// Service Worker for offline support & PWA installability
const CACHE_NAME = 'skoring-silat-v6-domain';

const ICONS_TO_CACHE = [
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ICONS_TO_CACHE.map((url) => cache.add(url))
      );
    })
  );
});

// Immediately clear any legacy or corrupted cache chunks to prevent React version mismatch
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept cross-origin requests (Google OAuth, Google Drive API, Firebase Auth, Google Fonts)
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  // NEVER intercept or cache development scripts, modules, Vite bundles, HMR, or API calls
  // This guarantees that React and React-DOM always come fresh from the server and never mismatch
  if (
    event.request.method !== 'GET' ||
    url.includes('/api/') ||
    url.includes('/node_modules/') ||
    url.includes('/@') ||
    url.includes('/src/') ||
    url.includes('?v=') ||
    url.includes('.vite') ||
    url.endsWith('.js') ||
    url.endsWith('.ts') ||
    url.endsWith('.tsx') ||
    url.endsWith('.css')
  ) {
    return;
  }

  // For navigation requests: Network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // For static branding icons: Network first, fall back to cached icon
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
