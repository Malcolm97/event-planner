'use client';

import React, { useState } from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { FiWifi, FiWifiOff, FiRefreshCw, FiClock, FiAlertTriangle, FiChevronDown, FiChevronUp, FiDatabase } from 'react-icons/fi';
import * as db from '@/lib/indexedDB';
import { isAutoSyncEnabled } from '@/lib/utils';

const OnlineBadge = React.memo(() => {
  const { isOnline, isSyncing, lastSyncTime, syncError, connectionQuality, connectionType, downlink, rtt } = useNetworkStatus();
  const { queueLength, syncNow, isProcessingQueue } = useOfflineSync();
  const [isExpanded, setIsExpanded] = useState(false);
  const [cachedEventsCount, setCachedEventsCount] = useState(0);

  // Check cached events count
  React.useEffect(() => {
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
    // Update periodically
    const interval = setInterval(checkCachedEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine current state
  const getStatusState = () => {
    if (!isOnline) return 'offline';
    if (isSyncing || isProcessingQueue) return 'syncing';
    if (syncError) return 'error';
    if (queueLength > 0) return 'has-queue';
    return 'online';
  };

  const statusState = getStatusState();

  const getStatusConfig = () => {
    switch (statusState) {
      case 'offline':
        return {
          bg: 'bg-gradient-to-r from-red-500/95 to-red-600/95',
          border: 'border-red-400/50',
          icon: <FiWifiOff className="w-5 h-5 flex-shrink-0" />,
          text: 'Offline',
          subtext: 'Limited functionality'
        };
      case 'syncing':
        return {
          bg: 'bg-gradient-to-r from-blue-500/95 to-blue-600/95',
          border: 'border-blue-400/50',
          icon: <FiRefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />,
          text: 'Syncing',
          subtext: 'Updating data...'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/95 to-orange-500/95',
          border: 'border-red-400/50',
          icon: <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />,
          text: 'Sync Error',
          subtext: 'Tap to retry'
        };
      case 'has-queue':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/95 to-orange-500/95',
          border: 'border-yellow-400/50',
          icon: <FiClock className="w-5 h-5 flex-shrink-0" />,
          text: 'Pending Sync',
          subtext: `${queueLength} item${queueLength !== 1 ? 's' : ''}`
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-green-500/95 to-emerald-500/95',
          border: 'border-green-400/50',
          icon: <FiWifi className="w-5 h-5 flex-shrink-0" />,
          text: 'Online',
          subtext: lastSyncTime ? `Synced ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Connected'
        };
    }
  };

  const config = getStatusConfig();

  const handleClick = () => {
    if (statusState === 'error' || statusState === 'has-queue') {
      syncNow();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // Get connection quality indicator
  const getConnectionQualityIndicator = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Excellent connection" />;
      case 'good':
        return <div className="w-2 h-2 bg-blue-400 rounded-full" title="Good connection" />;
      case 'fair':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Fair connection" />;
      case 'poor':
        return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Poor connection" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" title="Connection quality unknown" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 hidden lg:block">
      <div
        className={`
          ${config.bg} ${config.border}
          text-white rounded-2xl shadow-2xl backdrop-blur-md border
          transition-all duration-300 ease-out cursor-pointer
          hover:scale-105 hover:shadow-3xl active:scale-95
          ${isExpanded ? 'rounded-b-xl' : 'rounded-2xl'}
          max-w-56
        `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Network status: ${config.text}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Main status bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          {config.icon}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-xs leading-tight">{config.text}</span>
            <span className="text-[10px] opacity-90 leading-tight truncate">{config.subtext}</span>
          </div>
          {/* Connection quality indicator */}
          {isOnline && connectionQuality !== 'unknown' && (
            <div className="flex items-center gap-1">
              {getConnectionQualityIndicator()}
              <span className="text-[10px] opacity-75">{connectionType}</span>
            </div>
          )}
          {(statusState === 'error' || statusState === 'has-queue' || cachedEventsCount > 0 || (isOnline && connectionQuality !== 'unknown')) && (
            <button
              className="ml-1 p-0.5 rounded-lg hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronUp className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t border-white/20 px-3 py-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {/* Saved events */}
            {cachedEventsCount > 0 && (
              <div className="flex items-center gap-2 text-[10px] opacity-90">
                <FiDatabase className="w-3 h-3 flex-shrink-0" />
                <span>{cachedEventsCount} event{cachedEventsCount !== 1 ? 's' : ''} saved</span>
              </div>
            )}

            {/* Queue status */}
            {queueLength > 0 && (
              <div className="flex items-center gap-2 text-[10px] opacity-90">
                <FiClock className="w-3 h-3 flex-shrink-0" />
                <span>{queueLength} pending sync</span>
              </div>
            )}

            {/* Connection details */}
            {isOnline && connectionQuality !== 'unknown' && (
              <div className="flex items-center gap-1 text-[10px] opacity-90">
                <span>Connection: {connectionQuality}</span>
                {downlink > 0 && <span>({downlink} Mbps)</span>}
                {rtt > 0 && <span>{rtt}ms RTT</span>}
              </div>
            )}

            {/* Last sync time */}
            {lastSyncTime && isOnline && isAutoSyncEnabled() && (
              <div className="text-[10px] opacity-75 pt-1 border-t border-white/10">
                Last synced: {new Date(lastSyncTime).toLocaleString()}
              </div>
            )}

            {/* Action buttons */}
            {(statusState === 'error' || statusState === 'has-queue') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  syncNow();
                }}
                className="w-full mt-1 bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                disabled={isProcessingQueue}
              >
                {isProcessingQueue ? 'Syncing...' : statusState === 'error' ? 'Retry Sync' : 'Sync Now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default OnlineBadge;
