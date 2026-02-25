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

  // Handle HTTP 403/401 errors (forbidden/unauthorized - likely admin-only endpoint)
  // Check both error.status (for fetch Response errors) and error message (for thrown Error objects)
  const httpStatusMatch = error?.message?.match(/HTTP\s*(\d{3})/);
  const httpStatus = httpStatusMatch ? parseInt(httpStatusMatch[1], 10) : error?.status;
  
  if (httpStatus === 403 || httpStatus === 401) {
    if (storeName === 'users' || storeName === TABLES.USERS) {
      return `Access restricted. This data requires elevated permissions.`;
    }
    return `Access denied to ${storeName}. Please contact support if this persists.`;
  }

  // Handle empty error objects (common with network/CORS issues or RLS policy denials)
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    // This is likely an RLS policy denial or network issue
    // Check if it's specifically for creators/users endpoint
    if (storeName === 'creators' || storeName === TABLES.USERS) {
      return `Unable to load ${storeName}. Please check your connection or try again later.`;
    }
    return `Unable to connect to ${storeName} service. This may be due to network issues or service unavailability.`;
  }
  
  // Check for Supabase RLS policy denial - common error message patterns
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  if (errorString?.includes('row-level security') || 
      errorString?.includes('RLS') ||
      errorString?.includes('permission denied') ||
      errorString?.includes('PGRST116')) {
    if (storeName === 'creators') {
      return `Unable to load creators. This may be a temporary issue. Please try again.`;
    }
    return `Permission denied. You may need to sign in to access this content.`;
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
          } else if (storeName === TABLES.USERS || storeName === 'creators') {
            // 'creators' uses the same endpoint but doesn't require admin auth
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
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset && isLoadMore) params.set('offset', options.offset.toString());
      if (options.fields) params.set('fields', options.fields);
      if (options.category) params.set('category', options.category);
      if (options.upcoming) params.set('upcoming', 'true');

      const apiUrl = `/api/${storeName}?${params.toString()}`;

      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'default'
        }
      });

      // Handle non-OK responses with detailed error info
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = '';
        try {
          const errorData = await response.json();
          // Prefer userMessage over technical error message for better UX
          if (errorData.userMessage) {
            errorMessage = errorData.userMessage;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Only include details if they contain meaningful data (not empty objects)
          const hasDetails = errorData.details && typeof errorData.details === 'object' && Object.keys(errorData.details).length > 0;
          const hasCode = errorData.code;
          if (hasDetails || hasCode) {
            errorDetails = hasDetails ? JSON.stringify(errorData.details) : errorData.code;
            // Only log in development for debugging
            if (process.env.NODE_ENV === 'development') {
              console.error('API Error:', {
                type: errorData.type,
                code: errorData.code,
                details: errorData.details
              });
            }
          }
        } catch (parseError) {
          // Silently handle parse errors - the HTTP status message is sufficient
        }
        // Create a more descriptive error
        const fullError = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
        throw new Error(fullError);
      }

      // Parse the response - handle both array and object formats
      let freshData: T[] = [];
      let totalRecords: number | null = null;
      
      try {
        const responseData = await response.json();
        
        // Handle new format: { data: [...], count: number }
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          freshData = responseData.data || [];
          totalRecords = responseData.count ?? null;
        } 
        // Handle legacy format: direct array [...]
        else if (Array.isArray(responseData)) {
          freshData = responseData;
        }
        // Fallback
        else {
          console.warn('Unexpected API response format:', responseData);
          freshData = [];
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Failed to parse server response');
      }

      // Debug logging for data fetching
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] API Response for ${storeName}:`, {
          count: freshData.length,
          totalCount: totalRecords,
          sample: freshData.slice(0, 2), // Show first 2 items as sample
          hasImageUrls: freshData.some((item: any) => item.image_urls),
          hasDescriptions: freshData.some((item: any) => item.description),
          fields: freshData.length > 0 ? Object.keys(freshData[0] as any) : []
        });
      }

      // Update state
      setData(prevData => isLoadMore ? [...prevData, ...freshData] : freshData);
      setHasMore(freshData.length === (options.limit || 50));
      setTotalCount(totalRecords);

      // Cache data in background
      try {
        if (storeName === TABLES.EVENTS) {
          const currentUpcomingEvents = (freshData as EventItem[]).filter(isEventCurrentOrUpcoming);
          await (await import('@/lib/indexedDB')).addEvents(currentUpcomingEvents);
        } else if (storeName === TABLES.USERS || storeName === 'creators') {
          // 'creators' uses the same endpoint but doesn't require admin auth
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
  const { data, isLoading, error, setData, refresh } = useOptimizedData<EventItem>(TABLES.EVENTS, {
    limit: 100,
    enablePagination: false
  });
  
  // Filter by category if specified
  const filteredData = category 
    ? data.filter(event => event.category === category)
    : data;

  return { data: filteredData, isLoading, error, setData, refresh };
}

// Category-specific hook
export function useEventsByCategory(category: string) {
  return useEvents(category);
}

// Utility function to trigger cache refresh across the app
export function triggerCacheRefresh(type: 'events' | 'users' | 'all' = 'all') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cache-refreshed', { detail: { type } }));
  }
}
