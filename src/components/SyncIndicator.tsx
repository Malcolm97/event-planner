'use client';

import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { FiCloudOff, FiRefreshCw } from 'react-icons/fi';

export default function SyncIndicator() {
  const { isOnline, isSyncing, lastSyncTime } = useNetworkStatus();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end">
      {!isOnline ? (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <FiCloudOff className="h-5 w-5" />
            <span>Offline Mode</span>
          </div>
          {lastSyncTime && (
            <div className="text-sm opacity-90">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      ) : isSyncing ? (
        <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <FiRefreshCw className="h-5 w-5 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>Online</span>
        </div>
      )}
    </div>
  );
}
