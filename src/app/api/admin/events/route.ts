import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      const isProfileNotFound = profileError.code === 'PGRST116' ||
                               profileError.message?.includes('No rows found') ||
                               profileError.code === 'PGRST204' ||
                               !profileError.code

      if (isProfileNotFound) {
        return { isAdmin: false, error: 'Profile not found' }
      } else {
        return { isAdmin: false, error: 'Database error' }
      }
    }

    return { isAdmin: profile?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: 'Unexpected error' }
  }
}

export async function GET(request: Request) {
  // Admin API routes are now publicly accessible - no authentication required
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let query = supabase
      .from("events")
      .select(`
        *,
        categories (
          name
        )
      `)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
    }

    if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'pending') {
      query = query.eq('approved', false)
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting events count:", countError)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching events:", error)
      return NextResponse.json(
        { error: "Failed to fetch events", details: error.message },
        { status: 500 }
      )
    }

    // Enrich data with creator info and stats
    // Fetch creator info and saved counts in parallel for better performance
    const enrichedData = data ? await Promise.all(
      data.map(async (event) => {
        // Fetch creator name
        const { data: creator } = await supabase
          .from('users')
          .select('name, photo_url')
          .eq('id', event.created_by)
          .single();

        // Count how many users have saved this event
        const { count: savedCount } = await supabase
          .from('saved_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          ...event,
          creator_name: creator?.name || 'Unknown User',
          creator_avatar: creator?.photo_url || null,
          category_name: event.categories?.name || 'Uncategorized',
          saved_count: savedCount || 0,
          categories: undefined
        };
      })
    ) : [];

    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error("Unexpected error in events API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
