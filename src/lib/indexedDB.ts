import { EventItem } from './types';

const DB_NAME = 'event-planner-db';
const STORE_NAME = 'events';
const DB_VERSION = 1;

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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

export const addEvents = async (events: EventItem[]): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  events.forEach((event) => {
    store.put(event);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = (event) => {
      console.error('Add events transaction error:', (event.target as IDBTransaction).error);
      reject((event.target as IDBTransaction).error);
    };
  });
};

export const getEvents = async (): Promise<EventItem[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };
    request.onerror = (event) => {
      console.error('Get events request error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const clearEvents = async (): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error('Clear events request error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};
