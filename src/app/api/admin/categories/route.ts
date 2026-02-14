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

    // Build query to get all events with category data for aggregation
    let eventsQuery = supabase
      .from(TABLES.EVENTS)
      .select(`
        category,
        approved
      `)
      .not('category', 'is', null)

    const { data: eventsData, error: eventsError } = await eventsQuery

    if (eventsError) {
      console.error("Error fetching events for categories:", eventsError)
      return NextResponse.json(
        { error: "Failed to fetch events data", details: eventsError.message },
        { status: 500 }
      )
    }

    // Aggregate categories and calculate event counts
    const categoryStats = new Map<string, {
      category: string
      total_events: number
      approved_events: number
      pending_events: number
    }>()

    // Process events data to build category statistics
    eventsData?.forEach((event: any) => {
      const category = event.category
      if (!category) return

      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          category,
          total_events: 0,
          approved_events: 0,
          pending_events: 0
        })
      }

      const stats = categoryStats.get(category)!
      stats.total_events++

      if (event.approved) {
        stats.approved_events++
      } else {
        stats.pending_events++
      }
    })

    // Convert map to array for response
    let enrichedData = Array.from(categoryStats.values()).map(stats => ({
      name: stats.category,
      total_events: stats.total_events,
      approved_events: stats.approved_events,
      pending_events: stats.pending_events
    }))

    // Apply search filter if needed
    let filteredData = enrichedData
    if (search && search.length > 0) {
      filteredData = enrichedData.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply pagination
    const totalCount = filteredData.length
    const from = (page - 1) * limit
    const to = Math.min(from + limit, totalCount)
    const paginatedData = filteredData.slice(from, to)

    // Add cache headers for better performance
    const response = NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

    // Cache for 30 seconds, revalidate on demand
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response

  } catch (error) {
    console.error("Unexpected error in categories API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
