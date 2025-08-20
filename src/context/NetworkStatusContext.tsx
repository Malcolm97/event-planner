'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Helper function to detect mobile devices
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false; // SSR check
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper function to detect if added to home screen (PWA)
// Note: navigator.standalone is not universally supported.
interface CustomNavigator extends Navigator {
  standalone?: boolean;
}

const isAddedToHomeScreen = () => {
  if (typeof navigator === 'undefined') return false; // SSR check
  const customNavigator = navigator as CustomNavigator; // Type assertion
  // Check for standalone mode, which indicates PWA on home screen
  // This might not be reliable across all browsers/OS.
  return customNavigator.standalone || (window.matchMedia('(display-mode: standalone)').matches);
};

interface NetworkStatusContextProps {
  isOnline: boolean;
  isPwaOnMobile: boolean; // New property
  lastSaved: string | null;
  setLastSaved: (timestamp: string | null) => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextProps>({
  isOnline: true,
  isPwaOnMobile: false, // Default to false
  lastSaved: null,
  setLastSaved: () => {},
});

export const NetworkStatusProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with a default that's safe for SSR, then update on client
  const [isOnline, setIsOnline] = useState<boolean>(true); // Default to true for SSR consistency
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isPwaOnMobile, setIsPwaOnMobile] = useState(false); // State for PWA on mobile detection

  useEffect(() => {
    // This effect runs only on the client
    setIsOnline(navigator.onLine); // Update state with actual online status

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add listener for display-mode changes if available
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPwaOnMobile(isMobileDevice() && e.matches);
    };
    displayModeMediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      displayModeMediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const updateLastSaved = (timestamp: string | null) => {
    setLastSaved(timestamp);
  };

  return (
    <NetworkStatusContext.Provider value={{ isOnline, isPwaOnMobile, lastSaved, setLastSaved: updateLastSaved }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);
