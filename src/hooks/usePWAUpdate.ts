'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SWVersion {
  version: string;
  buildTimestamp: string;
}

interface UsePWAUpdateOptions {
  /**
   * Enable automatic periodic update checking
   * @default true
   */
  autoCheck?: boolean;
  
  /**
   * Interval in milliseconds between update checks
   * @default 300000 (5 minutes)
   */
  checkInterval?: number;
  
  /**
   * Callback when an update is available
   */
  onUpdateAvailable?: (version: SWVersion) => void;
  
  /**
   * Callback when update is installed and ready
   */
  onUpdateReady?: (version: SWVersion) => void;
}

/**
 * Custom hook for managing PWA service worker updates
 * Provides automatic update checking, manual triggers, and version info
 */
export function usePWAUpdate(options: UsePWAUpdateOptions = {}) {
  const {
    autoCheck = true,
    checkInterval = 300000, // 5 minutes
    onUpdateAvailable,
    onUpdateReady
  } = options;

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [version, setVersion] = useState<SWVersion | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if service workers are supported
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator);
    
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    setIsPWA(isStandalone || isFullscreen || isMinimalUI);
  }, []);

  // Initialize service worker handling
  useEffect(() => {
    if (!isSupported) return;

    // Get existing registration
    const initialize = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);
          
          // Check for waiting worker
          if (reg.waiting) {
            setUpdateAvailable(true);
            onUpdateAvailable?.({
              version: 'unknown',
              buildTimestamp: 'unknown'
            });
          }

          // Listen for updatefound
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  setUpdateAvailable(true);
                  onUpdateAvailable?.(version || { version: 'unknown', buildTimestamp: 'unknown' });
                } else if (newWorker.state === 'activated') {
                  // Update activated
                  onUpdateReady?.(version || { version: 'unknown', buildTimestamp: 'unknown' });
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error initializing service worker:', error);
      }
    };

    initialize();

    // Listen for controller changes
    const handleControllerChange = () => {
      console.log('Service worker controller changed');
      // Reload to get fresh content
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        switch (event.data.type) {
          case 'SW_ACTIVATED':
          case 'SW_UPDATE':
          case 'SW_UPDATE_AVAILABLE':
            if (event.data.version) {
              setVersion({
                version: event.data.version,
                buildTimestamp: event.data.buildTimestamp || ''
              });
            }
            if (event.data.type === 'SW_UPDATE_AVAILABLE' || event.data.type === 'SW_UPDATE') {
              setUpdateAvailable(true);
              onUpdateAvailable?.(event.data);
            }
            break;
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Get version from active worker
    const getVersion = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            if (event.data.version) {
              setVersion({
                version: event.data.version,
                buildTimestamp: event.data.buildTimestamp || ''
              });
            }
          };
          reg.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
        }
      } catch (error) {
        console.warn('Could not get version:', error);
      }
    };

    getVersion();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported, onUpdateAvailable, onUpdateReady, version]);

  // Start periodic checking
  useEffect(() => {
    if (!autoCheck || !isSupported) return;

    checkIntervalRef.current = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          setLastChecked(new Date());
        }
      } catch (error) {
        console.warn('Periodic update check failed:', error);
      }
    }, checkInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [autoCheck, isSupported, checkInterval]);

  /**
   * Manually check for updates
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsChecking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        setLastChecked(new Date());
        
        if (reg.waiting) {
          setUpdateAvailable(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn('Manual update check failed:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isSupported]);

  /**
   * Trigger the update and reload
   */
  const applyUpdate = useCallback(async () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  /**
   * Dismiss the update notification
   */
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  /**
   * Clear all caches and force refresh
   */
  const clearCacheAndRefresh = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        // After cache clear, reload
        window.location.reload();
      };
      
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        reg.active.postMessage({ type: 'CLEAR_CACHE' }, [channel.port2]);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
      window.location.reload();
    }
  }, [isSupported]);

  /**
   * Trigger cache maintenance
   */
  const performCacheMaintenance = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('Cache maintenance completed');
          }
        };
        reg.active.postMessage({ type: 'CACHE_MAINTENANCE' }, [channel.port2]);
      }
    } catch (error) {
      console.warn('Failed to perform cache maintenance:', error);
    }
  }, [isSupported]);

  return {
    // State
    isSupported,
    isPWA,
    updateAvailable,
    isChecking,
    version,
    lastChecked,
    registration,
    
    // Actions
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
    clearCacheAndRefresh,
    performCacheMaintenance
  };
}

export default usePWAUpdate;
