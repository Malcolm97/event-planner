"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, LayoutDashboard, Users, Calendar, Tag, MapPin, Settings } from "lucide-react"

interface SidebarProps {
  onClose?: () => void
}

import { FileText } from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/admin/dashboard" className="flex items-center space-x-2" onClick={handleLinkClick}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EP</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
        </Link>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`
                flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                ${active 
                  ? 'bg-emerald-50 text-emerald-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon size={20} className={active ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500 text-center">
          Event Planner Admin
        </div>
      </div>
    </aside>
  )
}