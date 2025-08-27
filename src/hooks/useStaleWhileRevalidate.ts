import { useState, useEffect } from 'react';
import { getItems } from '@/lib/indexedDB';
import { supabase, TABLES } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

export function useStaleWhileRevalidate(storeName: string) {
  const [data, setData] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // First, try to load from cache
        const cachedData = await getItems(storeName);
        if (cachedData.length > 0 && isMounted) {
          setData(cachedData as EventItem[]);
          setIsLoading(false);
        }

        // If online, fetch fresh data
        if (isOnline) {
          const { data: freshData, error } = await supabase
            .from(TABLES.EVENTS)
            .select('*')
            .order('date', { ascending: true });

          if (error) throw error;

          if (isMounted) {
            setData(freshData);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading data');
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [storeName, isOnline]);

  return { data, isLoading, error };
}
