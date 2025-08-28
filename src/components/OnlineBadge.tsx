'use client';

import React from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const OnlineBadge = () => {
  const { isOnline, lastSyncTime } = useNetworkStatus();

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-semibold transition-all duration-300 ease-in-out backdrop-blur-sm border
        ${isOnline ? 'bg-green-500/90 text-white border-green-400' : 'bg-red-500/90 text-white border-red-400'}`}
    >
      {isOnline ? (
        <FiWifi className="w-5 h-5" />
      ) : (
        <FiWifiOff className="w-5 h-5" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      {lastSyncTime && isOnline && (
        <span className="ml-2 text-xs opacity-90 font-medium">
          Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default OnlineBadge;
