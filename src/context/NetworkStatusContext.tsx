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
    // Check initial online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if PWA on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPwaOnMobile(isMobile && isStandalone);

    // Initial sync
    if (navigator.onLine) {
      syncData();
    }

    // Set up periodic sync when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncData();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes

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
