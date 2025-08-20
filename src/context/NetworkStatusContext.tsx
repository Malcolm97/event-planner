'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface NetworkStatusContextProps {
  isOnline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextProps>({ isOnline: true });

export const NetworkStatusProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);
