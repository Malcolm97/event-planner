// Basic service worker for PWA features
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  event.waitUntil(
    caches.open('v1').then((cache) => {
      // You can precache assets here if needed
      // return cache.addAll(['/', '/about']);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // You can intercept fetch requests here to serve cached assets
  // For now, we'll let requests go to the network
  event.respondWith(fetch(event.request));
});
