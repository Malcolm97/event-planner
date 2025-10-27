import { ReactNode } from "react"

interface StatCardProps {
  title: string
  count: number | string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  subtitle?: string
}

export default function StatCard({ title, count, icon, trend, subtitle }: StatCardProps) {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{count}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className={`mr-1 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.isPositive ? '↗' : '↘'}
              </span>
              <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
