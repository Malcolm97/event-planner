/**
 * SWR-based data fetching hooks for optimal performance
 * Provides caching, deduplication, and real-time updates
 */

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { EventItem } from '@/lib/types';

// Default fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.json();
};

// Default SWR configuration for optimal performance
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Don't revalidate when window gains focus
  revalidateOnReconnect: true, // Revalidate when network reconnects
  shouldRetryOnError: false, // Don't retry on error to avoid spam
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 1, // Only retry once on error
};

/**
 * Hook for fetching events with SWR caching
 * Automatically deduplicates requests and caches responses
 */
export function useEventsSWR(options?: {
  category?: string;
  limit?: number;
  upcoming?: boolean;
  config?: SWRConfiguration;
}) {
  const { category, limit = 50, upcoming, config } = options || {};
  
  // Build query params
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (category) params.set('category', category);
  if (upcoming) params.set('upcoming', 'true');
  
  const query = params.toString();
  const key = `/api/events${query ? `?${query}` : ''}`;
  
  const { data, error, isLoading, mutate: revalidate } = useSWR<{
    data: EventItem[];
    count: number | null;
  }>(key, fetcher, {
    ...defaultConfig,
    ...config,
  });

  return {
    events: data?.data || [],
    totalCount: data?.count || null,
    isLoading,
    isError: !!error,
    error,
    revalidate,
  };
}

/**
 * Hook for fetching a single event by ID
 */
export function useEventSWR(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<EventItem>(
    id ? `/api/events/${id}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    event: data,
    isLoading,
    isError: !!error,
    error,
    revalidate,
  };
}

/**
 * Hook for fetching stats with longer cache duration
 */
export function useStatsSWR(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{
    totalUsers: number;
    totalEvents: number;
    citiesCovered: number;
  }>('/api/stats', fetcher, {
    ...defaultConfig,
    dedupingInterval: 30000, // Cache stats for 30 seconds
    revalidateOnReconnect: false, // Don't revalidate stats on reconnect
    ...config,
  });

  return {
    stats: data || { totalUsers: 0, totalEvents: 0, citiesCovered: 0 },
    isLoading,
    isError: !!error,
    error,
    revalidate,
  };
}

/**
 * Prefetch events data (useful for link hover)
 */
export function prefetchEvents(options?: { category?: string; limit?: number }) {
  const { category, limit = 50 } = options || {};
  
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (category) params.set('category', category);
  
  const query = params.toString();
  const key = `/api/events${query ? `?${query}` : ''}`;
  
  return mutate(key, fetcher(key));
}

/**
 * Prefetch a single event (useful for link hover)
 */
export function prefetchEvent(id: string) {
  return mutate(`/api/events/${id}`, fetcher(`/api/events/${id}`));
}

/**
 * Revalidate all events data (useful after mutations)
 */
export function revalidateAllEvents() {
  return mutate(
    (key: string) => typeof key === 'string' && key.startsWith('/api/events'),
    undefined,
    { revalidate: true }
  );
}

export default {
  useEventsSWR,
  useEventSWR,
  useStatsSWR,
  prefetchEvents,
  prefetchEvent,
  revalidateAllEvents,
};