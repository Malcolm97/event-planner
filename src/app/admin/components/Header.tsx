"use client"
import { Menu, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Home link */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="View Website"
          >
            <Home size={20} />
            <span className="hidden sm:inline text-sm font-medium">View Website</span>
          </button>
        </div>
      </div>
    </header>
  )
}