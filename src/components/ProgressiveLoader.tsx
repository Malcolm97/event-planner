import React, { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number; // Delay before showing content (for perceived performance)
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
}

const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  fallback,
  delay = 0,
  priority = 'medium',
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const { connectionQuality, isOnline } = useNetworkStatus();

  // Determine loading priority based on connection and priority setting
  const getLoadingDelay = useCallback(() => {
    if (!isOnline) return 0; // Show immediately when offline

    const baseDelay = delay;

    // Adjust delay based on connection quality
    switch (connectionQuality) {
      case 'poor':
        return baseDelay + 500; // Add extra time for poor connections
      case 'fair':
        return baseDelay + 200;
      case 'good':
      case 'excellent':
        return baseDelay;
      default:
        return baseDelay + 100;
    }
  }, [connectionQuality, isOnline, delay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      onLoad?.();
    }, getLoadingDelay());

    return () => clearTimeout(timer);
  }, [getLoadingDelay, onLoad]);

  useEffect(() => {
    if (isLoaded) {
      // Small additional delay for smooth transition
      const transitionTimer = setTimeout(() => {
        setShowContent(true);
      }, 50);

      return () => clearTimeout(transitionTimer);
    }
  }, [isLoaded]);

  // Show fallback while loading
  if (!isLoaded) {
    return fallback ? <>{fallback}</> : (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-32 w-full mb-4"></div>
        <div className="space-y-3">
          <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          <div className="bg-gray-200 rounded h-4 w-1/2"></div>
          <div className="bg-gray-200 rounded h-4 w-2/3"></div>
        </div>
      </div>
    );
  }

  // Show content with fade-in animation
  return (
    <div
      className={`transition-opacity duration-300 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

// Hook for progressive data loading
export function useProgressiveData<T>(
  fetcher: () => Promise<T>,
  options: {
    delay?: number;
    priority?: 'high' | 'medium' | 'low';
    enabled?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const { delay = 0, priority = 'medium', enabled = true } = options;
  const { connectionQuality, isOnline } = useNetworkStatus();

  const loadData = useCallback(async () => {
    if (!enabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add delay based on priority and connection
      const loadingDelay = priority === 'high' ? 0 :
                          priority === 'low' ? delay + 500 :
                          delay;

      if (loadingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, loadingDelay));
      }

      const result = await fetcher();
      setData(result);
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, delay, priority, enabled, isLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    isComplete,
    refetch: loadData
  };
}

// Progressive enhancement component
export function ProgressiveEnhancement({
  children,
  enhancement,
  condition = true
}: {
  children: React.ReactNode;
  enhancement: React.ReactNode;
  condition?: boolean;
}) {
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    if (condition) {
      // Small delay to allow base content to render first
      const timer = setTimeout(() => setEnhanced(true), 100);
      return () => clearTimeout(timer);
    }
  }, [condition]);

  return (
    <>
      {children}
      {enhanced && enhancement}
    </>
  );
}

export default ProgressiveLoader;
