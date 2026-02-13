'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES, Event, Activity, User, getUserActivities } from '@/lib/supabase';

interface UseDashboardDataResult {
  user: any;
  userProfile: User | null;
  userEvents: Event[];
  savedEvents: Event[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEvents = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });

      // Handle error gracefully - don't throw
      if (fetchError) {
        console.warn('Failed to fetch user events:', fetchError.message);
        setUserEvents([]);
        return;
      }

      // Validate and filter events
      const validEvents = (data || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      setUserEvents(validEvents as Event[]);
    } catch (err) {
      console.warn('Failed to load user events:', err);
      setUserEvents([]);
    }
  }, []);

  const fetchSavedEvents = useCallback(async (userId: string) => {
    try {
      // Get saved event IDs
      const { data: savedEventsData, error: savedError } = await supabase
        .from(TABLES.SAVED_EVENTS)
        .select('event_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Handle errors gracefully - don't throw
      if (savedError) {
        console.warn('Failed to fetch saved events:', savedError.message);
        setSavedEvents([]);
        return;
      }

      if (!savedEventsData || savedEventsData.length === 0) {
        setSavedEvents([]);
        return;
      }

      // Get full event details
      const eventIds = savedEventsData.map(item => item.event_id);
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true });

      if (eventsError) {
        console.warn('Could not fetch event details:', eventsError.message);
        setSavedEvents([]);
        return;
      }

      // Validate events
      const validEvents = (eventsData || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      setSavedEvents(validEvents as Event[]);
    } catch (err) {
      console.warn('Failed to load saved events:', err);
      setSavedEvents([]);
    }
  }, []);

  const fetchUserActivities = useCallback(async (userId: string) => {
    try {
      const activitiesData = await getUserActivities(userId, 20);
      setActivities(activitiesData);
    } catch (err) {
      // Activities are not critical, so we don't set a main error
      console.warn('Failed to load activities:', err);
      setActivities([]);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        // If user not found, set profile to null (user may not have created profile yet)
        if (fetchError.code === 'PGRST116') {
          console.warn('User profile not yet created:', userId);
          setUserProfile(null);
          return;
        }
        // Handle RLS or other errors
        console.warn('Failed to fetch user profile:', fetchError.message);
        setUserProfile(null);
        return;
      }

      setUserProfile(data as User);
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      setUserProfile(null);
    }
  }, []);

  // Function to fetch all dashboard data
  const fetchAllData = useCallback(async (authUser: any) => {
    try {
      // Fetch all data in parallel with fresh fetch
      await Promise.all([
        fetchUserEvents(authUser.id),
        fetchSavedEvents(authUser.id),
        fetchUserActivities(authUser.id),
        fetchUserProfile(authUser.id)
      ]);
    } catch (err) {
      console.warn('Error fetching dashboard data:', err);
    }
  }, [fetchUserEvents, fetchSavedEvents, fetchUserActivities, fetchUserProfile]);

  const refetch = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await fetchAllData(user);
    } catch (err) {
      // Error is already handled in individual fetch functions
    } finally {
      setLoading(false);
    }
  }, [user, fetchAllData]);

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

        // Fetch all data in parallel
        await fetchAllData(authUser);

      } catch (err) {
        const appError = err instanceof Error ? err : new Error(String(err));
        setError(`Failed to load dashboard: ${appError.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [fetchAllData]);

  // Refetch data when window gains focus (user returns from edit-profile or other pages)
  useEffect(() => {
    const handleFocus = async () => {
      if (user) {
        // Refresh auth state and fetch latest data
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await fetchAllData(currentUser);
        }
      }
    };

    // Add focus listener
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchAllData]);

  return {
    user,
    userProfile,
    userEvents,
    savedEvents,
    activities,
    loading,
    error,
    refetch
  };
}
