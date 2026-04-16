'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase, TABLES } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import * as db from '@/lib/indexedDB';
import { toast } from 'react-hot-toast';

interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
}

function getNetworkInformation(): NetworkInformation | null {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection || null;
}

function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}

function devError(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

interface NetworkStatusContextType {
  isOnline: boolean;
  isPwaOnMobile: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
  connectionType: string;
  downlink: number;
  rtt: number;
  setLastSyncTime: (time: Date) => void;
  setIsSyncing: (syncing: boolean) => void;
  refreshEventsCache: () => Promise<void>;
}

export const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const NetworkStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isPwaOnMobile, setIsPwaOnMobile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Connection quality detection
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent' | 'unknown'>('unknown');
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [downlink, setDownlink] = useState<number>(0);
  const [rtt, setRtt] = useState<number>(0);

  // Debounce network status changes to prevent flickering
  const networkStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connection quality detection using Network Information API
  const updateConnectionQuality = useCallback(() => {
    try {
      const connection = getNetworkInformation();
      if (connection) {
        const downlinkValue = connection.downlink ?? 0;

        // Update connection type and metrics with error handling
        try {
          setConnectionType(connection?.effectiveType || 'unknown');
          setDownlink(downlinkValue);
          setRtt(connection?.rtt || 0);
        } catch (e) {
          // Some properties might not be available
          devWarn('Error reading connection properties:', e);
        }

        // Determine connection quality based on effectiveType and downlink
        let quality: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown' = 'unknown';

        if (connection?.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              quality = 'poor';
              break;
            case '3g':
              quality = (downlinkValue >= 1) ? 'fair' : 'poor';
              break;
            case '4g':
              if (downlinkValue >= 5) {
                quality = 'excellent';
              } else if (downlinkValue >= 2) {
                quality = 'good';
              } else {
                quality = 'fair';
              }
              break;
            default:
              quality = 'unknown';
          }
        } else if (downlinkValue > 0) {
          // Fallback to downlink speed if effectiveType not available
          if (downlinkValue >= 5) {
            quality = 'excellent';
          } else if (downlinkValue >= 2) {
            quality = 'good';
          } else if (downlinkValue >= 0.5) {
            quality = 'fair';
          } else {
            quality = 'poor';
          }
        }

        setConnectionQuality(quality);
      } else {
        // Fallback for browsers without Network Information API
        setConnectionQuality('unknown');
        setConnectionType('unknown');
        setDownlink(0);
        setRtt(0);
      }
    } catch (error) {
      // Fallback for any errors
      devWarn('Error detecting connection quality:', error);
      setConnectionQuality('unknown');
      setConnectionType('unknown');
      setDownlink(0);
      setRtt(0);
    }
  }, []);

  // Utility to clear service worker cache
  const clearServiceWorkerCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }, []);

  // Pre-cache essential content for offline use
  const preCacheEssentialContent = useCallback(async () => {
    try {
      // Pre-cache key pages by making HEAD requests to warm up the cache
      const essentialUrls = [
        '/',
        '/about',
        '/settings',
        '/api/events',
        '/api/health'
      ];

      // Use service worker to cache these URLs - with error handling
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window) {
        try {
          // Find the correct cache dynamically
          const cacheNames = await caches.keys();
          const appCache = cacheNames.find(name => 
            name.includes('event-planner') && (name.includes('cache') || name.includes('pages'))
          );
          
          if (appCache) {
            const cache = await caches.open(appCache);
            for (const url of essentialUrls) {
              try {
                const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
                if (response.ok) {
                  // Cache the successful response
                  await cache.put(url, response);
                }
              } catch (error) {
                devWarn(`Failed to pre-cache ${url}:`, error);
              }
            }
          }
        } catch (cacheError) {
          devWarn('Failed to open cache:', cacheError);
        }
      }
    } catch (error) {
      devWarn('Pre-caching failed:', error);
    }
  }, []);

  // Refresh events cache from server
  const refreshEventsCache = useCallback(async () => {
    try {
      devLog('Refreshing events cache...');
      await db.clearEventsCache();
      await clearServiceWorkerCache();

      // Pre-cache essential content
      await preCacheEssentialContent();

      // Fetch latest events from server and cache them
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        await db.addEvents(eventsData as EventItem[]);
        devLog(`Cached ${eventsData.length} events for offline use`);
      }

      // Force refresh of any components using cached data
      window.dispatchEvent(new CustomEvent('cache-refreshed', { detail: { type: 'events' } }));
    } catch (error) {
      devError('Failed to refresh events cache:', error);
      throw error;
    }
  }, [clearServiceWorkerCache, preCacheEssentialContent]);

  // Test actual connectivity (not just navigator.onLine)
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource from the server
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Update network status with debouncing
  const updateNetworkStatus = useCallback(async (online: boolean) => {
    if (networkStatusTimeoutRef.current) {
      clearTimeout(networkStatusTimeoutRef.current);
    }

    const timeout = setTimeout(async () => {
      const wasOnline = isOnline;
      const actuallyOnline = online ? await testConnectivity() : false;

      setIsOnline(actuallyOnline);

      // Read offlineNotif from localStorage
      let offlineNotif = true;
      try {
        offlineNotif = localStorage.getItem('offlineNotif') !== 'false';
      } catch {}

      if (actuallyOnline && !wasOnline) {
        // Came back online
        try {
          await refreshEventsCache();
          if (offlineNotif) {
            toast.success('Back online! Events cache updated.');
          }
        } catch (error) {
          devError('Failed to refresh cache on reconnect:', error);
          if (offlineNotif) {
            toast.error('Back online, but failed to update cache.');
          }
        }
      } else if (!actuallyOnline && wasOnline) {
        // Went offline
        if (offlineNotif) {
          toast.error('You are now offline');
        }
      }
    }, 1000); // 1 second debounce

    networkStatusTimeoutRef.current = timeout;
  }, [isOnline, testConnectivity, refreshEventsCache]);

  useEffect(() => {
    // Initialize network status
    updateNetworkStatus(navigator.onLine);

    // Initialize connection quality detection
    updateConnectionQuality();

    const handleOnline = () => updateNetworkStatus(true);
    const handleOffline = () => updateNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if Network Information API is available
    const connection = getNetworkInformation();
    if (connection) {
      const handleConnectionChange = () => updateConnectionQuality();
      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
        if (networkStatusTimeoutRef.current) {
          clearTimeout(networkStatusTimeoutRef.current);
        }
      };
    }

    // Check if PWA on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPwaOnMobile(isMobile && isStandalone);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkStatusTimeoutRef.current) {
        clearTimeout(networkStatusTimeoutRef.current);
      }
    };
  }, [updateNetworkStatus, updateConnectionQuality]);

  const contextValue = {
    isOnline,
    isPwaOnMobile,
    isSyncing,
    syncError,
    lastSyncTime,
    connectionQuality,
    connectionType,
    downlink,
    rtt,
    setLastSyncTime,
    setIsSyncing,
    refreshEventsCache,
  };

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};
