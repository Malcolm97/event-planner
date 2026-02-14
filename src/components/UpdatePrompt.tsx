'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X, Zap, Check, AlertCircle } from 'lucide-react';

interface UpdatePromptProps {
  /**
   * Whether to show the update prompt automatically when an update is available
   * @default true
   */
  autoShow?: boolean;
  
  /**
   * Delay in ms before showing the update prompt
   * @default 3000
   */
  showDelay?: number;
  
  /**
   * Custom text for the update message
   */
  message?: string;
  
  /**
   * Custom text for the update button
   */
  updateButtonText?: string;
  
  /**
   * Custom text for the dismiss button
   */
  dismissButtonText?: string;
}

interface SWVersion {
  version: string;
  buildTimestamp: string;
}

export function UpdatePrompt({
  autoShow = true,
  showDelay = 3000,
  message = 'A new version is available!',
  updateButtonText = 'Update Now',
  dismissButtonText = 'Later'
}: UpdatePromptProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for updates and set up listeners
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Function to handle service worker updates
    const handleUpdate = (reg: ServiceWorkerRegistration, version?: string) => {
      setRegistration(reg);
      if (version) {
        setLatestVersion(version);
      }
      if (autoShow) {
        setTimeout(() => {
          setShowUpdate(true);
        }, showDelay);
      }
    };

    // Get current version from service worker
    const getVersion = async () => {
      try {
        const channel = new MessageChannel();
        const port = channel.port1;
        
        port.onmessage = (event) => {
          if (event.data.version) {
            setCurrentVersion(event.data.version);
            setLatestVersion(event.data.version);
          }
        };
        
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) {
          reg.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
        }
      } catch (error) {
        console.warn('Could not get version:', error);
      }
    };

    getVersion();

    // Check if there's an existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        // Check if there's a waiting worker
        if (reg.waiting) {
          handleUpdate(reg);
        }
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleUpdate(reg);
              }
            });
          }
        });
      }
    });

    // Listen for controller change (new service worker activated)
    const handleControllerChange = () => {
      // Page was updated, reload to get fresh content
      console.log('Service worker controller changed, content updated');
      setShowUpdate(false);
      getVersion();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'SW_ACTIVATED' || event.data.type === 'SW_UPDATE')) {
        handleUpdate(event.data.registration, event.data.version);
      }
      
      // Handle version response
      if (event.data && event.data.version && event.data.buildTimestamp) {
        setCurrentVersion(event.data.version);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Start periodic update checking (every 5 minutes)
    checkIntervalRef.current = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      } catch (error) {
        console.warn('Periodic update check failed:', error);
      }
    }, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [autoShow, showDelay]);

  // Update the service worker
  const handleUpdate = useCallback(async () => {
    if (!registration) return;

    setIsUpdating(true);

    try {
      // Send skip waiting message to the waiting service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Also try to update via reload
      window.location.reload();
    } catch (error) {
      console.error('Failed to update:', error);
      setIsUpdating(false);
    }
  }, [registration]);

  // Dismiss the update prompt
  const handleDismiss = useCallback(() => {
    setShowUpdate(false);
  }, []);

  // Manually check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    setIsChecking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        
        // Check if there's a new waiting worker
        if (reg.waiting) {
          setShowUpdate(true);
        }
      }
    } catch (error) {
      console.warn('Manual update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get the latest features and bug fixes
            </p>
            {currentVersion && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current version: {currentVersion}
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{updateButtonText}</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            {dismissButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced hook for programmatic update control with periodic checking
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [version, setVersion] = useState<SWVersion | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);
          
          // Check if there's a waiting worker
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Get version info
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

    checkForUpdates();
    getVersion();

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'SW_ACTIVATED' || event.data.type === 'SW_UPDATE')) {
        setUpdateAvailable(true);
        if (event.data.registration) {
          setRegistration(event.data.registration);
        }
        if (event.data.version) {
          setVersion({
            version: event.data.version,
            buildTimestamp: event.data.buildTimestamp || ''
          });
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Start periodic checking (every 5 minutes)
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
    }, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const updateNow = useCallback(async () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  // Manual check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    setIsChecking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        setLastChecked(new Date());
        
        if (reg.waiting) {
          setUpdateAvailable(true);
        }
      }
    } catch (error) {
      console.warn('Manual update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    updateAvailable,
    updateNow,
    dismissUpdate,
    registration,
    version,
    lastChecked,
    checkForUpdates,
    isChecking
  };
}

export default UpdatePrompt;
