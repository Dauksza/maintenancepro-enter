import type { UserRole, RolePermissions, Permission, UserProfile } from './types'

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    role: 'Admin',
    permissions: [
      { resource: '*', actions: ['create', 'read', 'update', 'delete', 'execute'] }
    ],
    can_view_tabs: ['*'],
    can_edit_own_data: true,
    can_edit_all_data: true,
    can_approve: true,
    can_manage_users: true,
    can_configure_system: true
  },
  Manager: {
    role: 'Manager',
    permissions: [
      { resource: 'work-orders', actions: ['create', 'read', 'update', 'delete', 'execute'] },
      { resource: 'employees', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'assets', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'parts', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sops', actions: ['create', 'read', 'update'] },
      { resource: 'forms', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'schedules', actions: ['create', 'read', 'update', 'delete', 'execute'] },
      { resource: 'database', actions: ['read'] }
    ],
    can_view_tabs: ['*'],
    can_edit_own_data: true,
    can_edit_all_data: true,
    can_approve: true,
    can_manage_users: false,
    can_configure_system: false
  },
  Supervisor: {
    role: 'Supervisor',
    permissions: [
      { resource: 'work-orders', actions: ['create', 'read', 'update'] },
      { resource: 'employees', actions: ['read', 'update'] },
      { resource: 'assets', actions: ['read', 'update'] },
      { resource: 'parts', actions: ['read', 'update'] },
      { resource: 'sops', actions: ['read'] },
      { resource: 'forms', actions: ['create', 'read', 'update'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'schedules', actions: ['read', 'update'] }
    ],
    can_view_tabs: [
      'tracking',
      'timeline',
      'resources',
      'capacity',
      'calendar',
      'employees',
      'assets',
      'parts',
      'forms',
      'certifications',
      'sops',
      'analytics'
    ],
    can_edit_own_data: true,
    can_edit_all_data: false,
    can_approve: true,
    can_manage_users: false,
    can_configure_system: false
  },
  Technician: {
    role: 'Technician',
    permissions: [
      { resource: 'work-orders', actions: ['read', 'update'] },
      { resource: 'employees', actions: ['read'] },
      { resource: 'assets', actions: ['read'] },
      { resource: 'parts', actions: ['read', 'update'] },
      { resource: 'sops', actions: ['read'] },
      { resource: 'forms', actions: ['create', 'read', 'update'] },
      { resource: 'schedules', actions: ['read'] }
    ],
    can_view_tabs: [
      'tracking',
      'calendar',
      'parts',
      'forms',
      'certifications',
      'sops'
    ],
    can_edit_own_data: true,
    can_edit_all_data: false,
    can_approve: false,
    can_manage_users: false,
    can_configure_system: false
  },
  Viewer: {
    role: 'Viewer',
    permissions: [
      { resource: 'work-orders', actions: ['read'] },
      { resource: 'employees', actions: ['read'] },
      { resource: 'assets', actions: ['read'] },
      { resource: 'parts', actions: ['read'] },
      { resource: 'sops', actions: ['read'] },
      { resource: 'forms', actions: ['read'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'schedules', actions: ['read'] }
    ],
    can_view_tabs: [
      'tracking',
      'timeline',
      'calendar',
      'analytics'
    ],
    can_edit_own_data: false,
    can_edit_all_data: false,
    can_approve: false,
    can_manage_users: false,
    can_configure_system: false
  }
}

export function hasPermission(
  userRole: UserRole | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
): boolean {
  if (!userRole) return false
  
  const roleConfig = ROLE_PERMISSIONS[userRole]
  if (!roleConfig) return false

  return roleConfig.permissions.some(
    permission =>
      (permission.resource === '*' || permission.resource === resource) &&
      permission.actions.includes(action)
  )
}

export function canViewTab(userRole: UserRole | undefined, tabId: string): boolean {
  if (!userRole) return false
  
  const roleConfig = ROLE_PERMISSIONS[userRole]
  if (!roleConfig) return false

  return roleConfig.can_view_tabs.includes('*') || roleConfig.can_view_tabs.includes(tabId)
}

export function canEditData(
  userRole: UserRole | undefined,
  isOwnData: boolean
): boolean {
  if (!userRole) return false
  
  const roleConfig = ROLE_PERMISSIONS[userRole]
  if (!roleConfig) return false

  if (roleConfig.can_edit_all_data) return true
  if (isOwnData && roleConfig.can_edit_own_data) return true
  
  return false
}

export function canApprove(userRole: UserRole | undefined): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.can_approve ?? false
}

export function canManageUsers(userRole: UserRole | undefined): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.can_manage_users ?? false
}

export function canConfigureSystem(userRole: UserRole | undefined): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.can_configure_system ?? false
}

export function getAvailableTabs(userRole: UserRole | undefined): string[] {
  if (!userRole) return []
  
  const roleConfig = ROLE_PERMISSIONS[userRole]
  if (!roleConfig) return []

  if (roleConfig.can_view_tabs.includes('*')) {
    return [
      'dashboard',
      'tracking',
      'timeline',
      'resources',
      'capacity',
      'calendar',
      'employees',
      'assets',
      'parts',
      'forms',
      'certifications',
      'sops',
      'analytics',
      'database'
    ]
  }

  return roleConfig.can_view_tabs
}

export function filterWorkOrdersByPermission(
  workOrders: any[],
  userRole: UserRole | undefined,
  userId: string | undefined
): any[] {
  if (!userRole || !userId) return []
  
  const roleConfig = ROLE_PERMISSIONS[userRole]
  if (!roleConfig) return []

  if (roleConfig.can_edit_all_data) {
    return workOrders
  }

  return workOrders.filter(wo => 
    wo.assigned_technician === userId || wo.entered_by === userId
  )
}

export const DEFAULT_USER_PREFERENCES = {
  dashboard_layout: [
    {
      widget_id: 'quick-stats',
      type: 'quick-stats' as const,
      title: 'Quick Statistics',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 2 },
      visible: true
    },
    {
      widget_id: 'my-assignments',
      type: 'my-assignments' as const,
      title: 'My Assignments',
      position: { x: 4, y: 0 },
      size: { width: 4, height: 3 },
      visible: true
    },
    {
      widget_id: 'overdue-tasks',
      type: 'overdue-tasks' as const,
      title: 'Overdue Tasks',
      position: { x: 8, y: 0 },
      size: { width: 4, height: 2 },
      visible: true
    },
    {
      widget_id: 'certifications',
      type: 'certifications' as const,
      title: 'Certification Status',
      position: { x: 0, y: 2 },
      size: { width: 4, height: 2 },
      visible: true
    },
    {
      widget_id: 'upcoming-maintenance',
      type: 'upcoming-maintenance' as const,
      title: 'Upcoming Maintenance',
      position: { x: 8, y: 2 },
      size: { width: 4, height: 3 },
      visible: true
    },
    {
      widget_id: 'analytics-chart',
      type: 'analytics-chart' as const,
      title: 'Work Order Trends',
      position: { x: 0, y: 4 },
      size: { width: 8, height: 3 },
      visible: true
    },
    {
      widget_id: 'recent-activity',
      type: 'recent-activity' as const,
      title: 'Recent Activity',
      position: { x: 4, y: 3 },
      size: { width: 4, height: 2 },
      visible: true
    }
  ],
  notifications_enabled: true,
  email_notifications: true,
  show_completed_work_orders: false,
  items_per_page: 25
}
