// Service worker for La Mancha PWA
// Basic offline support and caching
// DEVELOPMENT MODE: Disabled caching for development

const CACHE_NAME = 'la-mancha-v1';
const DEV_MODE = true; // Set to false for production

const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  if (DEV_MODE) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // In dev mode, always fetch fresh content
  if (DEV_MODE) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
