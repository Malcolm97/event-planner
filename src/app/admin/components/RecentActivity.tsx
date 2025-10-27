import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  activity_type: string
  description: string
  metadata?: any
  event_id?: string
  event_name?: string
  created_at: string
  profiles?: {
    full_name?: string
    avatar_url?: string
  }
}

interface RecentActivityProps {
  activities: Activity[]
  loading?: boolean
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return '🎉'
      case 'event_updated':
        return '✏️'
      case 'event_saved':
        return '❤️'
      case 'event_completed':
        return '✅'
      case 'profile_updated':
        return '👤'
      case 'event_viewed':
        return '👁️'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'text-green-600 bg-green-100'
      case 'event_updated':
        return 'text-blue-600 bg-blue-100'
      case 'event_saved':
        return 'text-red-600 bg-red-100'
      case 'event_completed':
        return 'text-purple-600 bg-purple-100'
      case 'profile_updated':
        return 'text-orange-600 bg-orange-100'
      case 'event_viewed':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatActivityType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.activity_type)}`}>
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">
                    {activity.profiles?.full_name || 'Unknown User'}
                  </span>
                  {' '}
                  {activity.description}
                  {activity.event_name && (
                    <span className="text-blue-600 font-medium">
                      {' '}{activity.event_name}
                    </span>
                  )}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.activity_type)}`}>
                    {formatActivityType(activity.activity_type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
