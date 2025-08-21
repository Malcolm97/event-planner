'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkStatusContextType {
  isOnline: boolean;
  isPwaOnMobile: boolean; // Added to resolve the type error
  lastSaved: string | null;
  setLastSaved: (timestamp: string) => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const NetworkStatusProvider = ({ children }: { children: ReactNode }) => {
const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPwaOnMobile, setIsPwaOnMobile] = useState(false); // Added to resolve the type error
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if PWA on mobile (basic check)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPwaOnMobile(isMobile && isStandalone); // Added to resolve the type error

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, isPwaOnMobile, lastSaved, setLastSaved }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};
