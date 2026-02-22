import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { TABLES } from "@/lib/supabase"
import {
  checkRateLimit,
  createSecureResponse,
  logSecurityEvent,
  isSuspiciousRequest
} from "@/lib/security"
import type { NextRequest } from "next/server"

// Helper function to check admin access using server-side client
async function checkAdminAccess() {
  try {
    const supabase = await createServerSupabaseClient()
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

export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    logSecurityEvent('unauthorized_admin_access_attempt', {
      path: '/api/admin/dashboard',
      method: 'GET',
    }, request);

    return createSecureResponse(
      { error: adminCheck.error || 'Admin access required' },
      { status: 403 }
    );
  }

  // Log successful admin access
  logSecurityEvent('admin_access_granted', {
    path: '/api/admin/dashboard',
    method: 'GET',
    userId: adminCheck.user?.id
  }, request);

  try {
    // Create server-side client for data queries
    const supabase = await createServerSupabaseClient()
    
    // Get comprehensive dashboard statistics with optimized queries
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Execute queries individually with error handling
    const usersCountResult = await supabase.from("profiles").select("id", { count: "exact", head: true });
    const eventsCountResult = await supabase.from("events").select("id", { count: "exact", head: true });
    const categoriesCountResult = await supabase.from("categories").select("name", { count: "exact", head: true });
    const pendingEventsResult = await supabase.from("events").select("id", { count: "exact", head: true }).eq("approved", false);
    const recentUsersResult = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("updated_at", sevenDaysAgo);
    const recentEventsResult = await supabase.from("events").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    
    // Try to get activities, but don't fail if table doesn't exist
    let recentActivitiesData: any[] = [];
    let userActivityCount = 0;
    try {
      const activitiesResult = await supabase.from("activities").select(`
        id,
        activity_type,
        description,
        metadata,
        event_id,
        event_name,
        created_at,
        user_id
      `).order("created_at", { ascending: false }).limit(10);
      
      if (activitiesResult.data) {
        recentActivitiesData = activitiesResult.data;
      }
      
      const activityCountResult = await supabase.from("activities").select("activity_type", { count: "exact" }).gte("created_at", thirtyDaysAgo);
      userActivityCount = activityCountResult.count || 0;
    } catch (e) {
      console.log("Activities table may not exist:", e);
    }
    
    const approvedEventsResult = await supabase.from("events").select("id", { count: "exact", head: true }).eq("approved", true);
    const eventsByCategoryResult = await supabase.from("events").select("category, id");
    const userRolesResult = await supabase.from("profiles").select("role");
    const monthlyUsersResult = await supabase.from("profiles").select("updated_at").gte("updated_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate category popularity from fetched data
    const categoryStats: Record<string, number> = {};
    if (eventsByCategoryResult.data) {
      eventsByCategoryResult.data.forEach((event: any) => {
        const categoryName = event.category || "Uncategorized";
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      });
    }

    // Calculate role distribution from profiles data
    const roleStats: Record<string, number> = { admin: 0, user: 0, moderator: 0 };
    if (userRolesResult.data) {
      userRolesResult.data.forEach((profile: any) => {
        const role = profile.role || 'user';
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    }

    // Calculate monthly stats from user data
    const monthlyStats: Record<string, number> = {};
    if (monthlyUsersResult.data) {
      monthlyUsersResult.data.forEach((user: any) => {
        const month = new Date(user.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      });
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

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}