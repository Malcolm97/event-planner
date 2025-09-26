import { useState, useEffect } from 'react';
import { getItems, addItems } from '@/lib/indexedDB';
import { supabase, TABLES } from '@/lib/supabase';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { EventItem } from '@/lib/types';

export function useOfflineFirstData<T>(storeName: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // First load cached data (with expiration check for events)
        let cachedData: T[] = [];
        let cacheExpired = false;
        if (storeName === 'events') {
          // Use getEvents for expiration logic
          cachedData = (await (await import('@/lib/indexedDB')).getEvents()) as T[];
          cacheExpired = cachedData.length === 0;
        } else {
          cachedData = await getItems(storeName);
        }
        if (cachedData.length > 0 && mounted) {
          setData(cachedData as T[]);
          setIsLoading(false);
        }

        // If online, fetch fresh data (or if cache expired)
        if (isOnline || cacheExpired) {
          const { data: freshData, error } = await supabase
            .from(storeName)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (mounted) {
            setData(freshData as T[]);
            // Update cache
            await addItems(storeName, freshData);
            setIsLoading(false);
          }
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

    return () => {
      mounted = false;
    };
  }, [storeName, isOnline]);

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
