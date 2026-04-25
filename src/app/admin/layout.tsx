"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import AdminToastProvider from "./components/ToastProvider"
import { supabase } from "@/lib/supabase"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const verifyAdminAccess = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError || !authData?.user) {
          if (isMounted) {
            setHasAccess(false)
            router.replace('/signin')
          }
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profileError || profile?.role !== 'admin') {
          if (isMounted) {
            setHasAccess(false)
            router.replace('/signin')
          }
          return
        }

        if (isMounted) {
          setHasAccess(true)
        }
      } finally {
        if (isMounted) {
          setCheckingAccess(false)
        }
      }
    }

    verifyAdminAccess()

    return () => {
      isMounted = false
    }
  }, [router])

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <AdminToastProvider />
    </div>
  )
}