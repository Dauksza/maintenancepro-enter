import type { WorkOrder, TechnicianCapacity, PriorityLevel } from './types'
import { isOverdue } from './maintenance-utils'
import { 
  getAllTechnicians, 
  calculateDailyCapacity, 
  DEFAULT_DAILY_HOURS,
  getTechnicianCapacity
} from './capacity-utils'
import { addDays, format, parseISO, startOfDay } from 'date-fns'

export interface SchedulingResult {
  scheduled: WorkOrder[]
  failed: Array<{
    workOrder: WorkOrder
    reason: string
  }>
  stats: {
    totalProcessed: number
    successfullyScheduled: number
    failed: number
    techniciansUsed: number
    dateRange: {
      start: string
      end: string
    }
  }
}

interface SchedulingSlot {
  technician: string
  date: Date
  availableHours: number
  currentHours: number
}

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  'Critical': 4,
  'High': 3,
  'Medium': 2,
  'Low': 1
}

const MAX_SCHEDULING_DAYS = 90

export function autoScheduleOverdueTasks(
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[],
  options: {
    startDate?: Date
    prioritizeBy?: 'priority' | 'date' | 'duration'
    allowWeekends?: boolean
    maxDaysAhead?: number
  } = {}
): SchedulingResult {
  const {
    startDate = new Date(),
    prioritizeBy = 'priority',
    allowWeekends = true,
    maxDaysAhead = MAX_SCHEDULING_DAYS
  } = options

  const overdueOrders = workOrders.filter(wo => 
    isOverdue(wo) && 
    wo.status !== 'Completed' && 
    wo.status !== 'Cancelled'
  )

  if (overdueOrders.length === 0) {
    return {
      scheduled: [],
      failed: [],
      stats: {
        totalProcessed: 0,
        successfullyScheduled: 0,
        failed: 0,
        techniciansUsed: 0,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(startDate, 'yyyy-MM-dd')
        }
      }
    }
  }

  const sortedOrders = sortWorkOrdersByPriority(overdueOrders, prioritizeBy)
  const availableTechnicians = getAvailableTechnicians(workOrders, capacities)

  if (availableTechnicians.length === 0) {
    return {
      scheduled: [],
      failed: overdueOrders.map(wo => ({
        workOrder: wo,
        reason: 'No technicians available'
      })),
      stats: {
        totalProcessed: overdueOrders.length,
        successfullyScheduled: 0,
        failed: overdueOrders.length,
        techniciansUsed: 0,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(startDate, 'yyyy-MM-dd')
        }
      }
    }
  }

  const schedulingSlots = buildSchedulingSlots(
    startDate,
    maxDaysAhead,
    availableTechnicians,
    workOrders,
    capacities,
    allowWeekends
  )

  const scheduled: WorkOrder[] = []
  const failed: Array<{ workOrder: WorkOrder; reason: string }> = []

  for (const workOrder of sortedOrders) {
    const slot = findBestSlot(workOrder, schedulingSlots, capacities)

    if (slot) {
      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        scheduled_date: format(slot.date, 'yyyy-MM-dd'),
        assigned_technician: slot.technician,
        status: 'Scheduled (Not Started)',
        is_overdue: false,
        updated_at: new Date().toISOString()
      }

      scheduled.push(updatedWorkOrder)
      slot.currentHours += workOrder.estimated_downtime_hours || 0
    } else {
      failed.push({
        workOrder,
        reason: 'No available slot within scheduling window'
      })
    }
  }

  const techniciansUsed = new Set(scheduled.map(wo => wo.assigned_technician)).size
  const dates = scheduled.map(wo => wo.scheduled_date).sort()

  return {
    scheduled,
    failed,
    stats: {
      totalProcessed: overdueOrders.length,
      successfullyScheduled: scheduled.length,
      failed: failed.length,
      techniciansUsed,
      dateRange: {
        start: dates[0] || format(startDate, 'yyyy-MM-dd'),
        end: dates[dates.length - 1] || format(addDays(startDate, maxDaysAhead), 'yyyy-MM-dd')
      }
    }
  }
}

function sortWorkOrdersByPriority(
  workOrders: WorkOrder[],
  prioritizeBy: 'priority' | 'date' | 'duration'
): WorkOrder[] {
  const sorted = [...workOrders]

  switch (prioritizeBy) {
    case 'priority':
      sorted.sort((a, b) => {
        const priorityDiff = PRIORITY_WEIGHTS[b.priority_level] - PRIORITY_WEIGHTS[a.priority_level]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      })
      break

    case 'date':
      sorted.sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      )
      break

    case 'duration':
      sorted.sort((a, b) => {
        const durationDiff = (b.estimated_downtime_hours || 0) - (a.estimated_downtime_hours || 0)
        if (durationDiff !== 0) return durationDiff
        return PRIORITY_WEIGHTS[b.priority_level] - PRIORITY_WEIGHTS[a.priority_level]
      })
      break
  }

  return sorted
}

function getAvailableTechnicians(
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[]
): string[] {
  const technicians = getAllTechnicians(workOrders)
  
  if (technicians.length > 0) {
    return technicians
  }

  return capacities.map(c => c.technician_name)
}

function buildSchedulingSlots(
  startDate: Date,
  maxDays: number,
  technicians: string[],
  existingWorkOrders: WorkOrder[],
  capacities: TechnicianCapacity[],
  allowWeekends: boolean
): SchedulingSlot[] {
  const slots: SchedulingSlot[] = []
  const baseDate = startOfDay(startDate)

  for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
    const date = addDays(baseDate, dayOffset)
    const dayOfWeek = date.getDay()

    if (!allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue
    }

    for (const technician of technicians) {
      const capacity = getTechnicianCapacity(technician, capacities)
      const dailyStatus = calculateDailyCapacity(
        date,
        technician,
        existingWorkOrders,
        capacities
      )

      slots.push({
        technician,
        date,
        availableHours: capacity,
        currentHours: dailyStatus.scheduled_hours
      })
    }
  }

  return slots
}

function findBestSlot(
  workOrder: WorkOrder,
  slots: SchedulingSlot[],
  capacities: TechnicianCapacity[]
): SchedulingSlot | null {
  const requiredHours = workOrder.estimated_downtime_hours || 0
  const preferredTechnician = workOrder.assigned_technician

  const availableSlots = slots.filter(slot => {
    const remainingCapacity = slot.availableHours - slot.currentHours
    return remainingCapacity >= requiredHours
  })

  if (availableSlots.length === 0) {
    return null
  }

  const preferredSlot = availableSlots.find(
    slot => slot.technician === preferredTechnician
  )

  if (preferredSlot) {
    return preferredSlot
  }

  availableSlots.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime()
    }

    const aUtilization = a.currentHours / a.availableHours
    const bUtilization = b.currentHours / b.availableHours
    
    return aUtilization - bUtilization
  })

  return availableSlots[0]
}

export function generateSchedulingPreview(
  workOrders: WorkOrder[],
  capacities: TechnicianCapacity[],
  options: {
    startDate?: Date
    maxDaysAhead?: number
  } = {}
): {
  totalOverdue: number
  canScheduleAll: boolean
  estimatedDaysNeeded: number
  technicianWorkload: Array<{
    technician: string
    totalHours: number
    daysNeeded: number
  }>
} {
  const { startDate = new Date(), maxDaysAhead = MAX_SCHEDULING_DAYS } = options

  const overdueOrders = workOrders.filter(wo => 
    isOverdue(wo) && 
    wo.status !== 'Completed' && 
    wo.status !== 'Cancelled'
  )

  const totalHoursNeeded = overdueOrders.reduce(
    (sum, wo) => sum + (wo.estimated_downtime_hours || 0),
    0
  )

  const technicians = getAvailableTechnicians(workOrders, capacities)
  const totalDailyCapacity = technicians.reduce(
    (sum, tech) => sum + getTechnicianCapacity(tech, capacities),
    0
  )

  const estimatedDaysNeeded = totalDailyCapacity > 0 
    ? Math.ceil(totalHoursNeeded / totalDailyCapacity)
    : maxDaysAhead

  const canScheduleAll = estimatedDaysNeeded <= maxDaysAhead

  const technicianWorkload = technicians.map(tech => {
    const techCapacity = getTechnicianCapacity(tech, capacities)
    const assignedOrders = overdueOrders.filter(
      wo => wo.assigned_technician === tech
    )
    const totalHours = assignedOrders.reduce(
      (sum, wo) => sum + (wo.estimated_downtime_hours || 0),
      0
    )
    const daysNeeded = techCapacity > 0 ? Math.ceil(totalHours / techCapacity) : 0

    return {
      technician: tech,
      totalHours,
      daysNeeded
    }
  })

  return {
    totalOverdue: overdueOrders.length,
    canScheduleAll,
    estimatedDaysNeeded,
    technicianWorkload
  }
}
