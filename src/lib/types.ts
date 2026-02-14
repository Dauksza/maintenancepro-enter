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
