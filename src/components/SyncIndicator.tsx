'use client';

import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { FiCloudOff, FiRefreshCw, FiClock, FiWifi, FiWifiOff, FiCheckCircle, FiAlertTriangle, FiDatabase } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import * as db from '@/lib/indexedDB';

export default function SyncIndicator() {
  const { isOnline, isSyncing, lastSyncTime, syncError } = useNetworkStatus();
  const { queueLength, syncNow, isProcessingQueue } = useOfflineSync();
  const [cachedEventsCount, setCachedEventsCount] = useState(0);

  // Check cached events count
  useEffect(() => {
    const checkCachedEvents = async () => {
      try {
        const events = await db.getEvents();
        setCachedEventsCount(events.length);
      } catch (error) {
        console.warn('Failed to check cached events:', error);
        setCachedEventsCount(0);
      }
    };

    checkCachedEvents();
    // Check periodically when offline
    if (!isOnline) {
      const interval = setInterval(checkCachedEvents, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Determine the current sync state
  const getSyncState = () => {
    if (!isOnline) return 'offline';
    if (isSyncing || isProcessingQueue) return 'syncing';
    if (syncError) return 'error';
    if (queueLength > 0) return 'has-queue';
    return 'online';
  };

  const syncState = getSyncState();

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-50">
      {/* Saved events indicator - show when offline and have saved events */}
      {!isOnline && cachedEventsCount > 0 && (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl border border-blue-400 flex items-center gap-2">
          <FiDatabase className="h-4 w-4" />
          <span className="text-sm font-medium">{cachedEventsCount} saved events</span>
        </div>
      )}

      {/* Queue indicator - always show if there are pending operations */}
      {queueLength > 0 && (
        <div className="bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl border border-orange-400 flex items-center gap-2 animate-pulse">
          <FiClock className="h-4 w-4" />
          <span className="text-sm font-medium">{queueLength} pending</span>
        </div>
      )}

      {/* Main status indicator */}
      {syncState === 'offline' && (
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-red-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <FiWifiOff className="h-6 w-6" />
            <span className="font-semibold">Offline Mode</span>
          </div>
          {lastSyncTime && (
            <div className="text-sm opacity-90 font-medium">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
          <div className="text-xs opacity-75">
            Changes will sync when online
          </div>
        </div>
      )}

      {syncState === 'syncing' && (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-blue-400 flex items-center gap-3">
          <FiRefreshCw className="h-6 w-6 animate-spin" />
          <span className="font-semibold">
            {isProcessingQueue ? 'Processing Queue...' : 'Syncing...'}
          </span>
        </div>
      )}

      {syncState === 'error' && (
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-red-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="h-6 w-6" />
            <span className="font-semibold">Sync Error</span>
          </div>
          <div className="text-sm opacity-90 max-w-xs text-right">
            {syncError}
          </div>
          <button
            onClick={syncNow}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            Retry Sync
          </button>
        </div>
      )}

      {syncState === 'has-queue' && (
        <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-yellow-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <FiWifi className="h-6 w-6" />
            <span className="font-semibold">Online</span>
          </div>
          <div className="text-sm opacity-90">
            {queueLength} operation{queueLength !== 1 ? 's' : ''} ready to sync
          </div>
          <button
            onClick={syncNow}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            Sync Now
          </button>
          {lastSyncTime && (
            <div className="text-xs opacity-75">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {syncState === 'online' && (
        <div className="bg-green-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-green-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="h-6 w-6" />
            <span className="font-semibold">Online</span>
          </div>
          {lastSyncTime && (
            <div className="text-xs opacity-75">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
