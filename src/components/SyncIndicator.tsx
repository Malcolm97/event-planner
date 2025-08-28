'use client';

import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { FiCloudOff, FiRefreshCw } from 'react-icons/fi';

export default function SyncIndicator() {
  const { isOnline, isSyncing, lastSyncTime } = useNetworkStatus();

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end">
      {!isOnline ? (
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-red-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <FiCloudOff className="h-6 w-6" />
            <span>Offline Mode</span>
          </div>
          {lastSyncTime && (
            <div className="text-sm opacity-90 font-medium">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      ) : isSyncing ? (
        <div className="bg-yellow-400/90 backdrop-blur-sm text-black px-5 py-3 rounded-xl shadow-xl border border-yellow-300 flex items-center gap-3">
          <FiRefreshCw className="h-6 w-6 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        <div className="bg-green-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-green-400 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
          <span>Online</span>
        </div>
      )}
    </div>
  );
}
