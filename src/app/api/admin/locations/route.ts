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

    // Build query to get all events with location data
    let query = supabase
      .from(TABLES.EVENTS)
      .select('location, approved')
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
        id: location.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error("Unexpected error in locations API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}