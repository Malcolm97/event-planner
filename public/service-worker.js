const CACHE_NAME = 'event-planner-cache-v8';
const STATIC_CACHE = 'event-planner-static-v8';
const DYNAMIC_CACHE = 'event-planner-dynamic-v8';
const API_CACHE = 'event-planner-api-v8';
const PAGES_CACHE = 'event-planner-pages-v8';
const APP_SHELL_CACHE = 'event-planner-app-shell-v8';

// Core static assets to cache immediately
const urlsToCache = [
  '/offline.html',
  '/globals.css',
  '/manifest.json',

  // Critical icons for PWA
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
];

// Additional assets to cache when possible
const additionalAssets = [
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  // Skip waiting to activate immediately for PWA users
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache.filter(url => !url.includes('**')));
        }),

      // Cache app shell for PWA users
      cacheAppShell()
    ])
    .catch((error) => {
      console.error('Cache installation failed:', error);
    })
  );
});

// Cache app shell components for PWA
async function cacheAppShell() {
  const appShellUrls = [
    '/',
    '/_next/static/css/app/layout.css',
    '/_next/static/chunks/webpack.js',
    '/manifest.json'
  ];

  try {
    const cache = await caches.open(APP_SHELL_CACHE);
    console.log('Caching app shell...');

    for (const url of appShellUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`Cached app shell: ${url}`);
        }
      } catch (error) {
        console.warn(`Failed to cache app shell: ${url}`, error);
      }
    }
  } catch (error) {
    console.error('App shell caching failed:', error);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (Next.js routes)
  if (request.mode === 'navigate') {
    // Define pages that are available offline
    const offlinePages = [
      '/',
      '/events',
      '/categories',
      '/creators',
      '/about',
      '/settings',
      '/terms',
      '/privacy',
      '/download'
    ];

    const isOfflinePage = offlinePages.some(page => url.pathname === page);

    if (isOfflinePage) {
      // For offline pages: try cache first, then network
      event.respondWith(
        caches.match(request, { cacheName: PAGES_CACHE })
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log(`Serving cached offline page: ${request.url}`);
              // Also try to update cache in background
              fetch(request).then(response => {
                if (response.ok) {
                  const responseClone = response.clone();
                  caches.open(PAGES_CACHE).then(cache => {
                    cache.put(request, responseClone);
                  });
                }
              }).catch(() => {
                // Silently fail background update
              });
              return cachedResponse;
            }

            // Not in cache, try network
            return fetch(request).then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(PAGES_CACHE).then(cache => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
          })
      );
    } else {
      // For pages that require internet: network first, custom offline message
      event.respondWith(
        fetch(request)
          .then(response => {
            // Don't cache these pages
            return response;
          })
          .catch(() => {
            // Return custom offline page for non-offline pages
            const offlineMessage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Internet Required - PNG Events</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        min-height: 100vh;
                        background: linear-gradient(to bottom right, #FCD34D, #EF4444, #DC2626);
                        color: #111827;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                        padding: 2rem;
                        text-align: center;
                    }
                    .message {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                    }
                    h1 {
                        font-size: 1.5rem;
                        margin-bottom: 1rem;
                        color: #111827;
                    }
                    p {
                        color: #6B7280;
                        margin-bottom: 1.5rem;
                    }
                    .retry-button {
                        display: inline-block;
                        padding: 0.75rem 1.5rem;
                        background: #FCD34D;
                        color: #111827;
                        text-decoration: none;
                        border-radius: 0.5rem;
                        font-weight: 600;
                    }
                    .retry-button:hover {
                        background: #FBBF24;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1>Internet Connection Required</h1>
                    <p>This page requires an internet connection to function properly. Please check your connection and try again.</p>
                    <a href="/" class="retry-button">Go to Homepage</a>
                </div>
            </body>
            </html>
            `;
            return new Response(offlineMessage, {
              headers: { 'Content-Type': 'text/html' }
            });
          })
      );
    }
    return;
  }

  // Handle API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets (CSS, JS, images) - Cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response; // Return cached version
          }
          // Fetch and cache
          return fetch(request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for other assets
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});



// Periodic caching mechanism - runs every 5 minutes for better performance
let periodicCacheInterval;

async function cacheDataPeriodically() {
  try {
    console.log('Starting periodic cache update...');

    // Only cache if we're online and not in PWA mode (to avoid conflicts)
    if (!navigator.onLine) {
      console.log('Skipping periodic cache update - offline');
      return;
    }

    // Check if we're in PWA mode - reduce caching frequency for PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;

    if (isPWA) {
      console.log('PWA mode detected - using lighter caching strategy');
      // In PWA mode, only cache essential data and less frequently
      await cacheEssentialDataOnly();
    } else {
      // Browser mode - full caching
      await cacheApiData();
      await cachePages();
      await cacheModalData();
    }

    console.log('Periodic cache update completed');
  } catch (error) {
    console.error('Periodic cache update failed:', error);
  }
}

// Lighter caching for PWA mode to avoid conflicts with app data loading
async function cacheEssentialDataOnly() {
  const essentialUrls = [
    '/api/events?limit=20', // Only recent events for PWA
    '/api/users?limit=10'   // Only recent users for PWA
  ];

  for (const url of essentialUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(url, response);
        console.log(`Cached essential data: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to cache essential data: ${url}`, error);
    }
  }
}

async function cacheApiData() {
  const apiUrls = [
    '/api/events',
    '/api/events?limit=50', // Recent events
    '/api/users?limit=50'   // Recent users
  ];

  for (const url of apiUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(url, response);
        console.log(`Cached API data: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to cache API data: ${url}`, error);
    }
  }
}

async function cachePages() {
  // Only cache these specific pages for offline access
  const offlinePages = [
    '/',
    '/events',
    '/categories',
    '/creators',
    '/about',
    '/settings',
    '/terms',
    '/privacy',
    '/download'
  ];

  const cache = await caches.open(PAGES_CACHE);

  for (const url of offlinePages) {
    try {
      // Only cache if not already cached or if cache is stale
      const cachedResponse = await cache.match(url);
      const now = Date.now();

      if (!cachedResponse || !cachedResponse.headers.get('sw-cache-time') ||
          (now - parseInt(cachedResponse.headers.get('sw-cache-time'))) > 300000) { // 5 minutes

        const response = await fetch(url);
        if (response.ok) {
          // Clone the response and add cache timestamp
          const responseClone = response.clone();
          const newResponse = new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: {
              ...Object.fromEntries(responseClone.headers.entries()),
              'sw-cache-time': now.toString()
            }
          });

          await cache.put(url, newResponse);
          console.log(`Cached offline page: ${url}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to cache offline page: ${url}`, error);
    }
  }
}

async function cacheModalData() {
  try {
    // Cache recent events for modals
    const eventsResponse = await fetch('/api/events?limit=20');
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();

      // Cache individual event details that might be shown in modals
      for (const event of events) {
        try {
          const eventDetailResponse = await fetch(`/api/events/${event.id}`);
          if (eventDetailResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(`/api/events/${event.id}`, eventDetailResponse);
            console.log(`Cached event modal data: ${event.id}`);
          }
        } catch (error) {
          console.warn(`Failed to cache event ${event.id}:`, error);
        }
      }
    }

    // Cache creators for offline use (remove unsupported role parameter)
    const creatorsResponse = await fetch('/api/users?limit=20');
    if (creatorsResponse.ok) {
      const creators = await creatorsResponse.json();

      for (const creator of creators) {
        try {
          const creatorDetailResponse = await fetch(`/api/users/${creator.id}`);
          if (creatorDetailResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(`/api/users/${creator.id}`, creatorDetailResponse);
            console.log(`Cached creator modal data: ${creator.id}`);
          }
        } catch (error) {
          console.warn(`Failed to cache creator ${creator.id}:`, error);
        }
      }
    }

    // Cache categories for offline use
    try {
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put('/api/categories', categoriesResponse);
        console.log('Cached categories data');
      }
    } catch (error) {
      console.warn('Failed to cache categories:', error);
    }
  } catch (error) {
    console.warn('Failed to cache modal data:', error);
  }
}

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  // Take control of all clients immediately for PWA
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Keep only current version caches
            if (![CACHE_NAME, PAGES_CACHE, APP_SHELL_CACHE, API_CACHE, STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim()
    ])
  );

  console.log('Service worker activated, starting periodic caching...');

  // Clear any existing interval
  if (periodicCacheInterval) {
    clearInterval(periodicCacheInterval);
  }

  // Start periodic caching every 5 minutes (300000ms) for better performance
  periodicCacheInterval = setInterval(cacheDataPeriodically, 300000);

  // Also run immediately
  cacheDataPeriodically();

  // Register background sync for PWA users
  registerBackgroundSync();
});

// Register background sync for periodic updates when PWA is installed
async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-cache-sync');
      console.log('Background sync registered for PWA');
    } catch (error) {
      console.warn('Background sync registration failed:', error);
    }
  }
}

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-cache-sync') {
    event.waitUntil(cacheDataPeriodically());
  }
});

// Push notification support for PWA users
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'New event update available!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: data.data?.url || data.url || '/',
      eventId: data.data?.eventId || null
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Event',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PNG Events', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab with the target URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle PWA install and update events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '8.0.0' });
  }
});
