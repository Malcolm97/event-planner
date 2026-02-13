import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection, getSupabaseConnectionStatus } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not configured. Please check your environment variables.');
        setSupabaseError('Supabase is not properly configured');
        setLoading(false);
        return;
      }

      try {
        // Test Supabase connection (non-blocking)
        // Don't block auth on connection test - just check config
        const connectionSuccess = await testSupabaseConnection();
        
        if (isMounted) {
          setSupabaseConnected(connectionSuccess);
          
          if (!connectionSuccess) {
            console.warn('Supabase connection issue - continuing with auth anyway');
            // Don't set error - allow app to work in degraded mode
          }
        }

        // Check current user regardless of connection status
        const { data: { user } } = await supabase.auth.getUser();
        
        if (isMounted) {
          setUser(user);
        }
      } catch (error: any) {
        // Handle AbortError or cancellation gracefully
        if (error?.name === 'AbortError' || error?.message?.includes('signal is aborted')) {
          console.warn('Auth initialization was interrupted');
        } else if (isMounted) {
          console.warn('Auth initialization error:', error?.message);
          // Don't set error - allow app to work without Supabase
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { 
    user, 
    loading, 
    supabaseConnected, 
    supabaseError,
    connectionStatus: getSupabaseConnectionStatus()
  };
}
