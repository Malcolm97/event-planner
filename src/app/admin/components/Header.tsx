import { Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
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
      </div>
    </header>
  )
}
