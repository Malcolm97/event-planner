'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES, Event, Activity, getUserActivities } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/errorHandler';

interface UseDashboardDataResult {
  user: any;
  userEvents: Event[];
  savedEvents: Event[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
  const [user, setUser] = useState<any>(null);
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

      if (fetchError) {
        const appError = handleSupabaseError(fetchError);
        console.error('fetchUserEvents error:', appError);
        throw appError;
      }

      // Validate and filter events
      const validEvents = (data || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      setUserEvents(validEvents as Event[]);
    } catch (err) {
      const appError = err instanceof Error ? err : new Error(String(err));
      setError(`Failed to load your events: ${appError.message}`);
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

      if (savedError) {
        console.error('fetchSavedEvents error:', savedError);
        throw savedError;
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
        console.error('fetchSavedEvents events error:', eventsError);
        throw eventsError;
      }

      // Validate events
      const validEvents = (eventsData || []).filter(event => {
        if (!event || typeof event !== 'object') return false;
        if (!event.id || !event.name) return false;
        return true;
      });

      setSavedEvents(validEvents as Event[]);
    } catch (err) {
      const appError = err instanceof Error ? err : new Error(String(err));
      setError(`Failed to load saved events: ${appError.message}`);
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

  const refetch = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchUserEvents(user.id),
        fetchSavedEvents(user.id),
        fetchUserActivities(user.id)
      ]);
    } catch (err) {
      // Error is already set in individual fetch functions
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserEvents, fetchSavedEvents, fetchUserActivities]);

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
        await Promise.all([
          fetchUserEvents(authUser.id),
          fetchSavedEvents(authUser.id),
          fetchUserActivities(authUser.id)
        ]);

      } catch (err) {
        const appError = err instanceof Error ? err : new Error(String(err));
        setError(`Failed to load dashboard: ${appError.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [fetchUserEvents, fetchSavedEvents, fetchUserActivities]);

  return {
    user,
    userEvents,
    savedEvents,
    activities,
    loading,
    error,
    refetch
  };
}
