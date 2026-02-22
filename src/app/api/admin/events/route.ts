import { NextResponse } from "next/server"
import { TABLES } from "@/lib/supabase"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-utils"
import { getUserFriendlyError } from "@/lib/userMessages"

export async function GET(request: Request) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let query = supabase
      .from(TABLES.EVENTS)
      .select(`
        *,
        categories (
          name
        )
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      const searchPattern = `%${search}%`
      query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern},location.ilike.${searchPattern}`)
    }

    if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'pending') {
      query = query.eq('approved', false)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching events:", error)
      return NextResponse.json(
        { error: "Failed to fetch events", details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    }

    // OPTIMIZATION: Fetch all creator info and saved counts in batch queries
    const creatorIds = [...new Set(data.map(e => e.created_by).filter(Boolean))]
    const eventIds = data.map(e => e.id)

    // Batch fetch creators from profiles table
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', creatorIds)

    const creatorMap = new Map(creators?.map(c => [c.id, c]) || [])

    // Batch fetch saved event counts
    const { data: savedCounts } = await supabase
      .from(TABLES.SAVED_EVENTS)
      .select('event_id')
      .in('event_id', eventIds)

    // Count saves per event
    const savedCountMap = new Map<string, number>()
    savedCounts?.forEach(save => {
      savedCountMap.set(save.event_id, (savedCountMap.get(save.event_id) || 0) + 1)
    })

    // Enrich data with creator info and stats
    const enrichedData = data.map(event => {
      const creator = creatorMap.get(event.created_by)
      return {
        ...event,
        creator_name: creator?.full_name || 'Unknown User',
        creator_avatar: creator?.avatar_url || null,
        category_name: event.categories?.name || 'Uncategorized',
        saved_count: savedCountMap.get(event.id) || 0,
        categories: undefined
      }
    })

    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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