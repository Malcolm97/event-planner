import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdminAccess, addAdminCacheHeaders } from "@/lib/admin-utils"
import { TABLES } from "@/lib/supabase"

export async function GET() {
  try {
    // Check admin access first
    const adminError = await requireAdminAccess()
    if (adminError) {
      return adminError
    }

    const supabase = await createServerSupabaseClient()
    
    // Calculate date thresholds
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()

    // OPTIMIZATION: Execute all count queries in parallel using Promise.all
    const [
      usersCountResult,
      eventsCountResult,
      categoriesCountResult,
      pendingEventsResult,
      recentUsersResult,
      recentEventsResult,
      approvedEventsResult,
      eventsByCategoryResult,
      userRolesResult,
      monthlyUsersResult
    ] = await Promise.all([
      // Total users count
      supabase.from(TABLES.PROFILES).select("id", { count: "exact", head: true }),
      
      // Total events count
      supabase.from(TABLES.EVENTS).select("id", { count: "exact", head: true }),
      
      // Total categories count
      supabase.from(TABLES.CATEGORIES).select("name", { count: "exact", head: true }),
      
      // Pending events count
      supabase.from(TABLES.EVENTS).select("id", { count: "exact", head: true }).eq("approved", false),
      
      // Recent users (last 7 days)
      supabase.from(TABLES.PROFILES).select("id", { count: "exact", head: true }).gte("updated_at", sevenDaysAgo),
      
      // Recent events (last 7 days)
      supabase.from(TABLES.EVENTS).select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      
      // Approved events count
      supabase.from(TABLES.EVENTS).select("id", { count: "exact", head: true }).eq("approved", true),
      
      // Events by category for stats
      supabase.from(TABLES.EVENTS).select("category, id"),
      
      // User roles for distribution
      supabase.from(TABLES.PROFILES).select("role"),
      
      // Monthly users for growth stats
      supabase.from(TABLES.PROFILES).select("updated_at").gte("updated_at", sixMonthsAgo)
    ])

    // Try to get activities separately (table may not exist)
    let recentActivitiesData: any[] = []
    try {
      const activitiesResult = await supabase.from(TABLES.ACTIVITIES).select(`
        id,
        activity_type,
        description,
        metadata,
        event_id,
        event_name,
        created_at,
        user_id
      `).order("created_at", { ascending: false }).limit(10)
      
      if (activitiesResult.data) {
        recentActivitiesData = activitiesResult.data
      }
    } catch (e) {
      console.log("Activities table may not exist:", e)
    }

    // Calculate category popularity from fetched data
    const categoryStats: Record<string, number> = {}
    if (eventsByCategoryResult.data) {
      eventsByCategoryResult.data.forEach((event: any) => {
        const categoryName = event.category || "Uncategorized"
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1
      })
    }

    // Calculate role distribution from profiles data
    const roleStats: Record<string, number> = { admin: 0, user: 0, moderator: 0 }
    if (userRolesResult.data) {
      userRolesResult.data.forEach((profile: any) => {
        const role = profile.role || 'user'
        roleStats[role] = (roleStats[role] || 0) + 1
      })
    }

    // Calculate monthly stats from user data
    const monthlyStats: Record<string, number> = {}
    if (monthlyUsersResult.data) {
      monthlyUsersResult.data.forEach((user: any) => {
        const month = new Date(user.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        })
        monthlyStats[month] = (monthlyStats[month] || 0) + 1
      })
    }

    const dashboardData = {
      stats: {
        totalUsers: usersCountResult.count || 0,
        totalEvents: eventsCountResult.count || 0,
        totalCategories: categoriesCountResult.count || 0,
        pendingApprovals: pendingEventsResult.count || 0,
        approvedEvents: approvedEventsResult.count || 0,
        recentUsers: recentUsersResult.count || 0,
        recentEvents: recentEventsResult.count || 0,
      },
      recentActivities: recentActivitiesData,
      categoryStats,
      roleStats,
      monthlyStats,
      trends: {
        userGrowth: Object.values(monthlyStats).slice(-2),
        eventActivity: recentEventsResult.count || 0,
        approvalRate: approvedEventsResult.count && eventsCountResult.count
          ? Math.round((approvedEventsResult.count / eventsCountResult.count) * 100)
          : 0
      }
    }

    const response = NextResponse.json({ data: dashboardData })
    return addAdminCacheHeaders(response)
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}