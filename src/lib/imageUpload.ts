import { supabase } from './supabase';
import { addToQueue, QueuedOperation } from './indexedDB';

// Auto-process queued uploads when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - processing queued uploads');
    // Use setTimeout to avoid immediate execution and potential circular imports
    setTimeout(async () => {
      try {
        const { processQueuedUploads } = await import('./imageUpload');
        await processQueuedUploads();
      } catch (error) {
        console.error('Failed to process queued uploads on reconnect:', error);
      }
    }, 1000); // Delay by 1 second to ensure stability
  });

  // Security: Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    // Clear any sensitive cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('sensitive') || name.includes('auth')) {
            caches.delete(name);
          }
        });
      });
    }
  });
}

export interface QueuedImageUpload {
  id?: number;
  file: File;
  bucketName: string;
  path: string;
  eventId?: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount?: number;
  error?: string;
  thumbnailUrl?: string;
}

export async function uploadImageToSupabase(file: File, bucketName: string, path: string, eventId?: string): Promise<string | null> {
  try {
    // Check if we're online
    if (!navigator.onLine) {
      console.log('Offline detected, queuing image upload for later');
      await queueImageUpload(file, bucketName, path, eventId);
      return null; // Return null to indicate upload was queued
    }

    const { data, error } = await supabase.storage.from(bucketName).upload(path, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Unexpected error during image upload:', error);
    return null;
  }
}

// Queue image upload for offline scenarios
export async function queueImageUpload(file: File, bucketName: string, path: string, eventId?: string): Promise<void> {
  try {
    // Create thumbnail for preview
    const thumbnailUrl = await createImageThumbnail(file);

    const queuedUpload: QueuedImageUpload = {
      file,
      bucketName,
      path,
      eventId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      thumbnailUrl
    };

    // Store in IndexedDB with blob data
    const db = await openImageQueueDB();
    const transaction = db.transaction(['imageUploads'], 'readwrite');
    const store = transaction.objectStore('imageUploads');

    // Convert File to storable format
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      arrayBuffer: await file.arrayBuffer()
    };

    const request = store.add({
      ...queuedUpload,
      file: fileData,
      thumbnailUrl
    });

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('Image upload queued successfully');
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to queue image upload:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error queuing image upload:', error);
    throw error;
  }
}

// Create thumbnail for offline preview
async function createImageThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailUrl = URL.createObjectURL(blob);
          resolve(thumbnailUrl);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, 'image/jpeg', 0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Process queued image uploads when back online
export async function processQueuedUploads(): Promise<void> {
  try {
    const db = await openImageQueueDB();
    const transaction = db.transaction(['imageUploads'], 'readonly');
    const store = transaction.objectStore('imageUploads');
    const index = store.index('status');
    const request = index.getAll('pending');

    const pendingUploads = await new Promise<QueuedImageUpload[]>((resolve, reject) => {
      request.onsuccess = () => {
        const uploads = request.result.map(item => ({
          ...item,
          file: new File([item.file.arrayBuffer], item.file.name, {
            type: item.file.type,
            lastModified: item.file.lastModified
          })
        }));
        resolve(uploads);
      };
      request.onerror = () => reject(request.error);
    });

    console.log(`Processing ${pendingUploads.length} queued image uploads`);

    for (const upload of pendingUploads) {
      try {
        // Update status to processing
        await updateQueuedUploadStatus(upload.id!, 'processing');

        // Attempt upload
        const result = await uploadImageToSupabase(upload.file, upload.bucketName, upload.path, upload.eventId);

        if (result) {
          // Success - mark as completed and clean up
          await updateQueuedUploadStatus(upload.id!, 'completed');
          await removeQueuedUpload(upload.id!);
          console.log(`Successfully uploaded queued image: ${upload.path}`);
        } else {
          // Failed - increment retry count
          const newRetryCount = (upload.retryCount || 0) + 1;
          if (newRetryCount >= 3) {
            await updateQueuedUploadStatus(upload.id!, 'failed', 'Max retries exceeded');
          } else {
            await updateQueuedUploadStatus(upload.id!, 'pending', undefined, newRetryCount);
          }
        }
      } catch (error) {
        console.error(`Failed to process queued upload ${upload.id}:`, error);
        const newRetryCount = (upload.retryCount || 0) + 1;
        if (newRetryCount >= 3) {
          await updateQueuedUploadStatus(upload.id!, 'failed', error instanceof Error ? error.message : String(error));
        } else {
          await updateQueuedUploadStatus(upload.id!, 'pending', undefined, newRetryCount);
        }
      }
    }
  } catch (error) {
    console.error('Error processing queued uploads:', error);
  }
}

// Database for image upload queue
let imageQueueDB: IDBDatabase | null = null;

async function openImageQueueDB(): Promise<IDBDatabase> {
  if (imageQueueDB) return imageQueueDB;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('image-upload-queue', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('imageUploads')) {
        const store = db.createObjectStore('imageUploads', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('eventId', 'eventId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      imageQueueDB = (event.target as IDBOpenDBRequest).result;
      resolve(imageQueueDB);
    };

    request.onerror = (event) => reject(request.error);
  });
}

// Update queued upload status
async function updateQueuedUploadStatus(
  id: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string,
  retryCount?: number
): Promise<void> {
  const db = await openImageQueueDB();
  const transaction = db.transaction(['imageUploads'], 'readwrite');
  const store = transaction.objectStore('imageUploads');
  const getRequest = store.get(id);

  return new Promise((resolve, reject) => {
    getRequest.onsuccess = () => {
      const upload = getRequest.result;
      if (upload) {
        upload.status = status;
        if (error) upload.error = error;
        if (retryCount !== undefined) upload.retryCount = retryCount;

        const putRequest = store.put(upload);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Upload not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Remove completed upload from queue
async function removeQueuedUpload(id: number): Promise<void> {
  const db = await openImageQueueDB();
  const transaction = db.transaction(['imageUploads'], 'readwrite');
  const store = transaction.objectStore('imageUploads');
  const request = store.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get queued uploads for UI display
export async function getQueuedUploads(status?: string): Promise<QueuedImageUpload[]> {
  try {
    const db = await openImageQueueDB();
    const transaction = db.transaction(['imageUploads'], 'readonly');
    const store = transaction.objectStore('imageUploads');

    let request: IDBRequest;
    if (status) {
      const index = store.index('status');
      request = index.getAll(status);
    } else {
      request = store.getAll();
    }

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const uploads = request.result.map((item: any) => ({
          ...item,
          file: item.file ? new File([item.file.arrayBuffer], item.file.name, {
            type: item.file.type,
            lastModified: item.file.lastModified
          }) : null
        }));
        resolve(uploads);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting queued uploads:', error);
    return [];
  }
}

// Get upload queue statistics
export async function getUploadQueueStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  try {
    const allUploads = await getQueuedUploads();
    return {
      total: allUploads.length,
      pending: allUploads.filter(u => u.status === 'pending').length,
      processing: allUploads.filter(u => u.status === 'processing').length,
      completed: allUploads.filter(u => u.status === 'completed').length,
      failed: allUploads.filter(u => u.status === 'failed').length
    };
  } catch (error) {
    console.error('Error getting upload queue stats:', error);
    return { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
  }
}

// Security: Encrypt sensitive data before caching
// Note: This is a simplified implementation for demonstration
// In production, use proper key management and storage
let encryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) return encryptionKey;

  // Generate a persistent key (in production, this should be derived from user credentials)
  const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
  encryptionKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );

  return encryptionKey;
}

export async function encryptData(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const cryptoKey = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64 string
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback: return data as-is if encryption fails
    return data;
  }
}

// Security: Decrypt sensitive data
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const cryptoKey = await getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback: return data as-is if decryption fails
    return encryptedData;
  }
}

// Security: Sanitize data before caching
export function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Remove potentially dangerous HTML/script content
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<[^>]*>/g, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys
      if (!['password', 'token', 'secret', 'key'].includes(key.toLowerCase())) {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
}

// Performance: Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const request = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}

// Performance: Memory-based cache layer
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getFromMemoryCache(key: string): any | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    memoryCache.delete(key);
    return null;
  }

  return cached.data;
}

export function setMemoryCache(key: string, data: any, ttl: number = 300000): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Performance: Lazy loading for cached data
export async function lazyLoadCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300000
): Promise<T> {
  // Check memory cache first
  let data = getFromMemoryCache(cacheKey);
  if (data) return data;

  // Check IndexedDB cache
  try {
    // This would be implemented based on your specific caching needs
    // For now, just fetch and cache
    data = await fetchFn();
    setMemoryCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error('Lazy load failed:', error);
    throw error;
  }
}
