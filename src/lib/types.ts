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
  area_id?: string | null
  required_skill_ids?: string[]
  required_asset_ids?: string[]
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

export type AssetStatus = 'Operational' | 'Under Maintenance' | 'Out of Service' | 'Decommissioned'

export type AssetCategory = 'Equipment' | 'Vehicle' | 'Tool' | 'Instrument' | 'Facility'

export interface Asset {
  asset_id: string
  asset_name: string
  asset_type: string
  category: AssetCategory
  status: AssetStatus
  area_id: string | null
  assigned_employee_ids: string[]
  required_skill_ids: string[]
  maintenance_task_ids: string[]
  linked_sop_ids: string[]
  manufacturer: string
  model: string
  serial_number: string
  purchase_date: string | null
  warranty_expiry: string | null
  availability_windows: AvailabilityWindow[]
  notes: string
  created_at: string
  updated_at: string
}

export interface AvailabilityWindow {
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Area {
  area_id: string
  area_name: string
  department: string
  zone: string
  parent_area_id: string | null
  assigned_employee_ids: string[]
  asset_ids: string[]
  priority_task_ids: string[]
  capacity_hours_per_day: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Skill {
  skill_id: string
  skill_name: string
  skill_category: string
  description: string
  requires_certification: boolean
  certification_duration_days: number | null
  linked_sop_ids: string[]
  required_for_asset_ids: string[]
  required_for_task_ids: string[]
  created_at: string
  updated_at: string
}

export interface TaskDependency {
  task_id: string
  depends_on_task_id: string
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish'
}

export interface RecurrenceRule {
  frequency: MaintenanceFrequency
  interval: number
  end_date: string | null
  max_occurrences: number | null
}

export interface SchedulingConstraint {
  constraint_type: 'required_skill' | 'required_asset' | 'required_area' | 'time_window' | 'dependency'
  constraint_value: string
  is_strict: boolean
}

export interface SchedulingConflict {
  conflict_type: 'skill_mismatch' | 'employee_unavailable' | 'asset_unavailable' | 'capacity_exceeded' | 'dependency_violation'
  severity: 'warning' | 'error'
  description: string
  work_order_id: string
  employee_id?: string
  asset_id?: string
  suggested_resolution?: string
}

export interface EnhancedWorkOrder extends WorkOrder {
  required_skill_ids: string[]
  optional_skill_ids: string[]
  required_asset_ids: string[]
  area_id: string | null
  dependencies: TaskDependency[]
  recurrence_rule: RecurrenceRule | null
  constraints: SchedulingConstraint[]
}

export interface SchedulingPreview {
  work_order_id: string
  current_assignment: {
    technician: string | null
    date: string | null
  }
  proposed_assignment: {
    technician: string
    date: string
  }
  conflicts: SchedulingConflict[]
  score: number
  reason: string
}

export type WorkOrderNotificationType =
  | 'Assignment Suggestion'
  | 'Assignment Changed'
  | 'Work Order Created'
  | 'Work Order Updated'
  | 'Work Order Overdue'
  | 'Work Order Completed'
  | 'Priority Escalated'
  | 'Skill Match'

export type WorkOrderNotificationStatus = 'Unread' | 'Read' | 'Accepted' | 'Rejected' | 'Dismissed'

export interface WorkOrderNotification {
  notification_id: string
  employee_id: string
  work_order_id: string
  type: WorkOrderNotificationType
  title: string
  message: string
  status: WorkOrderNotificationStatus
  priority: NotificationPriority
  action_url?: string
  action_label?: string
  match_score?: number
  reasons?: string[]
  created_at: string
  read_at: string | null
  responded_at: string | null
  metadata?: {
    previous_technician?: string
    suggested_by?: 'auto-scheduler' | 'skill-matcher' | 'manual'
    skill_matches?: string[]
    area_match?: boolean
    priority_match?: boolean
  }
}

export type PartStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order' | 'Discontinued'

export type PartCategory = 'Electrical' | 'Mechanical' | 'Hydraulic' | 'Pneumatic' | 'Consumable' | 'Safety' | 'Tool' | 'Other'

export interface PartInventoryItem {
  part_id: string
  part_number: string
  part_name: string
  description: string
  category: PartCategory
  manufacturer: string
  supplier: string
  unit_cost: number
  quantity_on_hand: number
  minimum_stock_level: number
  reorder_quantity: number
  unit_of_measure: string
  location: string
  status: PartStatus
  compatible_equipment: string[]
  linked_sop_ids: string[]
  linked_asset_ids: string[]
  last_ordered_date: string | null
  last_used_date: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface PartTransaction {
  transaction_id: string
  part_id: string
  transaction_type: 'Purchase' | 'Use' | 'Return' | 'Adjustment' | 'Transfer'
  quantity: number
  unit_cost: number
  total_cost: number
  work_order_id: string | null
  employee_id: string | null
  from_location: string | null
  to_location: string | null
  notes: string
  created_at: string
  created_by: string
}

export interface PartUsageHistory {
  part_id: string
  part_name: string
  total_used: number
  times_used: number
  average_per_use: number
  last_30_days: number
  last_90_days: number
  linked_work_orders: string[]
}

export interface InventoryAlert {
  alert_id: string
  part_id: string
  alert_type: 'Low Stock' | 'Out of Stock' | 'Expiring Soon' | 'Slow Moving' | 'Overstocked'
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  message: string
  recommended_action: string
  created_at: string
  resolved: boolean
  resolved_at: string | null
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'time' 
  | 'datetime'
  | 'checkbox' 
  | 'radio' 
  | 'select' 
  | 'signature' 
  | 'photo' 
  | 'file'
  | 'rating'
  | 'hazard-level'

export type HazardLevel = 'Low' | 'Medium' | 'High' | 'Extreme'

export type FormStatus = 'Draft' | 'Active' | 'Archived'

export type SubmissionStatus = 'In Progress' | 'Completed' | 'Approved' | 'Rejected' | 'Requires Action'

export interface FormField {
  field_id: string
  field_type: FormFieldType
  label: string
  description?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  conditional?: {
    show_if_field: string
    show_if_value: string | boolean | number
  }
  order: number
}

export interface FormSection {
  section_id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  repeatable?: boolean
}

export interface FormTemplate {
  template_id: string
  template_name: string
  template_type: 'JHA' | 'Inspection' | 'Safety' | 'Quality' | 'Audit' | 'Custom'
  description: string
  category: string
  is_premade: boolean
  sections: FormSection[]
  version: number
  status: FormStatus
  requires_approval: boolean
  approval_workflow?: string[]
  linked_sop_ids: string[]
  linked_asset_ids: string[]
  linked_work_order_types: WorkOrderType[]
  created_by: string
  created_at: string
  updated_at: string
  tags: string[]
}

export interface JHAHazard {
  hazard_id: string
  job_step: string
  hazard_description: string
  hazard_level: HazardLevel
  potential_consequences: string
  controls: string[]
  ppe_required: string[]
  responsible_person: string
  order: number
}

export interface InspectionItem {
  item_id: string
  item_name: string
  acceptance_criteria: string
  is_compliant: boolean | null
  measurement_value?: string
  notes?: string
  photo_urls?: string[]
  inspector: string
  inspected_at?: string
  order: number
}

export interface FormSubmission {
  submission_id: string
  template_id: string
  template_name: string
  submitted_by: string
  submitted_by_name: string
  submission_date: string
  status: SubmissionStatus
  work_order_id?: string
  asset_id?: string
  area_id?: string
  field_responses: Record<string, FormFieldResponse>
  jha_hazards?: JHAHazard[]
  inspection_items?: InspectionItem[]
  signatures: FormSignature[]
  attachments: FormAttachment[]
  approval_history: FormApproval[]
  score?: number
  issues_identified: number
  corrective_actions_required: string[]
  notes: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface FormFieldResponse {
  field_id: string
  field_label: string
  value: string | number | boolean | string[] | null
  answered_at: string
}

export interface FormSignature {
  signature_id: string
  signer_name: string
  signer_role: string
  signature_data: string
  signed_at: string
}

export interface FormAttachment {
  attachment_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_by: string
  uploaded_at: string
}

export interface FormApproval {
  approval_id: string
  approver_id: string
  approver_name: string
  approval_status: 'Approved' | 'Rejected' | 'Pending'
  comments: string
  approved_at: string
}

export interface FormAnalytics {
  total_submissions: number
  submissions_by_status: Record<SubmissionStatus, number>
  submissions_by_template: Array<{ template_name: string; count: number }>
  average_completion_time: number
  compliance_rate: number
  issues_by_severity: Record<HazardLevel, number>
  submissions_by_date: Array<{ date: string; count: number }>
  top_issues: Array<{ issue: string; count: number }>
  corrective_actions_pending: number
}

export type UserRole = 'Admin' | 'Manager' | 'Supervisor' | 'Technician' | 'Viewer'

export interface Permission {
  resource: string
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'execute'>
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  can_view_tabs: string[]
  can_edit_own_data: boolean
  can_edit_all_data: boolean
  can_approve: boolean
  can_manage_users: boolean
  can_configure_system: boolean
}

export interface UserProfile {
  user_id: string
  employee_id: string | null
  username: string
  display_name: string
  email: string
  role: UserRole
  avatar_url?: string
  is_owner: boolean
  preferences: UserPreferences
  created_at: string
  updated_at: string
  last_login_at: string
}

export interface UserPreferences {
  theme?: 'light' | 'dark'
  dashboard_layout: DashboardWidget[]
  default_view?: string
  notifications_enabled: boolean
  email_notifications: boolean
  show_completed_work_orders: boolean
  items_per_page: number
  timezone?: string
  language?: string
}

export type DashboardWidgetType = 
  | 'work-orders-overview'
  | 'overdue-tasks'
  | 'my-assignments'
  | 'certifications'
  | 'analytics-chart'
  | 'capacity-planning'
  | 'recent-activity'
  | 'parts-inventory'
  | 'upcoming-maintenance'
  | 'notifications'
  | 'quick-stats'
  | 'calendar'

export interface DashboardWidget {
  widget_id: string
  type: DashboardWidgetType
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  config?: Record<string, unknown>
  refresh_interval?: number
}

export type SearchResultType = 
  | 'work-order'
  | 'employee'
  | 'asset'
  | 'part'
  | 'sop'
  | 'form-template'
  | 'form-submission'
  | 'area'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  description?: string
  status?: string
  priority?: string
  metadata?: Record<string, string>
  url?: string
  score: number
  highlight?: string
}

export interface SearchFilters {
  types?: SearchResultType[]
  status?: string[]
  date_range?: { start: string; end: string }
  assigned_to?: string
  created_by?: string
  priority?: PriorityLevel[]
}

export interface GlobalSearchQuery {
  query: string
  filters: SearchFilters
  limit: number
  offset: number
}

export interface AuditLogEntry {
  log_id: string
  user_id: string
  user_name: string
  action: string
  resource_type: string
  resource_id: string
  resource_name: string
  changes?: Record<string, { old: unknown; new: unknown }>
  ip_address?: string
  user_agent?: string
  timestamp: string
}
