'use client';

import React from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const OnlineBadge = () => {
  const { isOnline, lastSaved } = useNetworkStatus();

  return (
    <div
      className={`fixed bottom-4 right-4 px-3 py-2 rounded-full shadow-lg flex items-center space-x-2 text-sm font-medium transition-all duration-300 ease-in-out
        ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
    >
      {isOnline ? (
        <FiWifi className="w-4 h-4" />
      ) : (
        <FiWifiOff className="w-4 h-4" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      {lastSaved && isOnline && (
        <span className="ml-2 text-xs opacity-80">
          Last synced: {new Date(lastSaved).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default OnlineBadge;
