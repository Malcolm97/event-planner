import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Public endpoint for fetching site statistics
// Uses service role key if available, otherwise falls back to anon key with different query approach
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Check if service role key is available for admin-level access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Use service role key if available (for admin-level access), otherwise use anon key
    const supabase = createServerClient(
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

    // Fetch users count - use actual data query instead of head:true for better RLS compatibility
    const { data: usersData, error: usersError, count: usersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .limit(1); // Limit to 1 row for efficiency, we just want the count

    if (usersError) {
      console.error('Stats API - Users query error:', usersError);
    }

    // Fetch events count
    const { data: eventsData, error: eventsError, count: eventsCount } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .limit(1);

    if (eventsError) {
      console.error('Stats API - Events query error:', eventsError);
    }

    // Get unique cities from events
    const { data: locationsData, error: locationsError } = await supabase
      .from('events')
      .select('location');

    if (locationsError) {
      console.error('Stats API - Locations query error:', locationsError);
    }

    let citiesCovered = 0;
    if (locationsData && locationsData.length > 0) {
      const uniqueCities = new Set<string>();
      locationsData.forEach((event: any) => {
        if (event.location) {
          const firstPart = event.location.split(',')[0]?.trim();
          if (firstPart) {
            uniqueCities.add(firstPart);
          }
        }
      });
      citiesCovered = uniqueCities.size;
    }

    const stats = {
      totalUsers: usersCount || 0,
      totalEvents: eventsCount || 0,
      citiesCovered
    };

    console.log('Stats API - Returning stats:', stats);

    const response = NextResponse.json(stats);
    
    // Cache for 60 seconds on CDN, allow stale content for 120 seconds
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
