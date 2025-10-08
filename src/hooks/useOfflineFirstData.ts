import { useState, useEffect } from 'react';
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
  console.error(`[${new Date().toISOString()}] Error in ${context} for ${storeName}:`, {
    error,
    errorType: typeof error,
    errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'N/A',
    isSupabaseConfigured: isSupabaseConfigured(),
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent,
    url: window.location.href
  });
}

export function useOfflineFirstData<T>(storeName: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline, isPwaOnMobile } = useNetworkStatus();

  useEffect(() => {
    let mounted = true;

    const loadData = async (forceRefresh = false) => {
      try {
        setIsLoading(true);
        setError(null);

        // First load cached data immediately for better UX
        let cachedData: T[] = [];
        let cacheExpired = false;

        try {
          if (storeName === 'events') {
            cachedData = (await (await import('@/lib/indexedDB')).getEvents()) as T[];
            cacheExpired = cachedData.length === 0;
          } else if (storeName === 'users') {
            cachedData = (await (await import('@/lib/indexedDB')).getUsers()) as T[];
            cacheExpired = cachedData.length === 0;
          } else {
            cachedData = await getItems(storeName);
          }
        } catch (cacheError) {
          console.warn(`Failed to load cached ${storeName}:`, cacheError);
          cacheExpired = true;
        }

        // Always show cached data first if available (even if expired) for better UX
        if (cachedData.length > 0 && mounted) {
          setData(cachedData as T[]);
          setIsLoading(false);
        } else if (cacheExpired && mounted) {
          // If no cached data and cache expired, show loading until fresh data loads
          setIsLoading(true);
        }

        // Fetch fresh data in background if online or cache expired
        if (isOnline || cacheExpired) {
          // Check if Supabase is properly configured before making requests
          if (!isSupabaseConfigured()) {
            console.warn(`Supabase not configured, skipping fresh data fetch for ${storeName}`);
            if (cachedData.length === 0 && mounted) {
              setError('Service configuration error. Please contact support.');
              setIsLoading(false);
            }
            return;
          }

          // Log Supabase configuration for debugging
          console.log(`Attempting to fetch ${storeName} from Supabase:`, {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            isConfigured: isSupabaseConfigured(),
            isOnline: isOnline
          });

          // Test basic Supabase connectivity
          try {
            const { data: testData, error: testError } = await supabase
              .from('events')
              .select('count')
              .limit(1)
              .single();

            if (testError) {
              console.warn(`Supabase connectivity test failed:`, testError);
            } else {
              console.log(`Supabase connectivity test passed`);
            }
          } catch (connectivityError) {
            console.error(`Supabase connectivity test error:`, connectivityError);
          }

          try {
            let freshData: T[] | null = null;
            let fetchError: any = null;

            try {
              const result = await supabase
                .from(storeName)
                .select('*')
                .order('created_at', { ascending: false });

              freshData = result.data;
              fetchError = result.error;
            } catch (networkError) {
              // Catch network-level errors that Supabase might not wrap properly
              console.warn(`Network error during ${storeName} fetch:`, networkError);
              throw networkError;
            }

            if (fetchError) throw fetchError;

            if (mounted && freshData) {
              // Update state with fresh data
              setData(freshData as T[]);

              // Update cache in background - don't block UI
              try {
                if (storeName === TABLES.EVENTS) {
                  const currentUpcomingEvents = (freshData as EventItem[]).filter(isEventCurrentOrUpcoming);
                  await (await import('@/lib/indexedDB')).addEvents(currentUpcomingEvents);
                } else if (storeName === TABLES.USERS) {
                  await (await import('@/lib/indexedDB')).addUsers(freshData);
                } else {
                  await addItems(storeName, freshData);
                }
              } catch (cacheUpdateError) {
                console.warn(`Failed to update ${storeName} cache:`, cacheUpdateError);
                // Don't fail the whole operation if caching fails
              }

              setIsLoading(false);
            }
          } catch (fetchError) {
            logDetailedError(fetchError, storeName, 'fetch fresh data');
            // If we have cached data, keep using it; otherwise show error
            if (cachedData.length === 0 && mounted) {
              setError(getErrorMessage(fetchError, storeName));
              setIsLoading(false);
            }
          }
        } else if (cachedData.length === 0 && mounted) {
          // Offline with no cached data
          setError('No cached data available. Please check your connection.');
          setIsLoading(false);
        }
      } catch (err) {
        logDetailedError(err, storeName, 'useOfflineFirstData main');
        if (mounted) {
          setError(getErrorMessage(err, storeName));
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Listen for cache refresh events (useful for PWA manual refresh)
    const handleCacheRefresh = (event: CustomEvent) => {
      if (event.detail?.type === storeName || event.detail?.type === 'all') {
        console.log(`Cache refresh triggered for ${storeName}, reloading data...`);
        loadData(true);
      }
    };

    window.addEventListener('cache-refreshed', handleCacheRefresh as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('cache-refreshed', handleCacheRefresh as EventListener);
    };
  }, [storeName, isOnline, isPwaOnMobile]);

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
