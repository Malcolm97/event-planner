import { useState, useEffect, useCallback, useRef } from 'react';
import { getItems, addItems } from '@/lib/indexedDB';
import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { EventItem } from '@/lib/types';
import { isEventCurrentOrUpcoming } from '@/lib/utils';

// Helper function to check network connectivity
function isNetworkAvailable(): boolean {
  return navigator.onLine;
}

// Helper function to extract meaningful error messages
function getErrorMessage(error: any, storeName: string): string {
  // Check network connectivity first
  if (!isNetworkAvailable()) {
    return `No internet connection. Please check your network and try again.`;
  }

  // Handle empty error objects (common with network/CORS issues)
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return `Unable to connect to ${storeName} service. This may be due to network issues or service unavailability.`;
  }

  // Handle Supabase error objects
  if (typeof error === 'object' && error.message) {
    // Check for common Supabase error patterns
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      return `Authentication error. Please sign in again.`;
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return `Network error connecting to ${storeName} service. Please check your connection.`;
    }
    if (error.code === 'PGRST116') {
      return `${storeName} table not found. Please contact support.`;
    }
    if (error.code === '42501') {
      return `Permission denied accessing ${storeName}. Please contact support.`;
    }
    return error.message;
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check for network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return `Network error: ${error.message}`;
    }
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return `Failed to load ${storeName}. Please try again later.`;
}

// Helper function to log detailed error information
function logDetailedError(error: any, storeName: string, context: string) {
  const isEmptyError = !error || (typeof error === 'object' && Object.keys(error).length === 0);

  console.error(`[${new Date().toISOString()}] Error in ${context} for ${storeName}:`, {
    error: isEmptyError ? 'Empty error object (likely network/CORS issue)' : error,
    errorType: typeof error,
    errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'N/A',
    isSupabaseConfigured: isSupabaseConfigured(),
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
}

interface UseOptimizedDataOptions {
  limit?: number;
  offset?: number;
  fields?: string;
  category?: string;
  upcoming?: boolean;
  refreshInterval?: number; // in milliseconds
  enablePagination?: boolean;
}

export function useOptimizedData<T>(
  storeName: string,
  options: UseOptimizedDataOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const { isOnline, connectionQuality } = useNetworkStatus();
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize options to prevent unnecessary re-fetches
  const memoizedOptions = useRef(options);
  memoizedOptions.current = options;

  const fetchData = useCallback(async (
    isLoadMore = false,
    forceRefresh = false
  ): Promise<void> => {
    const opts = memoizedOptions.current;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      if (!isLoadMore) {
        setIsLoading(true);
        setError(null);
      }

      // Load cached data first for immediate UI feedback
      if (!forceRefresh && !isLoadMore) {
        try {
          let cachedData: T[] = [];
          if (storeName === TABLES.EVENTS) {
            const { getEvents } = await import('@/lib/indexedDB');
            cachedData = (await getEvents()) as T[];
          } else if (storeName === TABLES.USERS) {
            const { getUsers } = await import('@/lib/indexedDB');
            cachedData = (await getUsers()) as T[];
          } else {
            cachedData = await getItems(storeName);
          }

          if (cachedData.length > 0) {
            setData(cachedData as any);
            setIsLoading(false);
          }
        } catch (cacheError) {
          console.warn(`Failed to load cached ${storeName}:`, cacheError);
        }
      }

      // Skip network request on poor connections unless forced
      if (!isOnline || connectionQuality === 'poor') {
        if (!isLoadMore) setIsLoading(false);
        return;
      }

      // Check Supabase configuration
      if (!isSupabaseConfigured()) {
        if (!isLoadMore) {
          setError('Service configuration error. Please contact support.');
          setIsLoading(false);
        }
        return;
      }

      // Build API URL with optimized parameters
      const params = new URLSearchParams();
      if (opts.limit) params.set('limit', opts.limit.toString());
      if (opts.offset && isLoadMore) params.set('offset', opts.offset.toString());
      if (opts.fields) params.set('fields', opts.fields);
      if (opts.category) params.set('category', opts.category);
      if (opts.upcoming) params.set('upcoming', 'true');

      const apiUrl = `/api/${storeName}?${params.toString()}`;

      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'default'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const freshData: T[] = await response.json();

      // Debug logging for data fetching
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] API Response for ${storeName}:`, {
          count: freshData.length,
          sample: freshData.slice(0, 2), // Show first 2 items as sample
          hasImageUrls: freshData.some((item: any) => item.image_urls),
          hasDescriptions: freshData.some((item: any) => item.description),
          fields: freshData.length > 0 ? Object.keys(freshData[0] as any) : []
        });
      }

      // Update state
      setData(prevData => isLoadMore ? [...prevData, ...freshData] : freshData);
      setHasMore(freshData.length === (opts.limit || 50));
      setTotalCount(response.headers.get('x-total-count') ? parseInt(response.headers.get('x-total-count')!) : null);

      // Cache data in background
      try {
        if (storeName === TABLES.EVENTS) {
          const currentUpcomingEvents = (freshData as EventItem[]).filter(isEventCurrentOrUpcoming);
          await (await import('@/lib/indexedDB')).addEvents(currentUpcomingEvents);
        } else if (storeName === TABLES.USERS) {
          await (await import('@/lib/indexedDB')).addUsers(freshData);
        } else {
          await addItems(storeName, freshData);
        }
      } catch (cacheError) {
        console.warn(`Failed to cache ${storeName}:`, cacheError);
      }

      if (!isLoadMore) setIsLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') return; // Request was cancelled

      logDetailedError(err, storeName, 'fetchData');
      if (!isLoadMore) {
        setError(getErrorMessage(err, storeName));
        setIsLoading(false);
      }
    }
  }, [storeName, isOnline, connectionQuality]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    const opts = memoizedOptions.current;
    const newOffset = data.length;
    memoizedOptions.current = { ...opts, offset: newOffset };
    fetchData(true);
  }, [hasMore, isLoading, data.length, fetchData]);

  const refresh = useCallback(() => {
    fetchData(false, true);
  }, [fetchData]);

  // Initial data load
  useEffect(() => {
    fetchData();

    // Set up periodic refresh if specified
    if (options.refreshInterval && options.refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchData(false, true);
      }, options.refreshInterval);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [storeName]); // Only depend on storeName to prevent unnecessary re-fetches

  // Listen for cache refresh events
  useEffect(() => {
    const handleCacheRefresh = (event: CustomEvent) => {
      if (event.detail?.type === storeName || event.detail?.type === 'all') {
        console.log(`Cache refresh triggered for ${storeName}`);
        fetchData(false, true);
      }
    };

    window.addEventListener('cache-refreshed', handleCacheRefresh as EventListener);
    return () => window.removeEventListener('cache-refreshed', handleCacheRefresh as EventListener);
  }, [storeName, fetchData]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    setData
  };
}

// Legacy hook for backward compatibility - now uses optimized version
export function useOfflineFirstData<T>(storeName: string) {
  const { data, isLoading, error, setData } = useOptimizedData<T>(storeName, {
    limit: 50,
    enablePagination: false
  });

  return { data, isLoading, error, setData };
}

// Event-specific hook with proper typing
export function useEvents(category?: string) {
  const { data, isLoading, error, setData } = useOfflineFirstData<EventItem>(TABLES.EVENTS);
  
  // Filter by category if specified
  const filteredData = category 
    ? data.filter(event => event.category === category)
    : data;

  return { data: filteredData, isLoading, error, setData };
}

// Category-specific hook
export function useEventsByCategory(category: string) {
  return useEvents(category);
}
