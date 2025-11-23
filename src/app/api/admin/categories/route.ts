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
      .from("events")
      .select(`
        category_id,
        approved,
        categories!inner (
          id,
          name,
          description
        )
      `)
      .not('category_id', 'is', null)

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
      id: string
      name: string
      description: string | null
      total_events: number
      approved_events: number
      pending_events: number
    }>()

    // Process events data to build category statistics
    eventsData?.forEach((event: any) => {
      const category = event.categories
      if (!category) return

      const categoryId = category.id
      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, {
          id: categoryId,
          name: category.name,
          description: category.description,
          total_events: 0,
          approved_events: 0,
          pending_events: 0
        })
      }

      const stats = categoryStats.get(categoryId)!
      stats.total_events++

      if (event.approved) {
        stats.approved_events++
      } else {
        stats.pending_events++
      }
    })

    // Get all categories (including those without events) for complete list
    const { data: allCategories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, description")
      .order('name')

    if (categoriesError) {
      console.error("Error fetching all categories:", categoriesError)
      return NextResponse.json(
        { error: "Failed to fetch categories", details: categoriesError.message },
        { status: 500 }
      )
    }

    // Merge categories with stats (ensuring all categories are included)
    const enrichedData = allCategories?.map(category => {
      const stats = categoryStats.get(category.id)
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        total_events: stats?.total_events || 0,
        approved_events: stats?.approved_events || 0,
        pending_events: stats?.pending_events || 0
      }
    }) || []

    // Apply search filter to enriched data if needed
    let filteredData = enrichedData
    if (search && search.length > 0) {
      filteredData = enrichedData.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // Apply pagination
    const totalCount = filteredData.length
    const from = (page - 1) * limit
    const to = Math.min(from + limit, totalCount)
    const paginatedData = filteredData.slice(from, to)

    // Add cache headers for better performance
    const response = NextResponse.json({
      data: enrichedData,
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
