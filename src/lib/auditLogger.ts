import { supabase } from "./supabase"

export type AuditAction =
  | 'user.role_changed'
  | 'user.approved'
  | 'user.rejected'
  | 'user.deleted'
  | 'user.updated'
  | 'event.approved'
  | 'event.rejected'
  | 'event.featured'
  | 'event.unfeatured'
  | 'event.deleted'
  | 'event.updated'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted'
  | 'location.created'
  | 'location.updated'
  | 'location.deleted'
  | 'settings.updated'
  | 'bulk_action.performed'

export type EntityType = 'user' | 'event' | 'category' | 'location' | 'settings' | 'bulk'

interface AuditLogEntry {
  userId?: string
  userName?: string
  action: AuditAction
  entityType?: EntityType
  entityId?: string
  entityName?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an admin action to the audit logs table
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        user_name: entry.userName,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        entity_name: entry.entityName,
        old_values: entry.oldValues,
        new_values: entry.newValues,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      })

    if (error) {
      console.error('Failed to log audit entry:', error)
    }
  } catch (error) {
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Get admin user info for audit logging
 */
export async function getAdminUserInfo(userId: string): Promise<{ name: string } | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    return data ? { name: data.full_name || 'Unknown' } : null
  } catch {
    return null
  }
}

/**
 * Helper to log user-related actions
 */
export async function logUserAction(
  action: 'user.role_changed' | 'user.approved' | 'user.rejected' | 'user.deleted' | 'user.updated',
  adminId: string,
  targetUserId: string,
  targetUserName: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
): Promise<void> {
  const adminInfo = await getAdminUserInfo(adminId)
  
  await logAuditEntry({
    userId: adminId,
    userName: adminInfo?.name || 'Unknown Admin',
    action,
    entityType: 'user',
    entityId: targetUserId,
    entityName: targetUserName,
    oldValues,
    newValues,
  })
}

/**
 * Helper to log event-related actions
 */
export async function logEventAction(
  action: 'event.approved' | 'event.rejected' | 'event.featured' | 'event.unfeatured' | 'event.deleted' | 'event.updated',
  adminId: string,
  eventId: string,
  eventName: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
): Promise<void> {
  const adminInfo = await getAdminUserInfo(adminId)
  
  await logAuditEntry({
    userId: adminId,
    userName: adminInfo?.name || 'Unknown Admin',
    action,
    entityType: 'event',
    entityId: eventId,
    entityName: eventName,
    oldValues,
    newValues,
  })
}

/**
 * Helper to log bulk actions
 */
export async function logBulkAction(
  adminId: string,
  action: string,
  entityType: EntityType,
  affectedCount: number,
  details?: Record<string, any>
): Promise<void> {
  const adminInfo = await getAdminUserInfo(adminId)
  
  await logAuditEntry({
    userId: adminId,
    userName: adminInfo?.name || 'Unknown Admin',
    action: 'bulk_action.performed',
    entityType,
    newValues: {
      action,
      affectedCount,
      ...details,
    },
  })
}

/**
 * Format audit action for display
 */
export function formatAuditAction(action: AuditAction): string {
  const actionMap: Record<AuditAction, string> = {
    'user.role_changed': 'Changed user role',
    'user.approved': 'Approved user',
    'user.rejected': 'Rejected user',
    'user.deleted': 'Deleted user',
    'user.updated': 'Updated user',
    'event.approved': 'Approved event',
    'event.rejected': 'Rejected event',
    'event.featured': 'Featured event',
    'event.unfeatured': 'Unfeatured event',
    'event.deleted': 'Deleted event',
    'event.updated': 'Updated event',
    'category.created': 'Created category',
    'category.updated': 'Updated category',
    'category.deleted': 'Deleted category',
    'location.created': 'Created location',
    'location.updated': 'Updated location',
    'location.deleted': 'Deleted location',
    'settings.updated': 'Updated settings',
    'bulk_action.performed': 'Performed bulk action',
  }
  
  return actionMap[action] || action
}

/**
 * Get icon for audit action
 */
export function getAuditActionIcon(action: AuditAction): string {
  if (action.includes('deleted')) return '🗑️'
  if (action.includes('approved')) return '✅'
  if (action.includes('rejected')) return '❌'
  if (action.includes('featured')) return '⭐'
  if (action.includes('role')) return '👑'
  if (action.includes('created')) return '➕'
  if (action.includes('updated')) return '✏️'
  if (action.includes('bulk')) return '📋'
  return '📝'
}