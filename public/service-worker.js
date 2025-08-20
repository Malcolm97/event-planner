// Basic service worker for PWA features
const CACHE_NAME = 'v1';
const CACHE_URLS = [
  '/', // Cache the root page
  '/events', // Cache the events page
  // Add other critical assets or pages that should be available offline
];

// Install event: precache essential assets
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(CACHE_URLS);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: intercept requests and serve from cache or network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Cache API requests for events
  if (requestUrl.pathname.startsWith('/api/events') || requestUrl.pathname.startsWith('/events')) { // Adjust path if your API endpoint is different
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // If found in cache, return it
          if (cachedResponse) {
            console.log('Serving from cache:', event.request.url);
            return cachedResponse;
          }

          // If not in cache, fetch from network
          console.log('Fetching from network:', event.request.url);
          return fetch(event.request).then((networkResponse) => {
            // Cache the response for future use
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
              console.log('Cached network response:', event.request.url);
            }
            return networkResponse;
          });
        });
      }).catch(error => {
        console.error('Fetch failed:', error);
        // Fallback to a network response if cache fails, or a custom offline page
        return fetch(event.request);
      })
    );
  } else {
    // For other requests (like HTML, CSS, JS), serve from cache if available, otherwise fetch from network
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});

// Function to update last saved timestamp (this would be called from your app logic)
// For example, when data is successfully fetched and cached.
// This part needs to be triggered by your application's data fetching logic.
// You might send a message to the service worker or use a shared storage mechanism.
// For simplicity, we'll assume the app handles updating a display element.
// If you need the service worker to manage this, you'd need a postMessage mechanism.

// Example of how you might trigger this from your app:
// if (navigator.serviceWorker.controller) {
//   navigator.serviceWorker.controller.postMessage({
//     type: 'UPDATE_LAST_SAVED',
//     timestamp: new Date().toISOString()
//   });
// }

// You might also want to listen for messages from the service worker
// self.addEventListener('message', event => {
//   if (event.data.type === 'GET_LAST_SAVED') {
//     // Logic to retrieve and send last saved timestamp
//   }
// });
