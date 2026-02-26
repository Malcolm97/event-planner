import { NextResponse } from "next/server"
import { TABLES } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')?.trim()

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      )
    }

    // First, try to get categories from the categories table
    const { data: categoriesData, error: categoriesError } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')

    // If categories table exists and has data, use it
    if (!categoriesError && categoriesData && categoriesData.length > 0) {
      // Get event counts per category from events table
      const { data: eventsData } = await supabase
        .from(TABLES.EVENTS)
        .select('category, approved')
        .not('category', 'is', null)

      // Build event count map
      const eventCountMap = new Map<string, { total: number; approved: number; pending: number }>()
      eventsData?.forEach((event: any) => {
        const cat = event.category
        if (!cat) return
        if (!eventCountMap.has(cat)) {
          eventCountMap.set(cat, { total: 0, approved: 0, pending: 0 })
        }
        const counts = eventCountMap.get(cat)!
        counts.total++
        if (event.approved) counts.approved++
        else counts.pending++
      })

      // Enrich categories with event counts
      let enrichedData = categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        total_events: eventCountMap.get(cat.name)?.total || 0,
        approved_events: eventCountMap.get(cat.name)?.approved || 0,
        pending_events: eventCountMap.get(cat.name)?.pending || 0,
      }))

      // Apply search filter
      if (search && search.length > 0) {
        enrichedData = enrichedData.filter(cat =>
          cat.name.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Apply pagination
      const totalCount = enrichedData.length
      const from = (page - 1) * limit
      const to = Math.min(from + limit, totalCount)
      const paginatedData = enrichedData.slice(from, to)

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      })
    }

    // Fallback: Aggregate categories from events table if categories table doesn't exist or is empty
    const { data: eventsData, error: eventsError } = await supabase
      .from(TABLES.EVENTS)
      .select('category, approved')
      .not('category', 'is', null)

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

    return NextResponse.json({
      data: paginatedData,
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
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}