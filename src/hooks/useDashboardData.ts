'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, TABLES, Event, Activity, User, getUserActivities, isSupabaseConfigured, getSupabaseConnectionStatus, USER_FIELDS } from '@/lib/supabase';
import { getEvents, addEvents, getUsers, addUsers, getSyncStatus, updateSyncStatus } from '@/lib/indexedDB';
import { normalizeUser } from '@/lib/types';

interface UseDashboardDataResult {
  user: any;
  userProfile: User | null;
  userEvents: Event[];
  savedEvents: Event[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
  connectionError: string | null;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

// Cache key for dashboard data
const DASHBOARD_CACHE_KEY = 'dashboard-cache';
const MIN_REFETCH_INTERVAL = 30000; // 30 seconds minimum between refetches

export function useDashboardData(): UseDashboardDataResult {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for debouncing and preventing race conditions
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Load cached data from IndexedDB
  const loadCachedData = useCallback(async (userId: string) => {
    try {
      // Try to load cached events
      const cachedEvents = await getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        const userCachedEvents = cachedEvents.filter((e: any) => e.created_by === userId);
        if (userCachedEvents.length > 0) {
          setUserEvents(userCachedEvents as Event[]);
        }
      }

      // Try to load cached users (for profile)
      const cachedUsers = await getUsers();
      if (cachedUsers && cachedUsers.length > 0) {
        const userProfile = cachedUsers.find((u: any) => u.id === userId);
        if (userProfile) {
          setUserProfile(userProfile as User);
        }
      }

      // Load last sync time
      const syncStatus = await getSyncStatus();
      if (syncStatus?.lastSync) {
        setLastUpdated(new Date(syncStatus.lastSync));
      }
    } catch (err) {
      console.warn('Failed to load cached dashboard data:', err);
    }
  }, []);

  // Cache data to IndexedDB
  const cacheData = useCallback(async (events: Event[], profile: User | null) => {
    try {
      if (events.length > 0) {
        await addEvents(events);
      }
      if (profile) {
        await addUsers([profile]);
      }
      await updateSyncStatus({ lastSync: Date.now(), inProgress: false });
    } catch (err) {
      console.warn('Failed to cache dashboard data:', err);
    }
  }, []);

  const fetchUserEvents = useCallback(async (userId: string): Promise<Event[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });

      if (fetchError) {
        console.warn('Failed to fetch user events:', fetchError.message);
        return [];
      }

      const validEvents = (data || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      return validEvents as Event[];
    } catch (err) {
      console.warn('Failed to load user events:', err);
      return [];
    }
  }, []);

  const fetchSavedEvents = useCallback(async (userId: string): Promise<Event[]> => {
    try {
      const { data: savedEventsData, error: savedError } = await supabase
        .from(TABLES.SAVED_EVENTS)
        .select('event_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.warn('Failed to fetch saved events:', savedError.message);
        return [];
      }

      if (!savedEventsData || savedEventsData.length === 0) {
        return [];
      }

      const eventIds = savedEventsData.map(item => item.event_id);
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true });

      if (eventsError) {
        console.warn('Could not fetch event details:', eventsError.message);
        return [];
      }

      const validEvents = (eventsData || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      return validEvents as Event[];
    } catch (err) {
      console.warn('Failed to load saved events:', err);
      return [];
    }
  }, []);

  const fetchUserActivities = useCallback(async (userId: string): Promise<Activity[]> => {
    try {
      const activitiesData = await getUserActivities(userId, 20);
      return activitiesData;
    } catch (err) {
      console.warn('Failed to load activities:', err);
      return [];
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.warn('User profile not yet created:', userId);
          return null;
        }
        console.warn('Failed to fetch user profile:', fetchError.message);
        return null;
      }

      // Normalize the user data to include both field name variants
      // Database uses 'full_name' and 'avatar_url', but code may expect 'name' and 'photo_url'
      const profileData = normalizeUser(data) as User;
      
      // Get email from auth user if not in profile
      if (!profileData.email) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          profileData.email = authUser.email;
        }
      }
      return profileData;
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      return null;
    }
  }, []);

  // Main data fetching function with caching
  const fetchAllData = useCallback(async (authUser: any, isRefresh = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Check minimum interval for refreshes
    const now = Date.now();
    if (isRefresh && (now - lastFetchTimeRef.current) < MIN_REFETCH_INTERVAL) {
      isFetchingRef.current = false;
      return;
    }
    lastFetchTimeRef.current = now;

    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch all data in parallel
      const [events, saved, acts, profile] = await Promise.all([
        fetchUserEvents(authUser.id),
        fetchSavedEvents(authUser.id),
        fetchUserActivities(authUser.id),
        fetchUserProfile(authUser.id)
      ]);

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setUserEvents(events);
        setSavedEvents(saved);
        setActivities(acts);
        setUserProfile(profile);
        setLastUpdated(new Date());
        setError(null);

        // Cache the data for offline use
        await cacheData(events, profile);
      }
    } catch (err) {
      console.warn('Error fetching dashboard data:', err);
      if (mountedRef.current && !isRefresh) {
        const appError = err instanceof Error ? err : new Error(String(err));
        setError(`Failed to load dashboard: ${appError.message}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [fetchUserEvents, fetchSavedEvents, fetchUserActivities, fetchUserProfile, cacheData]);

  // Initial load - show cached data first, then fetch fresh
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          setError('Please sign in to view your dashboard');
          setLoading(false);
          return;
        }

        setUser(authUser);

        // Load cached data first for instant display
        await loadCachedData(authUser.id);

        // Then fetch fresh data
        await fetchAllData(authUser, false);

      } catch (err) {
        const appError = err instanceof Error ? err : new Error(String(err));
        setError(`Failed to load dashboard: ${appError.message}`);
        setLoading(false);
      }
    };

    initializeDashboard();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAllData, loadCachedData]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    if (!user) return;
    await fetchAllData(user, true);
  }, [user, fetchAllData]);

  // Debounced focus refetch - only refetch if more than 30 seconds have passed
  useEffect(() => {
    const handleFocus = async () => {
      if (user && !isFetchingRef.current) {
        const now = Date.now();
        if ((now - lastFetchTimeRef.current) >= MIN_REFETCH_INTERVAL) {
          await fetchAllData(user, true);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchAllData]);

  // Visibility change handler for mobile
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user && !isFetchingRef.current) {
        const now = Date.now();
        if ((now - lastFetchTimeRef.current) >= MIN_REFETCH_INTERVAL) {
          await fetchAllData(user, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchAllData]);

  // Connection status
  const isConnected = getSupabaseConnectionStatus() === 'connected';
  const connectionError = !isSupabaseConfigured() ? 'Supabase is not configured' : null;

  return {
    user,
    userProfile,
    userEvents,
    savedEvents,
    activities,
    loading,
    error,
    refetch,
    isConnected,
    connectionError,
    isRefreshing,
    lastUpdated
  };
}