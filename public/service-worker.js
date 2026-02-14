// Dynamic versioning based on build timestamp
const BUILD_TIMESTAMP = '20260214'; // Update this when deploying new versions
const APP_VERSION = '10.0.1';

const CACHE_NAME = `event-planner-cache-v${BUILD_TIMESTAMP}`;
const STATIC_CACHE = `event-planner-static-v${BUILD_TIMESTAMP}`;
const DYNAMIC_CACHE = `event-planner-dynamic-v${BUILD_TIMESTAMP}`;
const API_CACHE = `event-planner-api-v${BUILD_TIMESTAMP}`;
const PAGES_CACHE = `event-planner-pages-v${BUILD_TIMESTAMP}`;
const APP_SHELL_CACHE = `event-planner-app-shell-v${BUILD_TIMESTAMP}`;

// Update check interval (in milliseconds) - check every 5 minutes
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

// Cache size limits for better performance
const CACHE_LIMITS = {
  [STATIC_CACHE]: 150,
  [DYNAMIC_CACHE]: 75,
  [API_CACHE]: 50,
  [PAGES_CACHE]: 15,
  [APP_SHELL_CACHE]: 25
};

// Core static assets to cache immediately - only critical ones
const urlsToCache = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
];

// Cache expiration times (in milliseconds) - REDUCED for fresher content
const CACHE_EXPIRATION = {
  API: 60 * 1000,           // 1 minute for API responses (reduced from 5 min)
  PAGES: 5 * 60 * 1000,     // 5 minutes for pages (reduced from 15 min)
  STATIC: 24 * 60 * 60 * 1000, // 24 hours for static assets
  DYNAMIC: 30 * 60 * 1000   // 30 minutes for dynamic content (reduced from 1 hour)
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  // Skip waiting to activate immediately for PWA users
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache.filter(url => !url.includes('**')));
        }),
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

  // Handle navigation requests (Next.js routes) - NETWORK FIRST for freshness
  if (request.mode === 'navigate') {
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
      // NETWORK FIRST for pages - always try network, fallback to cache
      event.respondWith(
        fetch(request)
          .then(response => {
            // Clone and cache the fresh response
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(PAGES_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return caches.match(request, { cacheName: PAGES_CACHE })
              .then(cachedResponse => {
                if (cachedResponse) {
                  console.log(`Serving cached offline page: ${request.url}`);
                  return cachedResponse;
                }
                // Return offline page if nothing in cache
                return caches.match('/offline.html');
              });
          })
      );
    } else {
      // For pages that require internet: network first, custom offline message
      event.respondWith(
        fetch(request)
          .then(response => {
            return response;
          })
          .catch(() => {
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

  // Handle API requests - NETWORK FIRST for freshness
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            cacheWithMetadata(API_CACHE, request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request, { cacheName: API_CACHE });
        })
    );
    return;
  }

  // Handle static assets with hashed filenames (immutable) - CACHE FIRST
  // These include Next.js build artifacts with content hashes
  if (
    url.pathname.startsWith('/_next/static/') && 
    (url.pathname.includes('.js') || url.pathname.includes('.css')) &&
    (url.pathname.includes('_next/static/chunks/') || url.pathname.includes('_next/static/css/'))
  ) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          // Not in cache, fetch and cache
          return fetch(request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Handle other static assets (images, fonts, etc.) - NETWORK FIRST with cache fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
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
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
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

// Periodic caching mechanism - triggered by messages from main thread
async function cacheDataPeriodically(isPWA = false) {
  try {
    console.log('Starting periodic cache update...');

    if (isPWA) {
      console.log('PWA mode detected - using lighter caching strategy');
      await cacheEssentialDataOnly();
    } else {
      await cacheApiData();
      await cachePages();
      await cacheModalData();
    }

    console.log('Periodic cache update completed');
  } catch (error) {
    console.error('Periodic cache update failed:', error);
  }
}

// Lighter caching for PWA mode
async function cacheEssentialDataOnly() {
  const essentialUrls = [
    '/api/events?limit=20',
    '/api/users?limit=10'
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
    '/api/events?limit=50',
    '/api/users?limit=50'
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
      const cachedResponse = await cache.match(url);
      const now = Date.now();

      if (!cachedResponse || !cachedResponse.headers.get('sw-cache-time') ||
          (now - parseInt(cachedResponse.headers.get('sw-cache-time'))) > 300000) {

        const response = await fetch(url);
        if (response.ok) {
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
    const eventsResponse = await fetch('/api/events?limit=20');
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();

      for (const event of events) {
        try {
          const eventDetailResponse = await fetch(`/api/events/${event.id}`);
          if (eventDetailResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(`/api/events/${event.id}`, eventDetailResponse);
          }
        } catch (error) {
          console.warn(`Failed to cache event ${event.id}:`, error);
        }
      }
    }

    const creatorsResponse = await fetch('/api/users?limit=20');
    if (creatorsResponse.ok) {
      const creators = await creatorsResponse.json();

      for (const creator of creators) {
        try {
          const creatorDetailResponse = await fetch(`/api/users/${creator.id}`);
          if (creatorDetailResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(`/api/users/${creator.id}`, creatorDetailResponse);
          }
        } catch (error) {
          console.warn(`Failed to cache creator ${creator.id}:`, error);
        }
      }
    }

    try {
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put('/api/categories', categoriesResponse);
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

  // Notify all clients about the update
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
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

  console.log(`Service worker activated v${APP_VERSION}`);

  // Notify all clients that update is ready
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: APP_VERSION,
        buildTimestamp: BUILD_TIMESTAMP
      });
    });
  });

  registerBackgroundSync();
  startPeriodicUpdateCheck();
});

// Start periodic update checking
let updateCheckInterval = null;

function startPeriodicUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  // Check for updates periodically
  updateCheckInterval = setInterval(async () => {
    try {
      console.log('Checking for service worker updates...');
      const registration = await self.registration.update();
      
      if (registration.installing) {
        console.log('New service worker installing...');
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker ready');
            // Notify clients about the update
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'SW_UPDATE_AVAILABLE',
                  version: APP_VERSION,
                  buildTimestamp: BUILD_TIMESTAMP
                });
              });
            });
          }
        });
      }
    } catch (error) {
      console.warn('Update check failed:', error);
    }
  }, UPDATE_CHECK_INTERVAL);
  
  console.log(`Periodic update check started (every ${UPDATE_CHECK_INTERVAL / 60000} minutes)`);
}

async function registerBackgroundSync() {
  console.log('Background sync ready');
}

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
    try {
      data = event.data.json();
      console.log('Parsed JSON push data:', data);
    } catch (jsonError) {
      console.warn('Failed to parse JSON push data:', jsonError);
      try {
        const textData = event.data.text();
        console.log('Push data as text:', textData);
        if (textData && textData.startsWith('{')) {
          data = JSON.parse(textData);
        } else {
          data = { body: textData || 'New event update available!' };
        }
      } catch (textError) {
        console.error('Failed to parse push data as text:', textError);
        data = { body: 'New event update available!' };
      }
    }
  }

  const userAgent = self.navigator?.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  const eventId = data.eventId || data.data?.eventId || null;
  const url = data.url || data.data?.url || '/';
  
  const options = {
    body: data.body || 'New event update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: url,
      eventId: eventId,
      platform: isIOS ? 'ios' : isAndroid ? 'android' : 'other'
    },
    actions: [
      { action: 'view', title: 'View Event' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'event-notification',
    timeout: 5000,
    renotify: true,
    requireInteraction: isIOS,
    silent: false,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PNG Events', options)
  );
});

// Cache management utilities
async function enforceCacheLimit(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxEntries) {
      const entriesToDelete = keys
        .sort((a, b) => {
          const timeA = parseInt(a.headers.get('sw-cache-time') || '0');
          const timeB = parseInt(b.headers.get('sw-cache-time') || '0');
          return timeA - timeB;
        })
        .slice(0, keys.length - maxEntries);

      await Promise.all(entriesToDelete.map(key => cache.delete(key)));
      console.log(`Cleaned up ${entriesToDelete.length} entries from ${cacheName}`);
    }
  } catch (error) {
    console.warn(`Failed to enforce cache limit for ${cacheName}:`, error);
  }
}

async function cleanupExpiredCache(cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();
    let deletedCount = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0');
        if (now - cacheTime > maxAge) {
          await cache.delete(request);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired entries from ${cacheName}`);
    }
  } catch (error) {
    console.warn(`Failed to cleanup expired cache for ${cacheName}:`, error);
  }
}

async function cacheWithMetadata(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    const responseClone = response.clone();

    const newResponse = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: {
        ...Object.fromEntries(responseClone.headers.entries()),
        'sw-cache-time': Date.now().toString(),
        'sw-cache-version': 'v10'
      }
    });

    await cache.put(request, newResponse);

    const limit = CACHE_LIMITS[cacheName];
    if (limit) {
      await enforceCacheLimit(cacheName, limit);
    }

    const expiration = getCacheExpiration(cacheName);
    if (expiration) {
      await cleanupExpiredCache(cacheName, expiration);
    }

  } catch (error) {
    console.warn(`Failed to cache with metadata for ${cacheName}:`, error);
  }
}

function getCacheExpiration(cacheName) {
  switch (cacheName) {
    case API_CACHE: return CACHE_EXPIRATION.API;
    case PAGES_CACHE: return CACHE_EXPIRATION.PAGES;
    case STATIC_CACHE: return CACHE_EXPIRATION.STATIC;
    case DYNAMIC_CACHE: return CACHE_EXPIRATION.DYNAMIC;
    default: return null;
  }
}

async function performCacheMaintenance() {
  console.log('Performing cache maintenance...');

  try {
    const cacheNames = Object.values({ CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, PAGES_CACHE, APP_SHELL_CACHE });

    for (const cacheName of cacheNames) {
      const limit = CACHE_LIMITS[cacheName];
      if (limit) {
        await enforceCacheLimit(cacheName, limit);
      }

      const expiration = getCacheExpiration(cacheName);
      if (expiration) {
        await cleanupExpiredCache(cacheName, expiration);
      }
    }

    console.log('Cache maintenance completed');
  } catch (error) {
    console.warn('Cache maintenance failed:', error);
  }
}

// Handle PWA install and update events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: APP_VERSION,
      buildTimestamp: BUILD_TIMESTAMP
    });
  }

  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    // Trigger update check by getting the latest version
    event.waitUntil(
      self.registration.update().then(() => {
        event.ports[0].postMessage({ 
          updateAvailable: false,
          version: APP_VERSION,
          buildTimestamp: BUILD_TIMESTAMP
        });
      }).catch((error) => {
        event.ports[0].postMessage({ 
          updateAvailable: false,
          error: error.message
        });
      })
    );
  }

  if (event.data && event.data.type === 'TRIGGER_CACHE_UPDATE') {
    event.waitUntil(
      cacheDataPeriodically(event.data.isPWA || false).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Cache update failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAME),
        caches.delete(STATIC_CACHE),
        caches.delete(DYNAMIC_CACHE),
        caches.delete(API_CACHE),
        caches.delete(PAGES_CACHE),
        caches.delete(APP_SHELL_CACHE)
      ]).then(() => {
        console.log('All caches cleared');
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Failed to clear caches:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_MAINTENANCE') {
    event.waitUntil(
      performCacheMaintenance().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Cache maintenance failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const eventId = event.notification.data?.eventId;
  const url = event.notification.data?.url || '/';

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log(`Found ${clientList.length} open clients`);
        
        for (let client of clientList) {
          const clientUrl = new URL(client.url);
          const clientPathname = clientUrl.pathname;
          const isAppWindow = 
            clientUrl.origin === new URL(url, self.location.href).origin ||
            clientPathname === '/' || 
            clientPathname.startsWith('/?') ||
            clientUrl.hostname === 'localhost' ||
            clientUrl.hostname === '127.0.0.1';
          
          if (isAppWindow) {
            console.log('Found existing app window:', client.url);
            client.focus();
            
            if (eventId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                eventId: eventId,
                url: url
              });
            }
            return client;
          }
        }

        console.log('No existing window found, opening new one:', url);
        if (clients.openWindow) {
          return clients.openWindow(url).then((client) => {
            if (client && eventId) {
              setTimeout(() => {
                client.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  eventId: eventId,
                  url: url
                });
              }, 1000);
            }
            return client;
          });
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data?.eventId);
});
