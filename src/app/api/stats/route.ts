import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

// Public endpoint for fetching site statistics
// Primary: Uses RPC function (get_public_stats) which bypasses RLS
// Fallback: Uses optimized direct queries with service role key or anon key
export async function GET() {
  try {
    // Method 1: Try RPC function first (most reliable if set up)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_stats');
      
      if (!rpcError && rpcData) {
        console.log('Stats API - RPC method successful:', rpcData);
        const response = NextResponse.json(rpcData);
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        return response;
      }
      
      if (rpcError) {
        console.warn('Stats API - RPC method failed, falling back to direct queries:', rpcError.message);
      }
    } catch (rpcErr: any) {
      console.warn('Stats API - RPC not available, falling back to direct queries:', rpcErr.message);
    }

    // Method 2: Fallback to optimized direct queries with server client
    const cookieStore = await cookies();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Use service role key if available (for admin-level access), otherwise use anon key
    const serverClient = createServerClient(
      supabaseUrl,
      serviceRoleKey || anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie setting errors in server components
            }
          },
        },
      }
    );

    // OPTIMIZATION: Execute all queries in parallel
    // Use count queries with head:true for efficiency (no data transfer)
    const [usersResult, eventsResult, locationsResult] = await Promise.all([
      // Get users count - head:true for efficiency
      serverClient
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Get events count - head:true for efficiency
      serverClient
        .from('events')
        .select('id', { count: 'exact', head: true }),
      
      // OPTIMIZATION: Only select location field, not all fields
      // This significantly reduces data transfer for city calculation
      serverClient
        .from('events')
        .select('location')
        .not('location', 'is', null)
    ]);

    if (usersResult.error) {
      console.error('Stats API - Users query error:', usersResult.error);
    }

    if (eventsResult.error) {
      console.error('Stats API - Events query error:', eventsResult.error);
    }

    if (locationsResult.error) {
      console.error('Stats API - Locations query error:', locationsResult.error);
    }

    // OPTIMIZATION: Calculate unique cities efficiently
    // Use a Set for O(1) lookups instead of array operations
    let citiesCovered = 0;
    if (locationsResult.data && locationsResult.data.length > 0) {
      const uniqueCities = new Set<string>();
      for (const event of locationsResult.data) {
        if (event.location) {
          // Extract city name (first part before comma)
          const cityPart = event.location.split(',')[0]?.trim();
          if (cityPart) {
            uniqueCities.add(cityPart.toLowerCase()); // Normalize to lowercase for deduplication
          }
        }
      }
      citiesCovered = uniqueCities.size;
    }

    const stats = {
      totalUsers: usersResult.count || 0,
      totalEvents: eventsResult.count || 0,
      citiesCovered
    };

    console.log('Stats API - Direct query method returning:', stats);

    const response = NextResponse.json(stats);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error: any) {
    console.error('Stats API - Error fetching stats:', error.message);
    
    // Return fallback values instead of erroring
    return NextResponse.json({
      totalUsers: 0,
      totalEvents: 0,
      citiesCovered: 0
    });
  }
}