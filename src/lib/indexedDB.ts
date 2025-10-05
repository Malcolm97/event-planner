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
  // Limit cache size to 500 events
  const limitedEvents = events.slice(0, 500);
  await addItems(STORES.EVENTS, [{ id: 'cache-meta', timestamp }, ...limitedEvents]);
};

// Add users with cache timestamp
export const addUsers = async (users: any[]): Promise<void> => {
  const timestamp = Date.now();
  // Limit cache size to 200 users
  const limitedUsers = users.slice(0, 200);
  await addItems(STORES.USERS, [{ id: 'cache-meta', timestamp }, ...limitedUsers]);
};

// Update events cache periodically (called every second by service worker)
export const updateEventsCache = async (events: EventItem[]): Promise<void> => {
  try {
    const timestamp = Date.now();
    // Keep existing events and merge with new ones, limit to 500
    const existingEvents = await getEvents();
    const mergedEvents = [...existingEvents, ...events];
    const uniqueEvents = mergedEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );
    const limitedEvents = uniqueEvents.slice(0, 500);

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
    // Keep existing users and merge with new ones, limit to 200
    const existingUsers = await getUsers();
    const mergedUsers = [...existingUsers, ...users];
    const uniqueUsers = mergedUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.id === user.id)
    );
    const limitedUsers = uniqueUsers.slice(0, 200);

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

// Get events and check cache expiration (7 days - extended due to periodic caching)
export const getEvents = async (): Promise<EventItem[]> => {
  const items = await getItems<any>(STORES.EVENTS);
  const meta = items.find((item: any) => item.id === 'cache-meta');
  const events = items.filter((item: any) => item.id !== 'cache-meta');
  if (meta && meta.timestamp) {
    const now = Date.now();
    const age = now - meta.timestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
      // Cache expired, clear store
      await clearStore(STORES.EVENTS);
      return [];
    }
  }
  return events;
};

// Get events by category
export const getEventsByCategory = (category: string): Promise<EventItem[]> => {
  return getItemsByIndex(STORES.EVENTS, 'category', category);
};

// Get users and check cache expiration (7 days - extended due to periodic caching)
export const getUsers = async (): Promise<any[]> => {
  const items = await getItems<any>(STORES.USERS);
  const meta = items.find((item: any) => item.id === 'cache-meta');
  const users = items.filter((item: any) => item.id !== 'cache-meta');
  if (meta && meta.timestamp) {
    const now = Date.now();
    const age = now - meta.timestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
      // Cache expired, clear store
      await clearStore(STORES.USERS);
      return [];
    }
  }
  return users;
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
