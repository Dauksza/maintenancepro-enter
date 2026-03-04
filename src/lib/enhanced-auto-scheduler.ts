import type { 
  WorkOrder, 
  Employee, 
  Skill,
  Asset,
  Area,
  SkillMatrixEntry,
  EmployeeSchedule,
  TechnicianCapacity,
  SchedulingConflict,
  SchedulingPreview,
  EnhancedWorkOrder
} from './types'
import { isOverdue } from './maintenance-utils'
import { addDays, format, parseISO, startOfDay, isWeekend, differenceInHours } from 'date-fns'

interface EnhancedSchedulingOptions {
  startDate?: Date
  prioritizeBy?: 'priority' | 'date' | 'duration' | 'skill_match'
  allowWeekends?: boolean
  maxDaysAhead?: number
  considerSkills?: boolean
  considerAreas?: boolean
  considerAssets?: boolean
  allowPartialMatch?: boolean
  minSkillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}

interface SchedulingScore {
  skillMatch: number
  areaMatch: number
  assetMatch: number
  availability: number
  workload: number
  priority: number
  total: number
}

export interface EnhancedSchedulingResult {
  scheduled: WorkOrder[]
  failed: Array<{
    workOrder: WorkOrder
    reason: string
    conflicts: SchedulingConflict[]
  }>
  previews: SchedulingPreview[]
  stats: {
    totalProcessed: number
    successfullyScheduled: number
    failed: number
    employeesUsed: number
    assetsUsed: number
    areasImpacted: number
    avgScore: number
    dateRange: {
      start: string
      end: string
    }
  }
}

const PRIORITY_WEIGHTS = {
  'Critical': 100,
  'High': 75,
  'Medium': 50,
  'Low': 25
}

const SKILL_LEVEL_WEIGHTS = {
  'Expert': 4,
  'Advanced': 3,
  'Intermediate': 2,
  'Beginner': 1
}

// Workload balance threshold in hours - if workers' loads differ by more than this,
// prefer the less-loaded worker to ensure even distribution
const WORKLOAD_BALANCE_THRESHOLD_HOURS = 0.5

export function enhancedAutoSchedule(
  workOrders: WorkOrder[],
  employees: Employee[],
  skills: Skill[],
  skillMatrix: SkillMatrixEntry[],
  assets: Asset[],
  areas: Area[],
  schedules: EmployeeSchedule[],
  capacities: TechnicianCapacity[],
  options: EnhancedSchedulingOptions = {}
): EnhancedSchedulingResult {
  const {
    startDate = new Date(),
    prioritizeBy = 'priority',
    allowWeekends = false,
    maxDaysAhead = 30,
    considerSkills = true,
    considerAreas = true,
    considerAssets = true,
    allowPartialMatch = true,
    minSkillLevel = 'Beginner'
  } = options

  const targetOrders = workOrders.filter(wo => 
    (isOverdue(wo) || wo.status === 'Scheduled (Not Started)') &&
    wo.status !== 'Completed' && 
    wo.status !== 'Cancelled'
  )

  if (targetOrders.length === 0) {
    return createEmptyResult(startDate)
  }

  const sortedOrders = sortWorkOrders(targetOrders, prioritizeBy)
  const activeEmployees = employees.filter(emp => emp.status === 'Active')
  
  const scheduled: WorkOrder[] = []
  const failed: Array<{ workOrder: WorkOrder; reason: string; conflicts: SchedulingConflict[] }> = []
  const previews: SchedulingPreview[] = []
  const usedEmployees = new Set<string>()
  const usedAssets = new Set<string>()
  const usedAreas = new Set<string>()
  const scores: number[] = []

  const employeeCapacityMap = new Map<string, Map<string, number>>()
  activeEmployees.forEach(emp => {
    const capacity = capacities.find(c => c.technician_name === `${emp.first_name} ${emp.last_name}`)
    const empDateMap = new Map<string, number>()
    
    // Pre-populate with existing scheduled work
    const empName = `${emp.first_name} ${emp.last_name}`
    const existingWork = workOrders.filter(wo => 
      wo.assigned_technician === empName && 
      wo.scheduled_date &&
      wo.scheduled_date !== '' &&
      wo.status !== 'Completed' &&
      wo.status !== 'Cancelled'
    )
    
    existingWork.forEach(wo => {
      const dateStr = format(parseISO(wo.scheduled_date), 'yyyy-MM-dd')
      const currentHours = empDateMap.get(dateStr) || 0
      empDateMap.set(dateStr, currentHours + (wo.estimated_downtime_hours || 0))
    })
    
    employeeCapacityMap.set(emp.employee_id, empDateMap)
  })

  for (const workOrder of sortedOrders) {
    const result = scheduleWorkOrder(
      workOrder,
      activeEmployees,
      skills,
      skillMatrix,
      assets,
      areas,
      schedules,
      capacities,
      employeeCapacityMap,
      startDate,
      maxDaysAhead,
      allowWeekends,
      {
        considerSkills,
        considerAreas,
        considerAssets,
        allowPartialMatch,
        minSkillLevel
      }
    )

    if (result.success && result.scheduledWorkOrder) {
      scheduled.push(result.scheduledWorkOrder)
      if (result.employeeId) usedEmployees.add(result.employeeId)
      if (result.preview) {
        previews.push(result.preview)
        scores.push(result.preview.score)
      }
      
      if (workOrder.area_id) usedAreas.add(workOrder.area_id)
    } else {
      failed.push({
        workOrder,
        reason: result.reason || 'Unknown error',
        conflicts: result.conflicts || []
      })
    }
  }

  const endDate = scheduled.length > 0
    ? scheduled.reduce((latest, wo) => 
        wo.scheduled_date > latest ? wo.scheduled_date : latest
      , scheduled[0].scheduled_date)
    : format(startDate, 'yyyy-MM-dd')

  return {
    scheduled,
    failed,
    previews,
    stats: {
      totalProcessed: targetOrders.length,
      successfullyScheduled: scheduled.length,
      failed: failed.length,
      employeesUsed: usedEmployees.size,
      assetsUsed: usedAssets.size,
      areasImpacted: usedAreas.size,
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: endDate
      }
    }
  }
}

function scheduleWorkOrder(
  workOrder: WorkOrder,
  employees: Employee[],
  skills: Skill[],
  skillMatrix: SkillMatrixEntry[],
  assets: Asset[],
  areas: Area[],
  schedules: EmployeeSchedule[],
  capacities: TechnicianCapacity[],
  employeeCapacityMap: Map<string, Map<string, number>>,
  startDate: Date,
  maxDaysAhead: number,
  allowWeekends: boolean,
  options: {
    considerSkills: boolean
    considerAreas: boolean
    considerAssets: boolean
    allowPartialMatch: boolean
    minSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  }
): {
  success: boolean
  scheduledWorkOrder?: WorkOrder
  employeeId?: string
  preview?: SchedulingPreview
  reason?: string
  conflicts?: SchedulingConflict[]
} {
  const conflicts: SchedulingConflict[] = []
  const requiredSkills = extractRequiredSkills(workOrder, skills)
  const requiredAssets = extractRequiredAssets(workOrder, assets)
  const targetArea = areas.find(a => a.area_id === workOrder.area_id || a.area_name === workOrder.equipment_area)

  const eligibleEmployees = employees.filter(emp => {
    if (options.considerSkills && requiredSkills.length > 0 && skillMatrix.length > 0) {
      const empSkills = skillMatrix.filter(sm => sm.employee_id === emp.employee_id)
      const hasRequiredSkills = requiredSkills.every(reqSkill => {
        const empSkill = empSkills.find(es => es.skill_name === reqSkill.skill_name)
        if (!empSkill) return options.allowPartialMatch
        
        return SKILL_LEVEL_WEIGHTS[empSkill.level] >= SKILL_LEVEL_WEIGHTS[options.minSkillLevel]
      })
      
      if (!hasRequiredSkills && !options.allowPartialMatch) return false
    }

    if (options.considerAreas && targetArea && targetArea.assigned_employee_ids.length > 0) {
      if (!targetArea.assigned_employee_ids.includes(emp.employee_id)) {
        return options.allowPartialMatch
      }
    }

    return true
  })

  if (eligibleEmployees.length === 0) {
    let reason = 'No eligible employees'
    if (options.considerSkills && requiredSkills.length > 0) {
      reason = `No employees with required skills: ${requiredSkills.map(s => s.skill_name).join(', ')}`
    } else if (options.considerAreas && targetArea) {
      reason = `No employees assigned to area: ${targetArea.area_name}`
    }
    
    conflicts.push({
      conflict_type: 'skill_mismatch',
      severity: 'error',
      description: reason,
      work_order_id: workOrder.work_order_id,
      suggested_resolution: 'Assign employees with required skills/areas or enable partial matches'
    })
    
    return { success: false, reason, conflicts }
  }

  type ScoredEmployee = {
    employee: Employee
    score: SchedulingScore
    date: Date
    dateStr: string
    currentLoad: number
    dailyLimit: number
  }

  const candidates: ScoredEmployee[] = []

  for (let dayOffset = 0; dayOffset <= maxDaysAhead; dayOffset++) {
    const candidateDate = addDays(startDate, dayOffset)
    
    if (!allowWeekends && isWeekend(candidateDate)) continue

    const dateStr = format(candidateDate, 'yyyy-MM-dd')

    for (const employee of eligibleEmployees) {
      const empName = `${employee.first_name} ${employee.last_name}`
      const capacity = capacities.find(c => c.technician_name === empName)
      const dailyLimit = capacity?.daily_hour_limit || 8
      
      const currentLoad = employeeCapacityMap.get(employee.employee_id)?.get(dateStr) || 0
      const remainingCapacity = dailyLimit - currentLoad

      if (remainingCapacity >= workOrder.estimated_downtime_hours) {
        const score = calculateSchedulingScore(
          workOrder,
          employee,
          candidateDate,
          skillMatrix,
          requiredSkills,
          targetArea,
          currentLoad,
          dailyLimit
        )

        candidates.push({
          employee,
          score,
          date: candidateDate,
          dateStr,
          currentLoad,
          dailyLimit
        })
      }
    }
  }

  if (candidates.length === 0) {
    conflicts.push({
      conflict_type: 'capacity_exceeded',
      severity: 'error',
      description: `No available capacity within ${maxDaysAhead} days`,
      work_order_id: workOrder.work_order_id,
      suggested_resolution: 'Extend scheduling window or increase employee capacity limits'
    })

    return { success: false, reason: 'All employees at capacity', conflicts }
  }

  // Sort candidates to balance workload across workers and dates
  candidates.sort((a, b) => {
    // First priority: Balance workload - prefer less loaded workers
    const loadDiff = a.currentLoad - b.currentLoad
    if (Math.abs(loadDiff) > WORKLOAD_BALANCE_THRESHOLD_HOURS) {
      return loadDiff // Lower load first
    }
    
    // Second priority: Spread across dates - prefer earlier dates when loads are similar
    const dateDiff = a.date.getTime() - b.date.getTime()
    if (dateDiff !== 0) {
      return dateDiff // Earlier dates first
    }
    
    // Third priority: Quality of match (skill, area, etc.)
    return b.score.total - a.score.total
  })
  
  const best = candidates[0]
  const empName = `${best.employee.first_name} ${best.employee.last_name}`

  const scheduledWorkOrder: WorkOrder = {
    ...workOrder,
    assigned_technician: empName,
    scheduled_date: best.dateStr,
    status: 'Scheduled (Not Started)',
    is_overdue: false,
    updated_at: new Date().toISOString()
  }

  const currentCapacity = employeeCapacityMap.get(best.employee.employee_id)
  if (currentCapacity) {
    currentCapacity.set(best.dateStr, best.currentLoad + workOrder.estimated_downtime_hours)
  }

  const preview: SchedulingPreview = {
    work_order_id: workOrder.work_order_id,
    current_assignment: {
      technician: workOrder.assigned_technician,
      date: workOrder.scheduled_date
    },
    proposed_assignment: {
      technician: empName,
      date: best.dateStr
    },
    conflicts: [],
    score: best.score.total,
    reason: `Best match (score: ${best.score.total}/100) - Skills: ${best.score.skillMatch}%, Area: ${best.score.areaMatch}%, Workload: ${best.score.workload}%`
  }

  return { 
    success: true, 
    scheduledWorkOrder, 
    employeeId: best.employee.employee_id,
    preview 
  }
}

function calculateSchedulingScore(
  workOrder: WorkOrder,
  employee: Employee,
  date: Date,
  skillMatrix: SkillMatrixEntry[],
  requiredSkills: Skill[],
  targetArea: Area | undefined,
  currentLoad: number,
  dailyLimit: number
): SchedulingScore {
  let skillMatch = 0
  let areaMatch = 0
  let assetMatch = 0
  let availability = 0
  let workload = 0
  let priority = 0

  if (requiredSkills.length > 0) {
    const empSkills = skillMatrix.filter(sm => sm.employee_id === employee.employee_id)
    const matchedSkills = requiredSkills.filter(rs => 
      empSkills.some(es => es.skill_name === rs.skill_name)
    )
    skillMatch = (matchedSkills.length / requiredSkills.length) * 100
  } else {
    skillMatch = 100
  }

  if (targetArea) {
    areaMatch = targetArea.assigned_employee_ids.includes(employee.employee_id) ? 100 : 50
  } else {
    areaMatch = 100
  }

  assetMatch = 100

  workload = ((dailyLimit - currentLoad) / dailyLimit) * 100
  availability = 100
  priority = PRIORITY_WEIGHTS[workOrder.priority_level]

  const total = (
    skillMatch * 0.3 +
    areaMatch * 0.2 +
    workload * 0.2 +
    availability * 0.15 +
    priority * 0.15
  )

  return {
    skillMatch: Math.round(skillMatch),
    areaMatch: Math.round(areaMatch),
    assetMatch: Math.round(assetMatch),
    availability: Math.round(availability),
    workload: Math.round(workload),
    priority: Math.round(priority),
    total: Math.round(total)
  }
}

function extractRequiredSkills(workOrder: WorkOrder, skills: Skill[]): Skill[] {
  const taskLower = workOrder.task.toLowerCase()
  
  return skills.filter(skill => {
    const skillLower = skill.skill_name.toLowerCase()
    return taskLower.includes(skillLower) || skill.required_for_task_ids.includes(workOrder.work_order_id)
  })
}

function extractRequiredAssets(workOrder: WorkOrder, assets: Asset[]): Asset[] {
  const equipmentLower = workOrder.equipment_area.toLowerCase()
  
  return assets.filter(asset => {
    const assetLower = asset.asset_name.toLowerCase()
    return equipmentLower.includes(assetLower) || asset.maintenance_task_ids.includes(workOrder.work_order_id)
  })
}

function sortWorkOrders(
  workOrders: WorkOrder[],
  prioritizeBy: 'priority' | 'date' | 'duration' | 'skill_match'
): WorkOrder[] {
  return [...workOrders].sort((a, b) => {
    switch (prioritizeBy) {
      case 'priority':
        return PRIORITY_WEIGHTS[b.priority_level] - PRIORITY_WEIGHTS[a.priority_level]
      case 'date':
        return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      case 'duration':
        return a.estimated_downtime_hours - b.estimated_downtime_hours
      default:
        return PRIORITY_WEIGHTS[b.priority_level] - PRIORITY_WEIGHTS[a.priority_level]
    }
  })
}

function createEmptyResult(startDate: Date): EnhancedSchedulingResult {
  return {
    scheduled: [],
    failed: [],
    previews: [],
    stats: {
      totalProcessed: 0,
      successfullyScheduled: 0,
      failed: 0,
      employeesUsed: 0,
      assetsUsed: 0,
      areasImpacted: 0,
      avgScore: 0,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(startDate, 'yyyy-MM-dd')
      }
    }
  }
}

export function detectSchedulingConflicts(
  workOrder: WorkOrder,
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  assets: Asset[],
  areas: Area[]
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = []

  if (workOrder.assigned_technician) {
    const assignedEmp = employees.find(emp => 
      `${emp.first_name} ${emp.last_name}` === workOrder.assigned_technician
    )

    if (assignedEmp && assignedEmp.status !== 'Active') {
      conflicts.push({
        conflict_type: 'employee_unavailable',
        severity: 'error',
        description: `Employee ${workOrder.assigned_technician} is ${assignedEmp.status}`,
        work_order_id: workOrder.work_order_id,
        employee_id: assignedEmp.employee_id,
        suggested_resolution: 'Assign to an active employee'
      })
    }
  }

  return conflicts
}
