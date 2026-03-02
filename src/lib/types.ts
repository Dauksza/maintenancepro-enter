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
  dependencies?: TaskDependency[]
  recurrence_rule?: RecurrenceRule | null
  template_id?: string | null
  attachments?: WorkOrderAttachment[]
  verification_required?: boolean
  verified_by?: string | null
  verified_at?: string | null
}

export type AttachmentType = 'photo' | 'document' | 'video' | 'pdf' | 'other'

export interface WorkOrderAttachment {
  attachment_id: string
  work_order_id: string
  file_name: string
  file_type: AttachmentType
  file_size_bytes: number
  file_url: string
  thumbnail_url?: string | null
  uploaded_by: string
  uploaded_at: string
  description?: string | null
}

export interface WorkOrderTemplate {
  template_id: string
  template_name: string
  description: string
  type: WorkOrderType
  priority_level: PriorityLevel
  estimated_downtime_hours: number
  task_template: string
  comments_template: string
  required_skill_ids: string[]
  required_asset_ids: string[]
  linked_sop_ids: string[]
  recurrence_rule: RecurrenceRule | null
  checklist_items: ChecklistItem[]
  is_active: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  item_id: string
  description: string
  is_required: boolean
  order: number
  completed: boolean
  completed_by?: string | null
  completed_at?: string | null
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

export type AssetCategory = 'Equipment' | 'Vehicle' | 'Tool' | 'Instrument' | 'Facility' | 'PM Equipment'

// PM Equipment specific types
export type PMEquipmentType = 
  | 'Pump'
  | 'Gearbox'
  | 'Electric Motor'
  | 'Pressure Gauge'
  | 'Thermometer'
  | 'Radar Transmitter'
  | 'Process Controller - Level'
  | 'Process Controller - Temperature'
  | 'Valve'

export type ValveType = 
  | 'Gate Valve'
  | 'Globe Valve'
  | 'Ball Valve'
  | 'Butterfly Valve'
  | 'Check Valve'
  | 'Plug Valve'
  | 'Needle Valve'
  | 'Diaphragm Valve'
  | 'Safety Relief Valve'
  | 'Control Valve'

export type ValveActuationType = 'Manual' | 'Pneumatic' | 'Electric' | 'Hydraulic' | 'Solenoid'

export type ProcessControllerType = 'Level' | 'Temperature' | 'Pressure' | 'Flow'

// Valve hierarchy levels
export type ValveHierarchyLevel = 'Valve' | 'Manifold' | 'Header' | 'Section' | 'Area' | 'System'

export interface PMEquipment extends Asset {
  pm_equipment_type: PMEquipmentType
  specifications: Record<string, string | number>
  operating_parameters: OperatingParameters
}

export interface OperatingParameters {
  rated_capacity?: number
  operating_pressure?: number
  operating_temperature?: number
  flow_rate?: number
  power_rating?: number
  voltage?: number
  rpm?: number
  efficiency?: number
  control_range?: { min: number; max: number }
}

export interface Valve extends PMEquipment {
  pm_equipment_type: 'Valve'
  valve_type: ValveType
  valve_size: number // in inches
  actuation_type: ValveActuationType
  body_material: string
  seat_material: string
  pressure_rating: number // in PSI
  temperature_rating: number // in °F
  flow_coefficient_cv: number
  position_indicator: boolean
  fail_position?: 'Open' | 'Closed' | 'As-Is'
  // Hierarchy reference
  manifold_id?: string | null
  valve_tag: string
}

export interface ValveManifold extends Asset {
  manifold_tag: string
  valve_ids: string[]
  header_id?: string | null
  manifold_type: string
  inlet_size: number
  outlet_count: number
}

export interface ValveHeader extends Asset {
  header_tag: string
  manifold_ids: string[]
  section_id?: string | null
  header_type: 'Supply' | 'Return' | 'Distribution'
  main_line_size: number
}

export interface ValveSection extends Asset {
  section_tag: string
  header_ids: string[]
  process_area_id?: string | null
  section_description: string
}

export interface ProcessArea extends Asset {
  area_tag: string
  section_ids: string[]
  system_id?: string | null
  area_description: string
  operating_unit: string
}

export interface ProcessSystem extends Asset {
  system_tag: string
  area_ids: string[]
  system_description: string
  system_type: string
  criticality: 'Low' | 'Medium' | 'High' | 'Critical'
}

export interface Pump extends PMEquipment {
  pm_equipment_type: 'Pump'
  pump_type: 'Centrifugal' | 'Positive Displacement' | 'Submersible' | 'Diaphragm' | 'Peristaltic'
  flow_rate_gpm: number
  head_feet: number
  power_hp: number
  impeller_material: string
  casing_material: string
  seal_type: string
  bearing_type: string
  suction_size: number
  discharge_size: number
}

export interface Gearbox extends PMEquipment {
  pm_equipment_type: 'Gearbox'
  gearbox_type: 'Spur' | 'Helical' | 'Bevel' | 'Worm' | 'Planetary'
  gear_ratio: string
  input_rpm: number
  output_rpm: number
  torque_rating: number
  lubrication_type: string
  oil_capacity: number
  mounting_type: string
}

export interface ElectricMotor extends PMEquipment {
  pm_equipment_type: 'Electric Motor'
  motor_type: 'AC Induction' | 'DC' | 'Synchronous' | 'Servo' | 'Stepper'
  horsepower: number
  voltage: number
  current_amps: number
  phase: '1-Phase' | '3-Phase'
  rpm: number
  frame_size: string
  enclosure_type: string
  efficiency_class: string
  service_factor: number
}

export interface PressureGauge extends PMEquipment {
  pm_equipment_type: 'Pressure Gauge'
  gauge_type: 'Bourdon Tube' | 'Diaphragm' | 'Digital' | 'Capsule'
  pressure_range: { min: number; max: number }
  accuracy_percent: number
  connection_size: string
  dial_size: number
  pressure_unit: 'PSI' | 'Bar' | 'kPa' | 'MPa'
  calibration_due_date: string | null
}

export interface Thermometer extends PMEquipment {
  pm_equipment_type: 'Thermometer'
  thermometer_type: 'Bimetallic' | 'RTD' | 'Thermocouple' | 'Digital' | 'Infrared'
  temperature_range: { min: number; max: number }
  accuracy: number
  probe_length: number
  connection_type: string
  temperature_unit: '°F' | '°C' | 'K'
  calibration_due_date: string | null
}

export interface RadarTransmitter extends PMEquipment {
  pm_equipment_type: 'Radar Transmitter'
  transmitter_type: 'Guided Wave' | 'Non-Contact' | 'Pulse'
  measurement_range: { min: number; max: number }
  frequency_ghz: number
  beam_angle: number
  process_connection: string
  output_signal: '4-20mA' | 'HART' | 'Profibus' | 'Modbus'
  display_type: 'LCD' | 'LED' | 'None'
  tank_application: string
}

export interface ProcessController extends PMEquipment {
  pm_equipment_type: 'Process Controller - Level' | 'Process Controller - Temperature'
  controller_type: ProcessControllerType
  control_algorithm: 'PID' | 'On-Off' | 'Fuzzy Logic' | 'Cascade'
  input_type: string
  output_type: string
  setpoint_range: { min: number; max: number }
  control_accuracy: number
  communication_protocol: 'Modbus' | 'HART' | 'Profibus' | 'Ethernet/IP' | 'OPC-UA'
  display_features: string[]
  alarm_outputs: number
}

export interface Asset {
  asset_id: string
  asset_name: string
  asset_type: string
  category: AssetCategory
  status: AssetStatus
  area_id: string | null
  parent_asset_id: string | null
  child_asset_ids: string[]
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
  meter_readings: MeterReading[]
  last_maintenance_date: string | null
  next_maintenance_date: string | null
  downtime_hours_ytd: number
  criticality_rating: 'Low' | 'Medium' | 'High' | 'Critical'
  notes: string
  created_at: string
  updated_at: string
}

export interface MeterReading {
  reading_id: string
  asset_id: string
  meter_type: 'hours' | 'cycles' | 'distance' | 'production_units' | 'other'
  reading_value: number
  reading_unit: string
  recorded_by: string
  recorded_at: string
  notes?: string | null
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

// P&ID (Piping and Instrumentation Diagram) types
export type PIDSymbolType = 
  | 'Valve'
  | 'Pump'
  | 'Motor'
  | 'Vessel'
  | 'Tank'
  | 'Heat Exchanger'
  | 'Compressor'
  | 'Instrument'
  | 'Pipe'
  | 'Fitting'
  | 'Equipment'
  | 'Custom'
  | 'Electrical'
  | 'Hydraulic'
  | 'Pneumatic'
  | 'Mechanical'

export type InstrumentationType = 
  | 'Pressure'
  | 'Temperature'
  | 'Level'
  | 'Flow'
  | 'Analysis'
  | 'Control'

export type PipeLineType = 
  | 'Process'
  | 'Utility'
  | 'Signal'
  | 'Electrical'
  | 'Hydraulic'
  | 'Pneumatic'
  | 'Mechanical'

export interface PIDDrawing {
  drawing_id: string
  drawing_number: string
  drawing_title: string
  revision: number
  project_name: string
  area_id?: string | null
  system_id?: string | null
  canvas_width: number
  canvas_height: number
  grid_size: number
  show_grid: boolean
  snap_to_grid: boolean
  snap_to_grip: boolean
  zoom_level: number
  pan_x: number
  pan_y: number
  symbols: PIDSymbol[]
  connections: PIDConnection[]
  annotations: PIDAnnotation[]
  metadata: PIDMetadata
  created_by: string
  created_at: string
  updated_at: string
  last_modified_by: string
}

export interface PIDSymbol {
  symbol_id: string
  drawing_id: string
  symbol_type: PIDSymbolType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  label: string
  description?: string
  tag_number: string
  asset_id?: string | null
  properties: Record<string, string | number | boolean>
  connection_points: ConnectionPoint[]
  style: SymbolStyle
  z_index: number
}

export interface ConnectionPoint {
  point_id: string
  x_offset: number
  y_offset: number
  direction: 'top' | 'bottom' | 'left' | 'right'
  connected_to?: string | null
}

export interface PIDConnection {
  connection_id: string
  drawing_id: string
  line_type: PipeLineType
  from_symbol_id: string
  from_point_id: string
  to_symbol_id: string
  to_point_id: string
  path_points: { x: number; y: number }[]
  line_number?: string | null
  flow_direction?: 'forward' | 'reverse' | 'bidirectional' | null
  line_size?: number | null
  material?: string | null
  service?: string | null
  style: LineStyle
}

export interface PIDAnnotation {
  annotation_id: string
  drawing_id: string
  annotation_type: 'Text' | 'Dimension' | 'Note' | 'Callout' | 'Arrow'
  x: number
  y: number
  width?: number
  height?: number
  text: string
  font_size: number
  font_family: string
  color: string
  background_color?: string | null
  border: boolean
  leader_line?: { x: number; y: number }[] | null
  z_index: number
}

export interface SymbolStyle {
  fill_color: string
  stroke_color: string
  stroke_width: number
  opacity: number
  dash_array?: number[] | null
}

export interface LineStyle {
  stroke_color: string
  stroke_width: number
  dash_array?: number[] | null
  arrow_start: boolean
  arrow_end: boolean
  opacity: number
}

export interface PIDMetadata {
  discipline: string
  unit_number?: string | null
  sheet_number: string
  total_sheets: number
  scale: string
  approved_by?: string | null
  approved_date?: string | null
  status: 'Draft' | 'In Review' | 'Approved' | 'Superseded' | 'Archived'
  tags: string[]
  references: string[]
}

export interface PIDTemplate {
  template_id: string
  template_name: string
  description: string
  category: string
  thumbnail_url?: string | null
  symbols: Omit<PIDSymbol, 'symbol_id' | 'drawing_id'>[]
  connections: Omit<PIDConnection, 'connection_id' | 'drawing_id'>[]
  annotations: Omit<PIDAnnotation, 'annotation_id' | 'drawing_id'>[]
  is_public: boolean
  created_by: string
  created_at: string
  usage_count: number
}

export interface SymbolLibraryItem {
  library_id: string
  symbol_name: string
  symbol_type: PIDSymbolType
  category: string
  svg_path: string
  default_width: number
  default_height: number
  connection_points: Omit<ConnectionPoint, 'point_id' | 'connected_to'>[]
  default_properties: Record<string, string | number | boolean>
  thumbnail_url?: string | null
  description: string
  is_standard: boolean
}

// ── Asphalt Industry Types ──────────────────────────────────────────────────

export type AsphaltProduct =
  | 'PG 58-28'
  | 'PG 64-22'
  | 'PG 70-22'
  | 'PG 76-22'
  | 'PG 82-22'
  | 'AC-20'
  | 'AC-30'
  | 'Emulsion'
  | 'Other'

export type TankStatus = 'Active' | 'Inactive' | 'Maintenance'

export type TankShape = 'Vertical Cylinder' | 'Horizontal Cylinder' | 'Rectangular'

export interface AsphaltTank {
  tank_id: string
  tank_name: string
  tank_number: string
  capacity_gallons: number
  current_volume_gallons: number
  product: AsphaltProduct
  temperature_f: number
  min_level_gallons: number
  status: TankStatus
  location: string
  last_updated: string
  notes: string
  // Dimensional data (optional – for 3-D rendering and capacity calculation)
  tank_shape?: TankShape
  diameter_ft?: number
  height_ft?: number
  length_ft?: number
  width_ft?: number
}

export type RailCarStatus =
  | 'En Route'
  | 'Arrived'
  | 'Unloading'
  | 'Unloaded'
  | 'Returned'
  | 'Cancelled'

export interface RailCarDelivery {
  delivery_id: string
  car_number: string
  product: AsphaltProduct
  carrier: string
  expected_arrival: string
  actual_arrival: string | null
  estimated_volume_gallons: number
  actual_volume_gallons: number | null
  temperature_f: number | null
  status: RailCarStatus
  unload_to_tank_id: string | null
  unload_start: string | null
  unload_end: string | null
  operator: string
  notes: string
  created_at: string
  updated_at: string
}

export type TankerLoadingStatus = 'Pending' | 'Loading' | 'Complete' | 'Cancelled'

export interface TankerLoadingTicket {
  ticket_id: string
  ticket_number: string
  customer: string
  destination: string
  truck_id: string
  driver_name: string
  product: AsphaltProduct
  tare_weight_lbs: number
  gross_weight_lbs: number | null
  net_weight_lbs: number | null
  volume_gallons: number | null
  load_from_tank_id: string
  temperature_f: number | null
  status: TankerLoadingStatus
  scheduled_load_time: string
  actual_load_start: string | null
  actual_load_end: string | null
  operator: string
  notes: string
  created_at: string
  updated_at: string
}

export type PolymerType = 'SBS' | 'SBR Latex' | 'Gilsonite' | 'Crumb Rubber' | 'Polyphosphoric Acid' | 'Custom'

export interface BlendFormulation {
  formulation_id: string
  name: string
  target_grade: AsphaltProduct
  base_grade: AsphaltProduct
  polymer_type: PolymerType
  polymer_percentage: number
  blend_temp_f: number
  mix_time_minutes: number
  notes: string
  created_at: string
  is_active: boolean
}
