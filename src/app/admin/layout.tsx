"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import AdminToastProvider from "./components/ToastProvider"
import AdminAccessModal from "./components/AdminAccessModal"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log("No authenticated user")
          setIsAdmin(false)
          setShowAccessModal(true)
          setIsLoading(false)
          return
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Handle case where profile doesn't exist or other errors
        if (profileError) {
          // Check if it's a "no rows found" error or profile doesn't exist
          const isProfileNotFound = profileError.code === 'PGRST116' ||
                                   profileError.message?.includes('No rows found') ||
                                   profileError.code === 'PGRST204' ||
                                   !profileError.code; // Empty error object

          if (isProfileNotFound) {
            console.log("User profile not found - user needs to complete registration")
            setIsAdmin(false)
            setShowAccessModal(true)
            setIsLoading(false)
            return
          } else {
            // Only log actual errors, not empty objects
            const isEmptyObject = Object.keys(profileError).length === 0
            if (!isEmptyObject && (profileError.code || profileError.message)) {
              console.error("Error fetching profile:", profileError)
            } else {
              console.log("Profile lookup failed - treating as no profile found")
            }
            setIsAdmin(false)
            setShowAccessModal(true)
            setIsLoading(false)
            return
          }
        }

        const hasAdminRole = profile?.role === 'admin'
        setIsAdmin(hasAdminRole)

        if (!hasAdminRole) {
          setShowAccessModal(true)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking admin access:", error)
        setIsAdmin(false)
        setShowAccessModal(true)
        setIsLoading(false)
      }
    }

    checkAdminAccess()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAdmin(false)
        setShowAccessModal(true)
      } else if (session?.user) {
        // Re-check admin role when user signs in
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            // Handle profile not found or other errors
            const isProfileNotFound = profileError.code === 'PGRST116' ||
                                     profileError.message?.includes('No rows found') ||
                                     profileError.code === 'PGRST204' ||
                                     !profileError.code; // Empty error object

            if (isProfileNotFound) {
              console.log("Profile not found during auth change")
            } else {
              const isEmptyObject = Object.keys(profileError).length === 0
              if (!isEmptyObject && (profileError.code || profileError.message)) {
                console.error("Error during auth state change:", profileError)
              } else {
                console.log("Profile lookup failed during auth change")
              }
            }
            setIsAdmin(false)
            setShowAccessModal(true)
            return
          }

          const hasAdminRole = profile?.role === 'admin'
          setIsAdmin(hasAdminRole)

          if (!hasAdminRole) {
            setShowAccessModal(true)
          }
        } catch (error) {
          console.error("Error during auth state change:", error)
          setIsAdmin(false)
          setShowAccessModal(true)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleModalClose = () => {
    setShowAccessModal(false)
    router.push('/')
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
        <div className="relative flex flex-1 items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-xl">PNG</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Verifying Access
              </h1>
              <p className="text-gray-600 text-lg">Checking administrator privileges...</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show access modal for non-admin users
  if (!isAdmin) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
          <div className="relative flex flex-1 items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6 border border-gray-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">PNG</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Admin Access Required
                </h1>
                <p className="text-gray-600 text-lg">You need administrator privileges to access this area</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm font-medium text-center">
                  This area is restricted to administrators only. Please contact your system administrator if you believe this is an error.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-yellow-500 hover:to-red-600 transition-all duration-200 shadow-lg"
                >
                  Back to Events
                </button>
              </div>
            </div>
          </div>
        </div>
        <AdminAccessModal
          isOpen={showAccessModal}
          onClose={handleModalClose}
        />
      </>
    )
  }

  // Render admin layout for authenticated admin users
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
