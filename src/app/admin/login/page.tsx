"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function AdminLoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/signin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}
