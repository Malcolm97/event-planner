import { NextResponse } from "next/server"
import { supabase, TABLES } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"

// Helper function to check admin access - uses 'users' table
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                               userError.message?.includes('No rows found') ||
                               userError.code === 'PGRST204' ||
                               !userError.code

      if (isUserNotFound) {
        return { isAdmin: false, error: 'We couldn\'t find your profile. Please try signing in again.' }
      } else {
        return { isAdmin: false, error: getUserFriendlyError(userError, 'Something went wrong. Please try again.') }
      }
    }

    return { isAdmin: userData?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: getUserFriendlyError(error, 'Something unexpected happened. Please try again.') }
  }
}

export async function GET(request: Request) {
  // Admin API routes require authentication
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 items
    const search = searchParams.get('search')?.trim()

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      )
    }

    // Build query to get all events with location data
    let query = supabase
      .from(TABLES.EVENTS)
      .select(`
        location,
        approved
      `)
      .not('location', 'is', null)
      .neq('location', '')

    // Apply search filter if provided
    if (search && search.length > 0) {
      query = query.ilike('location', `%${search}%`)
    }

    const { data: eventsData, error } = await query

    if (error) {
      console.error("Error fetching locations from events:", error)
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 }
      )
    }

    // Aggregate locations and calculate event counts
    const locationStats = new Map<string, {
      total_events: number
      approved_events: number
      pending_events: number
    }>()

    // Process events data to build location statistics
    eventsData?.forEach(event => {
      const location = event.location
      if (!locationStats.has(location)) {
        locationStats.set(location, {
          total_events: 0,
          approved_events: 0,
          pending_events: 0
        })
      }

      const stats = locationStats.get(location)!
      stats.total_events++

      if (event.approved) {
        stats.approved_events++
      } else {
        stats.pending_events++
      }
    })

    // Convert to array and sort by location name
    const locationsArray = Array.from(locationStats.entries())
      .map(([location, stats]) => ({
        id: location.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Generate ID from location name
        name: location,
        description: 'Location in Papua New Guinea',
        ...stats
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Apply pagination
    const totalCount = locationsArray.length
    const from = (page - 1) * limit
    const to = Math.min(from + limit, totalCount)
    const paginatedData = locationsArray.slice(from, to)

    // Add cache headers for better performance
    const response = NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

    // Cache for 30 seconds, revalidate on demand
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response

  } catch (error) {
    console.error("Unexpected error in locations API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
