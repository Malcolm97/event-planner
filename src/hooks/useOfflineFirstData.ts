import { useState, useEffect } from 'react';
import { getItems, addItems } from '@/lib/indexedDB';
import { supabase, TABLES } from '@/lib/supabase';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { EventItem } from '@/lib/types';
import { isEventCurrentOrUpcoming } from '@/lib/utils';

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
          try {
            const { data: freshData, error: fetchError } = await supabase
              .from(storeName)
              .select('*')
              .order('created_at', { ascending: false });

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
            console.error(`Failed to fetch fresh ${storeName}:`, fetchError);
            // If we have cached data, keep using it; otherwise show error
            if (cachedData.length === 0 && mounted) {
              setError(fetchError instanceof Error ? fetchError.message : 'Failed to load data');
              setIsLoading(false);
            }
          }
        } else if (cachedData.length === 0 && mounted) {
          // Offline with no cached data
          setError('No cached data available. Please check your connection.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Error in useOfflineFirstData(${storeName}):`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
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
