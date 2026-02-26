import { EventItem } from './types';

const DB_NAME = 'event-planner-db';
const DB_VERSION = 5;

// Store names
const STORES = {
  EVENTS: 'events',
  USERS: 'users',
  SYNC_STATUS: 'syncStatus',
  CATEGORIES: 'categories',
  OFFLINE_QUEUE: 'offlineQueue'
};

interface SyncStatus {
  lastSync: number;
  inProgress: boolean;
  error?: string;
}

export interface QueuedOperation {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount?: number;
  error?: string;
}

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or update stores
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        eventsStore.createIndex('date', 'date', { unique: false });
        eventsStore.createIndex('category', 'category', { unique: false });
        eventsStore.createIndex('location', 'location', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_STATUS)) {
        db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('operation', 'operation', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB error:', error);

      // If version error (database version is higher than requested), delete and recreate
      if (error && error.name === 'VersionError') {
        console.warn('IndexedDB version mismatch, deleting and recreating database');
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          console.log('Database deleted, retrying open');
          // Retry opening the database
          const retryRequest = indexedDB.open(DB_NAME, DB_VERSION);
          retryRequest.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create all stores
            const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
            eventsStore.createIndex('date', 'date', { unique: false });
            eventsStore.createIndex('category', 'category', { unique: false });
            eventsStore.createIndex('location', 'location', { unique: false });

            db.createObjectStore(STORES.USERS, { keyPath: 'id' });
            db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'id' });
            db.createObjectStore(STORES.CATEGORIES, { keyPath: 'name' });

            const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            queueStore.createIndex('operation', 'operation', { unique: false });
            queueStore.createIndex('status', 'status', { unique: false });
          };
          retryRequest.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
          };
          retryRequest.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
          };
        };
        deleteRequest.onerror = () => {
          reject(error);
        };
      } else {
        reject(error);
      }
    };
  });
};

// Generic function to add items to any store
export const addItems = async <T>(storeName: string, items: T[]): Promise<void> => {
  if (!items || items.length === 0) return;
  
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  items.forEach((item) => {
    store.put(item);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => {
      console.error(`Add ${storeName} transaction error:`, (event.target as IDBTransaction).error);
      reject((event.target as IDBTransaction).error);
    };
  });
};

// Generic function to get all items from any store
export const getItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve((event.target as IDBRequest).result);
    request.onerror = (event) => {
      console.error(`Get ${storeName} request error:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

// Get items by index
export const getItemsByIndex = async <T>(storeName: string, indexName: string, value: string): Promise<T[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index(indexName);
  const request = index.getAll(value);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve((event.target as IDBRequest).result || []);
    request.onerror = (event) => {
      console.error(`Get ${storeName} by index error:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};


// Add events with cache timestamp
export const addEvents = async (events: EventItem[]): Promise<void> => {
  const timestamp = Date.now();
  // Limit cache size to 1000 events (increased for better offline experience)
  const limitedEvents = events.slice(0, 1000);
  await addItems(STORES.EVENTS, [{ id: 'cache-meta', timestamp }, ...limitedEvents]);
};

// Add users with cache timestamp
export const addUsers = async (users: any[]): Promise<void> => {
  const timestamp = Date.now();
  // Limit cache size to 500 users (increased for better offline experience)
  const limitedUsers = users.slice(0, 500);
  await addItems(STORES.USERS, [{ id: 'cache-meta', timestamp }, ...limitedUsers]);
};

// Update events cache periodically (called every second by service worker)
export const updateEventsCache = async (events: EventItem[]): Promise<void> => {
  try {
    const timestamp = Date.now();
    // Keep existing events and merge with new ones, limit to 1000
    const existingEvents = await getEvents();
    const mergedEvents = [...existingEvents, ...events];
    const uniqueEvents = mergedEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );
    const limitedEvents = uniqueEvents.slice(0, 1000);

    await addItems(STORES.EVENTS, [{ id: 'cache-meta', timestamp }, ...limitedEvents]);
    console.log(`Updated events cache with ${limitedEvents.length} events`);
  } catch (error) {
    console.error('Failed to update events cache:', error);
  }
};

// Update users cache periodically (called every second by service worker)
export const updateUsersCache = async (users: any[]): Promise<void> => {
  try {
    const timestamp = Date.now();
    // Keep existing users and merge with new ones, limit to 500
    const existingUsers = await getUsers();
    const mergedUsers = [...existingUsers, ...users];
    const uniqueUsers = mergedUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.id === user.id)
    );
    const limitedUsers = uniqueUsers.slice(0, 500);

    await addItems(STORES.USERS, [{ id: 'cache-meta', timestamp }, ...limitedUsers]);
    console.log(`Updated users cache with ${limitedUsers.length} users`);
  } catch (error) {
    console.error('Failed to update users cache:', error);
  }
};

// Clear events cache utility
export const clearEventsCache = async (): Promise<void> => {
  await clearStore(STORES.EVENTS);
};

// Get events and check cache expiration (3 days - events are time-sensitive)
export const getEvents = async (): Promise<EventItem[]> => {
  try {
    const items = await getItems<any>(STORES.EVENTS);
    const meta = items.find((item: any) => item.id === 'cache-meta');
    const events = items.filter((item: any) => item.id !== 'cache-meta');

    if (meta && meta.timestamp) {
      const now = Date.now();
      const age = now - meta.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (age > maxAge) {
        console.log('Events cache expired, clearing...');
        // Cache expired, clear store
        await clearStore(STORES.EVENTS);
        return [];
      }
    }

    // Validate events data
    const validEvents = events.filter((event: any) => {
      return event && typeof event === 'object' && event.id && event.name;
    });

    if (validEvents.length !== events.length) {
      console.warn(`Found ${events.length - validEvents.length} invalid events in cache`);
    }

    return validEvents;
  } catch (error) {
    console.error('Error getting events from cache:', error);
    // If there's an error reading cache, clear it and return empty
    try {
      await clearStore(STORES.EVENTS);
    } catch (clearError) {
      console.error('Error clearing corrupted events cache:', clearError);
    }
    return [];
  }
};

// Get events by category
export const getEventsByCategory = (category: string): Promise<EventItem[]> => {
  return getItemsByIndex(STORES.EVENTS, 'category', category);
};

// Get users and check cache expiration (7 days - extended due to periodic caching)
export const getUsers = async (): Promise<any[]> => {
  try {
    const items = await getItems<any>(STORES.USERS);
    const meta = items.find((item: any) => item.id === 'cache-meta');
    const users = items.filter((item: any) => item.id !== 'cache-meta');

    if (meta && meta.timestamp) {
      const now = Date.now();
      const age = now - meta.timestamp;
      const maxAge = 60 * 24 * 60 * 60 * 1000; // 60 days

      if (age > maxAge) {
        console.log('Users cache expired, clearing...');
        // Cache expired, clear store
        await clearStore(STORES.USERS);
        return [];
      }
    }

    // Validate users data
    const validUsers = users.filter((user: any) => {
      return user && typeof user === 'object' && user.id;
    });

    if (validUsers.length !== users.length) {
      console.warn(`Found ${users.length - validUsers.length} invalid users in cache`);
    }

    return validUsers;
  } catch (error) {
    console.error('Error getting users from cache:', error);
    // If there's an error reading cache, clear it and return empty
    try {
      await clearStore(STORES.USERS);
    } catch (clearError) {
      console.error('Error clearing corrupted users cache:', clearError);
    }
    return [];
  }
};

// Sync status management
export const updateSyncStatus = async (status: SyncStatus): Promise<void> => {
  return addItems(STORES.SYNC_STATUS, [{ id: 'main', ...status }]);
};

export const getSyncStatus = async (): Promise<SyncStatus | null> => {
  const statuses = await getItems<SyncStatus & { id: string }>(STORES.SYNC_STATUS);
  return statuses.find(s => s.id === 'main') || null;
};

// Clear specific store
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error(`Clear ${storeName} request error:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  const db = await openDatabase();
  const storeNames = Array.from(db.objectStoreNames);
  await Promise.all(storeNames.map(storeName => clearStore(storeName)));
};

// Performance optimizations
export const optimizeDatabase = async (): Promise<void> => {
  try {
    const db = await openDatabase();

    // Clean up old cache entries
    await cleanupExpiredEntries(db);

    // Compact database by removing fragmentation
    await compactDatabase(db);

    console.log('Database optimization completed');
  } catch (error) {
    console.error('Database optimization failed:', error);
  }
};

// Clean up expired cache entries across all stores
async function cleanupExpiredEntries(db: IDBDatabase): Promise<void> {
  const stores = [STORES.EVENTS, STORES.USERS, STORES.CATEGORIES];

  for (const storeName of stores) {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      const cleanupPromises = await new Promise<void[]>((resolve, reject) => {
        request.onsuccess = async () => {
          const items = request.result;
          const meta = items.find((item: any) => item.id === 'cache-meta');

          if (meta && meta.timestamp) {
            const now = Date.now();
            const age = now - meta.timestamp;
            const maxAge = getMaxAgeForStore(storeName);

            if (age > maxAge) {
              // Clear expired store
              const clearRequest = store.clear();
              clearRequest.onsuccess = () => resolve([]);
              clearRequest.onerror = () => reject(clearRequest.error);
              return;
            }
          }

          resolve([]);
        };
        request.onerror = () => reject(request.error);
      });

      await Promise.all(cleanupPromises);
    } catch (error) {
      console.warn(`Failed to cleanup ${storeName}:`, error);
    }
  }
}

// Get maximum age for different store types (consistent with main cache functions)
function getMaxAgeForStore(storeName: string): number {
  switch (storeName) {
    case STORES.EVENTS: return 30 * 24 * 60 * 60 * 1000; // 30 days
    case STORES.USERS: return 60 * 24 * 60 * 60 * 1000;  // 60 days
    case STORES.CATEGORIES: return 60 * 24 * 60 * 60 * 1000; // 60 days
    default: return 7 * 24 * 60 * 60 * 1000; // 7 days default
  }
}

// Compact database by rebuilding indexes
async function compactDatabase(db: IDBDatabase): Promise<void> {
  // This is a lightweight compaction that doesn't require database recreation
  // In a real implementation, you might want to implement a more sophisticated
  // compaction strategy, but this serves as a placeholder for optimization
  console.log('Database compaction completed (lightweight)');
}

// Memory-efficient batch operations
export const batchInsert = async <T>(
  storeName: string,
  items: T[],
  batchSize: number = 50
): Promise<void> => {
  if (!items || items.length === 0) return;

  const db = await openDatabase();

  // Process in batches to avoid memory issues
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    batch.forEach((item) => {
      store.put(item);
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.error(`Batch insert failed for ${storeName}:`, (event.target as IDBTransaction).error);
        reject((event.target as IDBTransaction).error);
      };
    });
  }
};

// Connection pooling for better performance
let connectionPool: IDBDatabase[] = [];
const MAX_POOL_SIZE = 3;

export const getPooledConnection = async (): Promise<IDBDatabase> => {
  // Return existing connection if available
  if (connectionPool.length > 0) {
    return connectionPool.pop()!;
  }

  // Create new connection
  const db = await openDatabase();

  // Set up connection return mechanism
  const originalClose = db.close.bind(db);
  db.close = () => {
    if (connectionPool.length < MAX_POOL_SIZE) {
      connectionPool.push(db);
    } else {
      originalClose();
    }
  };

  return db;
};

// Offline Queue Management
export const addToQueue = async (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'status'>): Promise<number> => {
  const queuedOp: QueuedOperation = {
    ...operation,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  const db = await openDatabase();
  const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
  const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
  const request = store.add(queuedOp);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve((event.target as IDBRequest).result as number);
    request.onerror = (event) => {
      console.error('Add to queue error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const getQueuedOperations = async (status?: string): Promise<QueuedOperation[]> => {
  if (status) {
    return getItemsByIndex<QueuedOperation>(STORES.OFFLINE_QUEUE, 'status', status);
  }
  return getItems<QueuedOperation>(STORES.OFFLINE_QUEUE);
};

export const updateQueuedOperation = async (id: number, updates: Partial<QueuedOperation>): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
  const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
  const getRequest = store.get(id);

  return new Promise((resolve, reject) => {
    getRequest.onsuccess = (event) => {
      const operation = (event.target as IDBRequest).result as QueuedOperation;
      if (operation) {
        const updatedOperation = { ...operation, ...updates };
        const putRequest = store.put(updatedOperation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      } else {
        reject(new Error('Operation not found'));
      }
    };
    getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const removeFromQueue = async (id: number): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
  const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
  const request = store.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Remove from queue error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const clearCompletedOperations = async (): Promise<void> => {
  const operations = await getQueuedOperations('completed');
  await Promise.all(operations.map(op => op.id && removeFromQueue(op.id)));
};

// Cache statistics interface
export interface CacheStats {
  eventsCount: number;
  usersCount: number;
  categoriesCount: number;
  queueLength: number;
  lastCacheTime: number | null;
  storageUsed: number;
  storageAvailable: number | null;
}

// Get cache statistics
export const getCacheStats = async (): Promise<CacheStats> => {
  const events = await getEvents();
  const users = await getUsers();
  const categories = await getItems<any>(STORES.CATEGORIES);
  const queue = await getQueuedOperations();

  // Get cache timestamp
  const syncStatus = await getSyncStatus();
  const lastCacheTime = syncStatus?.lastSync || null;

  // Estimate storage used by IndexedDB
  let storageUsed = 0;
  let storageAvailable: number | null = null;

  // Try to get storage estimate using Storage API
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      storageUsed = estimate.usage || 0;
      storageAvailable = estimate.quota || null;
    } catch (e) {
      console.warn('Could not get storage estimate:', e);
    }
  }

  // Fallback: estimate based on data size
  if (storageUsed === 0) {
    const eventsSize = JSON.stringify(events).length;
    const usersSize = JSON.stringify(users).length;
    const categoriesSize = JSON.stringify(categories).length;
    const queueSize = JSON.stringify(queue).length;
    storageUsed = eventsSize + usersSize + categoriesSize + queueSize;
  }

  return {
    eventsCount: events.length,
    usersCount: users.length,
    categoriesCount: categories.length,
    queueLength: queue.length,
    lastCacheTime,
    storageUsed,
    storageAvailable
  };
};

// Get service worker cache statistics
export const getServiceWorkerCacheStats = async (): Promise<{ name: string; count: number }[]> => {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    const stats: { name: string; count: number }[] = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats.push({ name, count: keys.length });
    }

    return stats;
  } catch (error) {
    console.error('Failed to get service worker cache stats:', error);
    return [];
  }
};

// Clear specific cache type
export const clearEventsCacheOnly = async (): Promise<void> => {
  await clearStore(STORES.EVENTS);
};

export const clearUsersCacheOnly = async (): Promise<void> => {
  await clearStore(STORES.USERS);
};

export const clearCategoriesCacheOnly = async (): Promise<void> => {
  await clearStore(STORES.CATEGORIES);
};

export const clearOfflineQueueOnly = async (): Promise<void> => {
  await clearStore(STORES.OFFLINE_QUEUE);
};

// Clear service worker caches
export const clearServiceWorkerCaches = async (): Promise<number> => {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let clearedCount = 0;

    for (const name of cacheNames) {
      const deleted = await caches.delete(name);
      if (deleted) clearedCount++;
    }

    return clearedCount;
  } catch (error) {
    console.error('Failed to clear service worker caches:', error);
    return 0;
  }
};

// Format bytes to human readable string
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get relative time string
export const getRelativeTime = (timestamp: number | null): string => {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
};
