import type { WorkOrder, TechnicianCapacity, DailyCapacityStatus } from './types'
import { format, isSameDay, parseISO } from 'date-fns'

export const DEFAULT_DAILY_HOURS = 8

export function getTechnicianCapacity(
  technician: string,
  capacities: TechnicianCapacity[]
): number {
  const capacity = capacities.find(c => c.technician_name === technician)
  return capacity?.daily_hour_limit || DEFAULT_DAILY_HOURS
}

export function calculateDailyCapacity(
  date: Date,
  technician: string,
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[]
): DailyCapacityStatus {
  const capacity = getTechnicianCapacity(technician, capacities)
  
  const relevantOrders = workOrders.filter(wo => {
    if (wo.assigned_technician !== technician) return false
    if (wo.status === 'Completed' || wo.status === 'Cancelled') return false
    
    try {
      const scheduledDate = parseISO(wo.scheduled_date)
      return isSameDay(scheduledDate, date)
    } catch {
      return false
    }
  })

  const scheduled_hours = relevantOrders.reduce(
    (sum, wo) => sum + (wo.estimated_downtime_hours || 0),
    0
  )

  const utilization_percent = capacity > 0 ? (scheduled_hours / capacity) * 100 : 0
  const is_overallocated = scheduled_hours > capacity

  return {
    date: format(date, 'yyyy-MM-dd'),
    technician,
    scheduled_hours,
    capacity_limit: capacity,
    utilization_percent,
    is_overallocated,
    work_orders: relevantOrders
  }
}

export function getAllTechnicians(workOrders: WorkOrder[]): string[] {
  const technicianSet = new Set<string>()
  
  workOrders.forEach(wo => {
    if (wo.assigned_technician && wo.assigned_technician.trim()) {
      technicianSet.add(wo.assigned_technician)
    }
  })
  
  return Array.from(technicianSet).sort()
}

export function getCapacityColorClass(utilizationPercent: number): string {
  if (utilizationPercent <= 50) return 'bg-green-500/20 text-green-700 border-green-300'
  if (utilizationPercent <= 75) return 'bg-yellow-500/20 text-yellow-700 border-yellow-300'
  if (utilizationPercent <= 100) return 'bg-orange-500/20 text-orange-700 border-orange-300'
  return 'bg-red-500/20 text-red-700 border-red-300'
}

export function getCapacityLabel(utilizationPercent: number): string {
  if (utilizationPercent <= 50) return 'Available'
  if (utilizationPercent <= 75) return 'Moderate'
  if (utilizationPercent <= 100) return 'Near Capacity'
  return 'Overallocated'
}

export function getWeeklyCapacityStatus(
  startDate: Date,
  technician: string,
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[]
): DailyCapacityStatus[] {
  const statuses: DailyCapacityStatus[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const status = calculateDailyCapacity(date, technician, workOrders, capacities)
    statuses.push(status)
  }
  
  return statuses
}

export function getTotalCapacityAcrossTechnicians(
  date: Date,
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[]
): {
  total_capacity: number
  total_scheduled: number
  total_utilization_percent: number
  technician_statuses: DailyCapacityStatus[]
} {
  const technicians = getAllTechnicians(workOrders)
  const statuses = technicians.map(tech =>
    calculateDailyCapacity(date, tech, workOrders, capacities)
  )

  const total_capacity = statuses.reduce((sum, s) => sum + s.capacity_limit, 0)
  const total_scheduled = statuses.reduce((sum, s) => sum + s.scheduled_hours, 0)
  const total_utilization_percent = total_capacity > 0 
    ? (total_scheduled / total_capacity) * 100 
    : 0

  return {
    total_capacity,
    total_scheduled,
    total_utilization_percent,
    technician_statuses: statuses
  }
}

export function checkCapacityConflict(
  workOrder: WorkOrder,
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[]
): {
  hasConflict: boolean
  currentHours: number
  capacityLimit: number
  utilizationPercent: number
} {
  if (!workOrder.assigned_technician || !workOrder.scheduled_date) {
    return {
      hasConflict: false,
      currentHours: 0,
      capacityLimit: DEFAULT_DAILY_HOURS,
      utilizationPercent: 0
    }
  }

  try {
    const date = parseISO(workOrder.scheduled_date)
    const status = calculateDailyCapacity(
      date,
      workOrder.assigned_technician,
      workOrders,
      capacities
    )

    return {
      hasConflict: status.is_overallocated,
      currentHours: status.scheduled_hours,
      capacityLimit: status.capacity_limit,
      utilizationPercent: status.utilization_percent
    }
  } catch {
    return {
      hasConflict: false,
      currentHours: 0,
      capacityLimit: DEFAULT_DAILY_HOURS,
      utilizationPercent: 0
    }
  }
}
