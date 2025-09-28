'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TABLES } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import * as db from '@/lib/indexedDB';
import { toast } from 'react-hot-toast';

interface NetworkStatusContextType {
  isOnline: boolean;
  isPwaOnMobile: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  setLastSyncTime: (time: Date) => void;
}

export const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const NetworkStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isPwaOnMobile, setIsPwaOnMobile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Function to sync data with the server
  // Utility to clear service worker cache
  const clearServiceWorkerCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  };

  const syncData = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Get current sync status
      const syncStatus = await db.getSyncStatus();
      const lastSync = syncStatus?.lastSync || 0;

      // Fetch new events from server
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .gte('created_at', new Date(lastSync).toISOString())
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Update local database
      if (eventsData && eventsData.length > 0) {
        await db.addEvents(eventsData as EventItem[]);
        toast.success(`Updated ${eventsData.length} events`);
      }

      // Update sync status
      await db.updateSyncStatus({
        lastSync: Date.now(),
        inProgress: false
      });

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error instanceof Error ? error.message : 'Unknown sync error');
      toast.error('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    // Read offlineNotif and autoSync from localStorage
    let offlineNotif = true;
    let autoSync = true;
    try {
      offlineNotif = localStorage.getItem('offlineNotif') !== 'false';
      autoSync = localStorage.getItem('autoSync') !== 'false';
    } catch {}

    const handleOnline = async () => {
      setIsOnline(true);
      // Clear caches on reconnect
      try {
        await db.clearEventsCache();
        await clearServiceWorkerCache();
        toast.success('Cache cleared! Fetching latest events...');
        // Fetch latest events from server and cache them
        const { data: eventsData, error: eventsError } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .order('created_at', { ascending: false });
        if (eventsError) throw eventsError;
        if (eventsData && eventsData.length > 0) {
          await db.addEvents(eventsData as EventItem[]);
          toast.success('Latest events cached for offline use!');
        }
      } catch (err) {
        toast.error('Failed to update cache');
      }
      if (offlineNotif) toast.success('Back online! Syncing data...');
      if (autoSync) syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (offlineNotif) toast.error('You are now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if PWA on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPwaOnMobile(isMobile && isStandalone);

    // Initial sync
    if (navigator.onLine && autoSync) {
      syncData();
    }

    // Set up periodic sync when online and autoSync enabled
    const syncInterval = setInterval(() => {
      if (navigator.onLine && autoSync) {
        syncData();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const contextValue = {
    isOnline,
    isPwaOnMobile,
    isSyncing,
    syncError,
    lastSyncTime,
    setLastSyncTime,
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
