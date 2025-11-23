import Link from "next/link"
import { X } from "lucide-react"

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside className="w-64 bg-white border-r p-4 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link
          href="/admin/dashboard"
          onClick={handleLinkClick}
          className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          onClick={handleLinkClick}
          className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Users
        </Link>
        <Link
          href="/admin/events"
          onClick={handleLinkClick}
          className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Events
        </Link>
        <Link
          href="/admin/categories"
          onClick={handleLinkClick}
          className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Categories
        </Link>
        <Link
          href="/admin/locations"
          onClick={handleLinkClick}
          className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Locations
        </Link>
      </nav>
    </aside>
  )
}
