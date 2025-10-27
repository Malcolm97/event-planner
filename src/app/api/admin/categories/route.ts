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
  // Check admin access for all admin API routes
  const { isAdmin, error } = await checkAdminAccess()

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', details: error },
      { status: 403 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    let query = supabase
      .from("categories")
      .select(`
        *,
        events_count:events!category_id(count),
        events_approved:events!category_id(approved)
      `)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting categories count:", countError)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('name')

    const { data, error } = await query

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json(
        { error: "Failed to fetch categories", details: error.message },
        { status: 500 }
      )
    }

    // Enrich data with usage statistics
    const enrichedData = data?.map(category => {
      const totalEvents = category.events_count?.[0]?.count || 0
      const approvedEvents = category.events_approved?.filter((event: any) => event.approved).length || 0

      return {
        ...category,
        total_events: totalEvents,
        approved_events: approvedEvents,
        pending_events: totalEvents - approvedEvents,
        events_count: undefined,
        events_approved: undefined
      }
    }) || []

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
    console.error("Unexpected error in categories API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
