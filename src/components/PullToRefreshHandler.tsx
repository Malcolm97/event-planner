'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';

interface PullToRefreshHandlerProps {
  /**
   * Custom refresh handler. If not provided, defaults to cache-busting page reload.
   */
  onRefresh?: () => void | Promise<void>;
  
  /**
   * Distance in pixels needed to trigger refresh (default: 80)
   */
  threshold?: number;
  
  /**
   * Enable debug mode for testing on desktop (default: false)
   * Can also be enabled via URL param: ?pullToRefreshDebug=true
   * Or localStorage: localStorage.setItem('pullToRefreshDebug', 'true')
   */
  debugMode?: boolean;
}

/**
 * Global pull-to-refresh handler component.
 * Place this at the root layout level to enable pull-to-refresh on all pages.
 * Works in PWA standalone mode and on touch devices in regular browsers.
 */
const PullToRefreshHandler: React.FC<PullToRefreshHandlerProps> = ({
  onRefresh,
  threshold = 80,
  debugMode = false,
}) => {
  const [isDebugMode, setIsDebugMode] = useState(debugMode);

  // Check for debug mode from URL or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlDebug = window.location.search.includes('pullToRefreshDebug=true');
    const storedDebug = localStorage.getItem('pullToRefreshDebug') === 'true';
    
    if (urlDebug || storedDebug) {
      setIsDebugMode(true);
    }
  }, []);

  // Custom refresh handler that clears cache and reloads
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      return await onRefresh();
    }
    
    // Default: Clear caches and reload
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[PullToRefresh] Caches cleared');
      } catch (error) {
        console.warn('[PullToRefresh] Failed to clear caches:', error);
      }
    }
    
    // Force reload from server
    window.location.reload();
  }, [onRefresh]);

  const { isPulling, progress, isRefreshing } = usePullToRefresh({
    threshold,
    onRefresh: handleRefresh,
    enabled: true,
    debugMode: isDebugMode,
  });

  return (
    <PullToRefreshIndicator 
      isPulling={isPulling} 
      progress={progress} 
      isRefreshing={isRefreshing}
    />
  );
};

export default React.memo(PullToRefreshHandler);