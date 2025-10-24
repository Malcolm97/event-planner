"use client"
import { useEffect, useState } from "react"
import StatCard from "./components/StatCard"
import { supabase } from "@/lib/supabase"

interface Stats {
  users: number
  events: number
  pendingApprovals: number
  categories: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    events: 0,
    pendingApprovals: 0,
    categories: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const [usersResult, eventsResult, categoriesResult, pendingEventsResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("approved", false)
      ])

      setStats({
        users: usersResult.count || 0,
        events: eventsResult.count || 0,
        pendingApprovals: pendingEventsResult.count || 0,
        categories: categoriesResult.count || 0
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up realtime subscriptions for all tables to update stats
    const profilesChannel = supabase
      .channel('profiles_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats()
      })
      .subscribe()

    const eventsChannel = supabase
      .channel('events_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchStats()
      })
      .subscribe()

    const categoriesChannel = supabase
      .channel('categories_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchStats()
      })
      .subscribe()

    // Auto-refresh every 60 seconds as fallback
    const interval = setInterval(fetchStats, 60000)

    return () => {
      profilesChannel.unsubscribe()
      eventsChannel.unsubscribe()
      categoriesChannel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    { title: "Total Users", count: stats.users },
    { title: "Total Events", count: stats.events },
    { title: "Pending Approvals", count: stats.pendingApprovals },
    { title: "Categories", count: stats.categories },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((s) => (
        <StatCard key={s.title} title={s.title} count={s.count} />
      ))}
    </div>
  )
}
