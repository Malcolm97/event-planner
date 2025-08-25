import { EventItem } from './types';

const DB_NAME = 'event-planner-db';
const DB_VERSION = 2;

// Store names
const STORES = {
  EVENTS: 'events',
  USERS: 'users',
  SYNC_STATUS: 'syncStatus',
  CATEGORIES: 'categories'
};

interface SyncStatus {
  lastSync: number;
  inProgress: boolean;
  error?: string;
}

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create or update stores
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
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
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Generic function to add items to any store
export const addItems = async <T>(storeName: string, items: T[]): Promise<void> => {
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

// Specific functions for events
export const addEvents = (events: EventItem[]): Promise<void> => {
  return addItems(STORES.EVENTS, events);
};

export const getEvents = (): Promise<EventItem[]> => {
  return getItems(STORES.EVENTS);
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
