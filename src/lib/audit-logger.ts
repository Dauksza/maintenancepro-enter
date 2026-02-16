/**
 * Comprehensive Audit Logging System
 * 
 * Tracks all CRUD operations, user actions, and system events
 * with detailed context for compliance and debugging
 */

import { v4 as uuidv4 } from 'uuid'

export type AuditAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'ASSIGN'
  | 'COMPLETE'
  | 'CANCEL'
  | 'APPROVE'
  | 'REJECT'
  | 'ARCHIVE'
  | 'RESTORE'

export type AuditEntityType =
  | 'work_order'
  | 'asset'
  | 'employee'
  | 'sop'
  | 'skill'
  | 'area'
  | 'part'
  | 'schedule'
  | 'form'
  | 'message'
  | 'certification'
  | 'notification'
  | 'report'
  | 'system'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AuditLogEntry {
  log_id: string
  timestamp: string
  action: AuditAction
  entity_type: AuditEntityType
  entity_id: string | null
  entity_name: string | null
  user_id: string | null
  user_name: string | null
  user_role: string | null
  ip_address: string | null
  user_agent: string | null
  severity: AuditSeverity
  description: string
  changes: FieldChange[]
  metadata: Record<string, any>
  success: boolean
  error_message: string | null
  duration_ms: number | null
  session_id: string | null
}

export interface FieldChange {
  field_name: string
  old_value: any
  new_value: any
  data_type: string
}

export interface AuditSearchFilters {
  start_date?: string
  end_date?: string
  actions?: AuditAction[]
  entity_types?: AuditEntityType[]
  user_ids?: string[]
  entity_ids?: string[]
  severities?: AuditSeverity[]
  success_only?: boolean
  search_text?: string
}

export interface AuditStatistics {
  total_entries: number
  entries_by_action: Record<AuditAction, number>
  entries_by_entity: Record<AuditEntityType, number>
  entries_by_user: Array<{ user_id: string; user_name: string; count: number }>
  entries_by_severity: Record<AuditSeverity, number>
  success_rate: number
  average_duration_ms: number
  most_active_hours: Array<{ hour: number; count: number }>
  most_modified_entities: Array<{ entity_type: AuditEntityType; entity_id: string; count: number }>
}

/**
 * Audit Logger
 */
export class AuditLogger {
  private static instance: AuditLogger
  private logs: AuditLogEntry[] = []
  private maxLogs: number = 10000
  private currentSessionId: string
  private autoSave: boolean = true

  private constructor() {
    this.currentSessionId = uuidv4()
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * Log an action
   */
  log(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string | null,
    entityName: string | null,
    description: string,
    options: {
      userId?: string | null
      userName?: string | null
      userRole?: string | null
      changes?: FieldChange[]
      metadata?: Record<string, any>
      severity?: AuditSeverity
      success?: boolean
      errorMessage?: string | null
      durationMs?: number | null
    } = {}
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      log_id: uuidv4(),
      timestamp: new Date().toISOString(),
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      user_id: options.userId || null,
      user_name: options.userName || null,
      user_role: options.userRole || null,
      ip_address: null, // Would be populated by backend
      user_agent: navigator.userAgent,
      severity: options.severity || 'info',
      description,
      changes: options.changes || [],
      metadata: options.metadata || {},
      success: options.success !== undefined ? options.success : true,
      error_message: options.errorMessage || null,
      duration_ms: options.durationMs || null,
      session_id: this.currentSessionId,
    }

    this.logs.push(entry)

    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    return entry
  }

  /**
   * Log a CREATE action
   */
  logCreate(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    entity: any,
    userId?: string,
    userName?: string
  ): AuditLogEntry {
    const changes: FieldChange[] = Object.keys(entity).map(key => ({
      field_name: key,
      old_value: null,
      new_value: entity[key],
      data_type: typeof entity[key],
    }))

    return this.log(
      'CREATE',
      entityType,
      entityId,
      entityName,
      `Created ${entityType}: ${entityName}`,
      {
        userId,
        userName,
        changes,
        metadata: { entity },
        severity: 'info',
      }
    )
  }

  /**
   * Log an UPDATE action
   */
  logUpdate(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    oldEntity: any,
    newEntity: any,
    userId?: string,
    userName?: string
  ): AuditLogEntry {
    const changes: FieldChange[] = []

    // Compare fields
    const allKeys = new Set([...Object.keys(oldEntity), ...Object.keys(newEntity)])
    
    for (const key of allKeys) {
      const oldValue = oldEntity[key]
      const newValue = newEntity[key]
      
      // Use simple comparison for primitives
      if (oldValue !== newValue) {
        // For objects, do deeper comparison
        if (
          (typeof oldValue === 'object' || typeof newValue === 'object') &&
          oldValue !== null &&
          newValue !== null
        ) {
          const oldJson = JSON.stringify(this.sortObject(oldValue))
          const newJson = JSON.stringify(this.sortObject(newValue))
          if (oldJson === newJson) continue
        } else if (oldValue === newValue) {
          continue
        }

        changes.push({
          field_name: key,
          old_value: oldValue,
          new_value: newValue,
          data_type: typeof newValue,
        })
      }
    }

    return this.log(
      'UPDATE',
      entityType,
      entityId,
      entityName,
      `Updated ${entityType}: ${entityName} (${changes.length} fields changed)`,
      {
        userId,
        userName,
        changes,
        metadata: { old_entity: oldEntity, new_entity: newEntity },
        severity: 'info',
      }
    )
  }

  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => this.sortObject(item))
    
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key])
    })
    return sorted
  }

  /**
   * Log a DELETE action
   */
  logDelete(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    entity: any,
    userId?: string,
    userName?: string
  ): AuditLogEntry {
    return this.log(
      'DELETE',
      entityType,
      entityId,
      entityName,
      `Deleted ${entityType}: ${entityName}`,
      {
        userId,
        userName,
        metadata: { deleted_entity: entity },
        severity: 'warning',
      }
    )
  }

  /**
   * Log a work order status change
   */
  logWorkOrderStatusChange(
    workOrderId: string,
    workOrderName: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
    userName?: string
  ): AuditLogEntry {
    const action = newStatus === 'Completed' ? 'COMPLETE' : newStatus === 'Cancelled' ? 'CANCEL' : 'UPDATE'

    return this.log(
      action,
      'work_order',
      workOrderId,
      workOrderName,
      `Work order status changed from ${oldStatus} to ${newStatus}`,
      {
        userId,
        userName,
        changes: [{
          field_name: 'status',
          old_value: oldStatus,
          new_value: newStatus,
          data_type: 'string',
        }],
        severity: 'info',
      }
    )
  }

  /**
   * Log a work order assignment
   */
  logWorkOrderAssignment(
    workOrderId: string,
    workOrderName: string,
    technicianId: string,
    technicianName: string,
    userId?: string,
    userName?: string
  ): AuditLogEntry {
    return this.log(
      'ASSIGN',
      'work_order',
      workOrderId,
      workOrderName,
      `Work order assigned to ${technicianName}`,
      {
        userId,
        userName,
        metadata: {
          technician_id: technicianId,
          technician_name: technicianName,
        },
        severity: 'info',
      }
    )
  }

  /**
   * Search audit logs
   */
  search(filters: AuditSearchFilters): AuditLogEntry[] {
    let results = [...this.logs]

    // Filter by date range
    if (filters.start_date) {
      results = results.filter(log => log.timestamp >= filters.start_date!)
    }
    if (filters.end_date) {
      results = results.filter(log => log.timestamp <= filters.end_date!)
    }

    // Filter by actions
    if (filters.actions && filters.actions.length > 0) {
      results = results.filter(log => filters.actions!.includes(log.action))
    }

    // Filter by entity types
    if (filters.entity_types && filters.entity_types.length > 0) {
      results = results.filter(log => filters.entity_types!.includes(log.entity_type))
    }

    // Filter by user IDs
    if (filters.user_ids && filters.user_ids.length > 0) {
      results = results.filter(log => log.user_id && filters.user_ids!.includes(log.user_id))
    }

    // Filter by entity IDs
    if (filters.entity_ids && filters.entity_ids.length > 0) {
      results = results.filter(log => log.entity_id && filters.entity_ids!.includes(log.entity_id))
    }

    // Filter by severities
    if (filters.severities && filters.severities.length > 0) {
      results = results.filter(log => filters.severities!.includes(log.severity))
    }

    // Filter by success
    if (filters.success_only) {
      results = results.filter(log => log.success)
    }

    // Search text
    if (filters.search_text) {
      const searchLower = filters.search_text.toLowerCase()
      results = results.filter(log =>
        log.description.toLowerCase().includes(searchLower) ||
        log.entity_name?.toLowerCase().includes(searchLower) ||
        log.user_name?.toLowerCase().includes(searchLower)
      )
    }

    return results
  }

  /**
   * Get logs for a specific entity
   */
  getEntityHistory(entityType: AuditEntityType, entityId: string): AuditLogEntry[] {
    return this.logs.filter(
      log => log.entity_type === entityType && log.entity_id === entityId
    ).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  /**
   * Get logs for a specific user
   */
  getUserActivity(userId: string, limit?: number): AuditLogEntry[] {
    const logs = this.logs
      .filter(log => log.user_id === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

    return limit ? logs.slice(0, limit) : logs
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return [...this.logs]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
  }

  /**
   * Calculate statistics
   */
  getStatistics(): AuditStatistics {
    const stats: AuditStatistics = {
      total_entries: this.logs.length,
      entries_by_action: {} as Record<AuditAction, number>,
      entries_by_entity: {} as Record<AuditEntityType, number>,
      entries_by_user: [],
      entries_by_severity: {} as Record<AuditSeverity, number>,
      success_rate: 0,
      average_duration_ms: 0,
      most_active_hours: [],
      most_modified_entities: [],
    }

    // Count by action
    this.logs.forEach(log => {
      stats.entries_by_action[log.action] = (stats.entries_by_action[log.action] || 0) + 1
      stats.entries_by_entity[log.entity_type] = (stats.entries_by_entity[log.entity_type] || 0) + 1
      stats.entries_by_severity[log.severity] = (stats.entries_by_severity[log.severity] || 0) + 1
    })

    // Success rate
    const successCount = this.logs.filter(log => log.success).length
    stats.success_rate = this.logs.length > 0 ? (successCount / this.logs.length) * 100 : 0

    // Average duration
    const durations = this.logs.filter(log => log.duration_ms !== null).map(log => log.duration_ms!)
    stats.average_duration_ms = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    // Most active hours
    const hourCounts: Record<number, number> = {}
    this.logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    stats.most_active_hours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Most modified entities
    const entityCounts: Map<string, { entity_type: AuditEntityType; entity_id: string; count: number }> = new Map()
    this.logs.forEach(log => {
      if (log.entity_id) {
        const key = `${log.entity_type}:${log.entity_id}`
        const existing = entityCounts.get(key)
        if (existing) {
          existing.count++
        } else {
          entityCounts.set(key, {
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            count: 1,
          })
        }
      }
    })
    stats.most_modified_entities = Array.from(entityCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    const logs = JSON.parse(json)
    this.logs = logs
  }

  /**
   * Get all logs
   */
  getAllLogs(): AuditLogEntry[] {
    return [...this.logs]
  }

  /**
   * Set max log size
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Start new session
   */
  startNewSession(): void {
    this.currentSessionId = uuidv4()
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()
