'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface VersionInfo {
  version: string;
  buildTimestamp: string;
  commit?: string;
  environment?: string;
  deployedAt?: string;
}

interface UpdateContextType {
  // Current version info
  currentVersion: string;
  currentBuildTimestamp: string;
  
  // Server version info (from API)
  serverVersion: VersionInfo | null;
  
  // Update state
  updateAvailable: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
  
  // Actions
  checkForUpdate: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  isDismissed: boolean;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

// Check interval: 1 minute
const UPDATE_CHECK_INTERVAL = 60 * 1000;

// How long to wait before showing dismissed update again (5 minutes)
const DISMISS_DURATION = 5 * 60 * 1000;

// Local storage keys
const STORAGE_KEYS = {
  DISMISSED_VERSION: 'pwa-dismissed-version',
  DISMISSED_AT: 'pwa-dismissed-at',
  LAST_CHECKED: 'pwa-last-checked',
};

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [currentVersion] = useState('10.0.5');
  const [currentBuildTimestamp] = useState('20260226');
  const [serverVersion, setServerVersion] = useState<VersionInfo | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  // Check if a dismissed update should be shown again
  const checkDismissedStatus = useCallback((serverBuildTimestamp: string) => {
    const dismissedVersion = localStorage.getItem(STORAGE_KEYS.DISMISSED_VERSION);
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    
    if (dismissedVersion !== serverBuildTimestamp) {
      // Different version available, reset dismissal
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_VERSION);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
      return false;
    }
    
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION) {
        return true; // Still within dismiss period
      }
      // Dismiss period expired
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_VERSION);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
      return false;
    }
    
    return false;
  }, []);

  // Check for updates from the server
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      return false;
    }
    
    isCheckingRef.current = true;
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await fetch('/api/version', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }
      
      const versionInfo: VersionInfo = await response.json();
      setServerVersion(versionInfo);
      
      const now = new Date();
      setLastChecked(now);
      localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, now.toISOString());
      
      // Check if update is available
      const hasUpdate = versionInfo.buildTimestamp !== currentBuildTimestamp;
      
      if (hasUpdate) {
        const dismissed = checkDismissedStatus(versionInfo.buildTimestamp);
        setIsDismissed(dismissed);
      }
      
      setUpdateAvailable(hasUpdate);
      
      return hasUpdate;
    } catch (err) {
      console.error('Update check failed:', err);
      setError(err instanceof Error ? err.message : 'Update check failed');
      return false;
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, [currentBuildTimestamp, checkDismissedStatus]);

  // Apply update by clearing caches and reloading
  const applyUpdate = useCallback(async () => {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
      }
      
      // Clear local storage update-related items
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_VERSION);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
      localStorage.removeItem(STORAGE_KEYS.LAST_CHECKED);
      
      // Unregister service workers and reload
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Service workers unregistered');
      }
      
      // Force reload from server
      window.location.reload();
    } catch (err) {
      console.error('Failed to apply update:', err);
      // Fallback: just reload
      window.location.reload();
    }
  }, []);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    if (serverVersion) {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_VERSION, serverVersion.buildTimestamp);
      localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
      setIsDismissed(true);
    }
  }, [serverVersion]);

  // Listen for service worker messages
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data) {
        switch (event.data.type) {
          case 'SW_ACTIVATED':
          case 'SW_UPDATE_AVAILABLE':
            console.log('SW message received:', event.data);
            // Check for update when SW notifies us
            checkForUpdate();
            break;
        }
      }
    };
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [checkForUpdate]);

  // Initial check and periodic checking
  useEffect(() => {
    // Check on mount
    checkForUpdate();
    
    // Set up periodic checks (1 minute interval)
    checkIntervalRef.current = setInterval(() => {
      checkForUpdate();
    }, UPDATE_CHECK_INTERVAL);
    
    // Also check when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const value: UpdateContextType = {
    currentVersion,
    currentBuildTimestamp,
    serverVersion,
    updateAvailable,
    isChecking,
    lastChecked,
    error,
    checkForUpdate,
    applyUpdate,
    dismissUpdate,
    isDismissed,
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}