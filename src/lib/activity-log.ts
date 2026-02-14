import type { AuditLogEntry } from './types'

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  resourceType: string,
  resourceId: string,
  resourceName: string,
  changes?: Record<string, { old: unknown; new: unknown }>
): Promise<void> {
  const entry: AuditLogEntry = {
    log_id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    user_name: userName,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    changes,
    timestamp: new Date().toISOString()
  }

  const existingLogs = await window.spark.kv.get<AuditLogEntry[]>('activity-log') || []
  const updatedLogs = [...existingLogs, entry]
  
  const maxLogs = 1000
  if (updatedLogs.length > maxLogs) {
    updatedLogs.splice(0, updatedLogs.length - maxLogs)
  }

  await window.spark.kv.set('activity-log', updatedLogs)
}

export async function getActivityLog(
  limit = 100,
  resourceType?: string,
  userId?: string
): Promise<AuditLogEntry[]> {
  const logs = await window.spark.kv.get<AuditLogEntry[]>('activity-log') || []
  
  let filtered = logs
  
  if (resourceType) {
    filtered = filtered.filter(log => log.resource_type === resourceType)
  }
  
  if (userId) {
    filtered = filtered.filter(log => log.user_id === userId)
  }
  
  return filtered
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export async function clearActivityLog(): Promise<void> {
  await window.spark.kv.set('activity-log', [])
}

export function getActionIcon(action: string): string {
  const lowerAction = action.toLowerCase()
  
  if (lowerAction.includes('create') || lowerAction.includes('add')) return '➕'
  if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('modify')) return '✏️'
  if (lowerAction.includes('delete') || lowerAction.includes('remove')) return '🗑️'
  if (lowerAction.includes('complete')) return '✅'
  if (lowerAction.includes('assign')) return '👤'
  if (lowerAction.includes('schedule')) return '📅'
  if (lowerAction.includes('import')) return '📥'
  if (lowerAction.includes('export')) return '📤'
  if (lowerAction.includes('approve')) return '✔️'
  if (lowerAction.includes('reject')) return '❌'
  if (lowerAction.includes('sign')) return '✍️'
  
  return '📝'
}

export function getResourceTypeLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    'work-order': 'Work Order',
    'employee': 'Employee',
    'skill-matrix': 'Skill Matrix',
    'schedule': 'Schedule',
    'sop': 'SOP',
    'part': 'Part',
    'part-transaction': 'Part Transaction',
    'form-template': 'Form Template',
    'form-submission': 'Form Submission',
    'asset': 'Asset',
    'area': 'Area',
    'user-profile': 'User Profile',
    'notification-preferences': 'Notification Settings'
  }
  
  return labels[resourceType] || resourceType
}
