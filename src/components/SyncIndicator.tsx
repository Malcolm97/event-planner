'use client';

import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { FiCloudOff, FiRefreshCw, FiClock } from 'react-icons/fi';

export default function SyncIndicator() {
  const { isOnline, isSyncing, lastSyncTime } = useNetworkStatus();
  const { queueLength, syncNow, isProcessingQueue } = useOfflineSync();

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end">
      {/* Queue indicator */}
      {queueLength > 0 && (
        <div className="bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl border border-orange-400 flex items-center gap-2">
          <FiClock className="h-4 w-4" />
          <span className="text-sm font-medium">{queueLength} pending</span>
        </div>
      )}

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
      ) : isSyncing || isProcessingQueue ? (
        <div className="bg-yellow-400/90 backdrop-blur-sm text-black px-5 py-3 rounded-xl shadow-xl border border-yellow-300 flex items-center gap-3">
          <FiRefreshCw className="h-6 w-6 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        <div className="bg-green-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-xl border border-green-400 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
            <span>Online</span>
          </div>
          {queueLength > 0 && (
            <button
              onClick={syncNow}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Sync Now
            </button>
          )}
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
