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
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query using the TABLES constant
    let query = supabase
      .from(TABLES.AUDIT_LOGS)
      .select('*', { count: 'exact' })

    // Apply filters
    if (action && action !== 'all') {
      query = query.eq('action', action)
    }

    if (entityType && entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: logs, error: logsError, count: totalCount } = await query

    if (logsError) {
      console.error("Error fetching audit logs:", logsError)
      return NextResponse.json(
        { error: getUserFriendlyError(logsError, "Failed to fetch audit logs") },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Unexpected error in audit logs API:", error)
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}