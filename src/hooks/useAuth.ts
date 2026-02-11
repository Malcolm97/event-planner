import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection, getSupabaseConnectionStatus } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not configured. Please check your environment variables.');
        setSupabaseError('Supabase is not properly configured');
        setLoading(false);
        return;
      }

      try {
        // Test Supabase connection
        const connectionSuccess = await testSupabaseConnection();
        setSupabaseConnected(connectionSuccess);
        
        if (!connectionSuccess) {
          setSupabaseError('Unable to connect to Supabase database');
        } else {
          setSupabaseError(null);
        }

        // Check current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSupabaseError('Authentication service unavailable');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { 
    user, 
    loading, 
    supabaseConnected, 
    supabaseError,
    connectionStatus: getSupabaseConnectionStatus()
  };
}
