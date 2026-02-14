export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type WorkOrderStatus = 
  | 'Scheduled (Not Started)' 
  | 'In Progress' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Overdue'

export type WorkOrderType = 
  | 'Maintenance' 
  | 'Inspection' 
  | 'Calibration' 
  | 'Repair'

export type MaintenanceFrequency = 
  | 'Daily' 
  | 'Weekly' 
  | 'Monthly' 
  | 'Quarterly' 
  | 'Bi-Yearly' 
  | 'Yearly'

export interface WorkOrder {
  work_order_id: string
  equipment_area: string
  priority_level: PriorityLevel
  status: WorkOrderStatus
  type: WorkOrderType
  task: string
  comments_description: string
  scheduled_date: string
  estimated_downtime_hours: number
  assigned_technician: string | null
  entered_by: string | null
  terminal: string
  created_at: string
  updated_at: string
  completed_at: string | null
  is_overdue: boolean
  auto_generated: boolean
  linked_sop_ids?: string[]
}

export interface SOP {
  sop_id: string
  title: string
  revision: number
  effective_date: string
  purpose: string
  scope: string
  loto_ppe_hazards: string
  pm_frequencies_included: MaintenanceFrequency[]
  procedure_summary: string
  records_required: string
  version_history: SOPVersion[]
  created_at: string
  updated_at: string
  linked_work_orders: string[]
}

export interface SOPVersion {
  revision: number
  date: string
  changes: string
}

export interface SparesLabor {
  class: string
  common_spares: string[]
  labor_typical: Record<MaintenanceFrequency, number>
}

export interface ExcelImportData {
  workOrders: WorkOrder[]
  sops: SOP[]
  sparesLabor: SparesLabor[]
}

export interface ImportValidationError {
  sheet: string
  row: number
  column: string
  error: string
}

export interface WorkOrderFilters {
  equipment_area?: string
  status?: WorkOrderStatus
  priority?: PriorityLevel
  terminal?: string
  assigned_technician?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface AnalyticsData {
  workOrdersByStatus: Record<WorkOrderStatus, number>
  workOrdersByPriority: Record<PriorityLevel, number>
  downtimeByMonth: Array<{ month: string; hours: number }>
  laborForecast: Array<{ month: string; hours: number }>
  maintenanceByArea: Array<{ area: string; count: number }>
  completionRate: number
  overdueCount: number
  overdueTrend: Array<{ date: string; count: number }>
}

export interface TechnicianCapacity {
  technician_name: string
  daily_hour_limit: number
  created_at: string
  updated_at: string
}

export interface DailyCapacityStatus {
  date: string
  technician: string
  scheduled_hours: number
  capacity_limit: number
  utilization_percent: number
  is_overallocated: boolean
  work_orders: WorkOrder[]
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive'

export type ShiftType = 'Day Shift' | 'Night Shift' | 'Rotating' | 'On Call'

export interface Employee {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  status: EmployeeStatus
  shift: ShiftType
  hire_date: string
  emergency_contact_name: string
  emergency_contact_phone: string
  certifications: string[]
  created_at: string
  updated_at: string
}

export interface SkillMatrixEntry {
  employee_id: string
  skill_category: string
  skill_name: string
  level: SkillLevel
  certified: boolean
  certification_date: string | null
  expiry_date: string | null
  notes: string
}

export interface EmployeeSchedule {
  schedule_id: string
  employee_id: string
  date: string
  shift_start: string
  shift_end: string
  hours: number
  notes: string
  created_at: string
}

export interface Message {
  message_id: string
  from_employee_id: string
  to_employee_id: string | null
  subject: string
  body: string
  is_read: boolean
  is_broadcast: boolean
  priority: 'Normal' | 'High' | 'Urgent'
  created_at: string
  read_at: string | null
}

export interface EmployeeAnalytics {
  total_employees: number
  active_employees: number
  on_leave: number
  by_department: Array<{ department: string; count: number }>
  by_shift: Array<{ shift: ShiftType; count: number }>
  skill_coverage: Array<{ skill: string; employee_count: number; avg_level: number }>
  certification_expiring_soon: Array<{ employee_id: string; skill: string; expiry_date: string }>
  work_order_completion_by_tech: Array<{ technician: string; completed: number; avg_time: number }>
}

export type NotificationStatus = 'Pending' | 'Sent' | 'Read' | 'Dismissed'

export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type NotificationType = 
  | 'Certification Expiring' 
  | 'Certification Expired'
  | 'Renewal Required'
  | 'Training Due'

export interface CertificationReminder {
  reminder_id: string
  employee_id: string
  skill_name: string
  skill_category: string
  certification_date: string
  expiry_date: string
  days_until_expiry: number
  notification_status: NotificationStatus
  priority: NotificationPriority
  notification_type: NotificationType
  last_notified_at: string | null
  notification_count: number
  dismissed: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  settings_id: string
  enabled: boolean
  notify_at_days: number[]
  notify_methods: Array<'Email' | 'SMS' | 'In-App'>
  escalate_to_manager: boolean
  escalation_days: number
  auto_disable_employee: boolean
  auto_disable_days: number
  created_at: string
  updated_at: string
}

export interface CertificationRenewalStats {
  total_certifications: number
  expired: number
  expiring_30_days: number
  expiring_60_days: number
  expiring_90_days: number
  up_to_date: number
  by_category: Array<{ category: string; expired: number; expiring: number; total: number }>
  by_employee: Array<{ 
    employee_id: string
    employee_name: string
    expired_count: number
    expiring_count: number
  }>
  recent_renewals: Array<{
    employee_id: string
    skill_name: string
    renewed_date: string
  }>
}
