import type { 
  WorkOrder, 
  Employee, 
  SkillMatrixEntry, 
  SOP, 
  SparesLabor,
  PriorityLevel,
  WorkOrderType,
  MaintenanceFrequency
} from './types'

export interface WorkOrderSuggestion {
  field: 'equipment_area' | 'priority_level' | 'type' | 'task' | 'assigned_technician' | 'estimated_downtime_hours' | 'terminal' | 'linked_sop_ids' | 'common_spares'
  suggestions: Array<{
    value: string
    confidence: number
    reason: string
    metadata?: any
  }>
}

export interface WorkOrderDraft {
  equipment_area?: string
  priority_level?: PriorityLevel
  type?: WorkOrderType
  task?: string
  assigned_technician?: string
  estimated_downtime_hours?: number
  terminal?: string
  scheduled_date?: string
  comments_description?: string
}

export function analyzeWorkOrderPatterns(
  workOrders: WorkOrder[],
  draft: WorkOrderDraft
): WorkOrderSuggestion[] {
  const suggestions: WorkOrderSuggestion[] = []

  if (draft.equipment_area && !draft.type) {
    suggestions.push(suggestWorkOrderType(workOrders, draft.equipment_area))
  }

  if (draft.equipment_area && !draft.priority_level) {
    suggestions.push(suggestPriority(workOrders, draft.equipment_area, draft.type))
  }

  if (draft.equipment_area && !draft.task) {
    suggestions.push(suggestTask(workOrders, draft.equipment_area, draft.type))
  }

  if (draft.equipment_area && !draft.estimated_downtime_hours) {
    suggestions.push(suggestDowntime(workOrders, draft.equipment_area, draft.type))
  }

  if (!draft.terminal) {
    suggestions.push(suggestTerminal(workOrders, draft.equipment_area))
  }

  return suggestions
}

export function suggestWorkOrderType(
  workOrders: WorkOrder[],
  equipmentArea: string
): WorkOrderSuggestion {
  const areaLower = equipmentArea.toLowerCase()
  const areaOrders = workOrders.filter(wo => {
    const woAreaLower = wo.equipment_area.toLowerCase()
    return (
      woAreaLower.includes(areaLower) ||
      areaLower.includes(woAreaLower) ||
      woAreaLower.split(/[\s-_/]/).some(part => areaLower.includes(part)) ||
      areaLower.split(/[\s-_/]/).some(part => woAreaLower.includes(part))
    )
  })

  const typeCounts: Record<WorkOrderType, number> = {
    'Maintenance': 0,
    'Inspection': 0,
    'Calibration': 0,
    'Repair': 0
  }

  areaOrders.forEach(wo => {
    typeCounts[wo.type]++
  })

  const total = areaOrders.length || 1
  const suggestions = Object.entries(typeCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      value: type,
      confidence: (count / total) * 100,
      reason: `${count} of ${total} work orders for ${equipmentArea} were ${type}`,
      metadata: { count, total }
    }))
    .sort((a, b) => b.confidence - a.confidence)

  if (suggestions.length === 0) {
    const typeGuess = guessTypeFromArea(equipmentArea)
    suggestions.push({
      value: typeGuess.type,
      confidence: typeGuess.confidence,
      reason: typeGuess.reason,
      metadata: { count: 0, total: 0 }
    })
  }

  return {
    field: 'type',
    suggestions
  }
}

function guessTypeFromArea(equipmentArea: string): { type: WorkOrderType, confidence: number, reason: string } {
  const areaLower = equipmentArea.toLowerCase()
  
  if (areaLower.includes('calibrat') || areaLower.includes('gauge') || areaLower.includes('sensor')) {
    return { type: 'Calibration', confidence: 75, reason: 'Equipment typically requires calibration' }
  }
  if (areaLower.includes('inspect') || areaLower.includes('check')) {
    return { type: 'Inspection', confidence: 75, reason: 'Task appears to be inspection-focused' }
  }
  if (areaLower.includes('repair') || areaLower.includes('fix') || areaLower.includes('broken')) {
    return { type: 'Repair', confidence: 75, reason: 'Equipment appears to need repair' }
  }
  
  return { type: 'Maintenance', confidence: 60, reason: 'Default suggestion for preventive maintenance' }
}

export function suggestPriority(
  workOrders: WorkOrder[],
  equipmentArea: string,
  type?: WorkOrderType
): WorkOrderSuggestion {
  let relevantOrders = workOrders.filter(wo => 
    wo.equipment_area.toLowerCase().includes(equipmentArea.toLowerCase())
  )

  if (type) {
    relevantOrders = relevantOrders.filter(wo => wo.type === type)
  }

  const priorityCounts: Record<PriorityLevel, number> = {
    'Low': 0,
    'Medium': 0,
    'High': 0,
    'Critical': 0
  }

  relevantOrders.forEach(wo => {
    priorityCounts[wo.priority_level]++
  })

  const total = relevantOrders.length || 1
  const suggestions = Object.entries(priorityCounts)
    .filter(([_, count]) => count > 0)
    .map(([priority, count]) => ({
      value: priority,
      confidence: (count / total) * 100,
      reason: `${count} of ${total} similar work orders had ${priority} priority`,
      metadata: { count, total }
    }))
    .sort((a, b) => b.confidence - a.confidence)

  return {
    field: 'priority_level',
    suggestions: suggestions.length > 0 ? suggestions : [
      {
        value: 'Medium',
        confidence: 50,
        reason: 'Default priority for new work orders',
        metadata: {}
      }
    ]
  }
}

export function suggestTask(
  workOrders: WorkOrder[],
  equipmentArea: string,
  type?: WorkOrderType
): WorkOrderSuggestion {
  let relevantOrders = workOrders.filter(wo => 
    wo.equipment_area.toLowerCase().includes(equipmentArea.toLowerCase())
  )

  if (type) {
    relevantOrders = relevantOrders.filter(wo => wo.type === type)
  }

  const taskCounts = new Map<string, number>()
  
  relevantOrders.forEach(wo => {
    const task = wo.task.trim()
    taskCounts.set(task, (taskCounts.get(task) || 0) + 1)
  })

  const total = relevantOrders.length || 1
  const suggestions = Array.from(taskCounts.entries())
    .map(([task, count]) => ({
      value: task,
      confidence: (count / total) * 100,
      reason: `Used ${count} time${count > 1 ? 's' : ''} for similar work orders`,
      metadata: { count, total }
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  return {
    field: 'task',
    suggestions
  }
}

export function suggestDowntime(
  workOrders: WorkOrder[],
  equipmentArea: string,
  type?: WorkOrderType
): WorkOrderSuggestion {
  let relevantOrders = workOrders.filter(wo => 
    wo.equipment_area.toLowerCase().includes(equipmentArea.toLowerCase()) &&
    wo.estimated_downtime_hours > 0
  )

  if (type) {
    relevantOrders = relevantOrders.filter(wo => wo.type === type)
  }

  if (relevantOrders.length === 0) {
    return {
      field: 'estimated_downtime_hours',
      suggestions: [{
        value: '2',
        confidence: 50,
        reason: 'Average downtime for maintenance tasks',
        metadata: {}
      }]
    }
  }

  const downtimes = relevantOrders.map(wo => wo.estimated_downtime_hours)
  const avg = downtimes.reduce((sum, dt) => sum + dt, 0) / downtimes.length
  const min = Math.min(...downtimes)
  const max = Math.max(...downtimes)

  const suggestions = [
    {
      value: avg.toFixed(2),
      confidence: 85,
      reason: `Average downtime for similar work orders (${relevantOrders.length} samples)`,
      metadata: { avg, min, max, count: relevantOrders.length }
    }
  ]

  if (min !== avg) {
    suggestions.push({
      value: min.toFixed(2),
      confidence: 60,
      reason: `Minimum observed downtime`,
      metadata: { avg, min, max, count: relevantOrders.length }
    })
  }

  if (max !== avg && suggestions.length < 3) {
    suggestions.push({
      value: max.toFixed(2),
      confidence: 60,
      reason: `Maximum observed downtime`,
      metadata: { avg, min, max, count: relevantOrders.length }
    })
  }

  return {
    field: 'estimated_downtime_hours',
    suggestions
  }
}

export function suggestTerminal(
  workOrders: WorkOrder[],
  equipmentArea?: string
): WorkOrderSuggestion {
  const terminalCounts = new Map<string, number>()
  
  const relevantOrders = equipmentArea
    ? workOrders.filter(wo => 
        wo.equipment_area.toLowerCase().includes(equipmentArea.toLowerCase())
      )
    : workOrders

  relevantOrders.forEach(wo => {
    terminalCounts.set(wo.terminal, (terminalCounts.get(wo.terminal) || 0) + 1)
  })

  const total = relevantOrders.length || 1
  const suggestions = Array.from(terminalCounts.entries())
    .map(([terminal, count]) => ({
      value: terminal,
      confidence: (count / total) * 100,
      reason: `${count} of ${total} work orders use this terminal`,
      metadata: { count, total }
    }))
    .sort((a, b) => b.confidence - a.confidence)

  return {
    field: 'terminal',
    suggestions: suggestions.length > 0 ? suggestions : [
      {
        value: 'Hanceville Terminal',
        confidence: 100,
        reason: 'Default terminal',
        metadata: {}
      }
    ]
  }
}

export function suggestTechnician(
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  equipmentArea: string,
  type?: WorkOrderType,
  workOrders?: WorkOrder[]
): WorkOrderSuggestion {
  const suggestions: Array<{
    value: string
    confidence: number
    reason: string
    metadata?: any
  }> = []

  const activeEmployees = employees.filter(emp => emp.status === 'Active')

  activeEmployees.forEach(employee => {
    const employeeSkills = skillMatrix.filter(skill => skill.employee_id === employee.employee_id)
    
    const relevantSkills = employeeSkills.filter(skill => {
      const skillLower = skill.skill_name.toLowerCase()
      const areaLower = equipmentArea.toLowerCase()
      
      return (
        skillLower.includes(areaLower) ||
        areaLower.includes(skillLower) ||
        (type && skillLower.includes(type.toLowerCase()))
      )
    })

    if (relevantSkills.length > 0) {
      const avgLevel = relevantSkills.reduce((sum, skill) => {
        const levelScore = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 }
        return sum + levelScore[skill.level]
      }, 0) / relevantSkills.length

      const certifiedCount = relevantSkills.filter(s => s.certified).length
      const confidence = (avgLevel / 4) * 60 + (certifiedCount / relevantSkills.length) * 40

      let workload = 0
      if (workOrders) {
        workload = workOrders.filter(wo => 
          wo.assigned_technician === `${employee.first_name} ${employee.last_name}` &&
          wo.status !== 'Completed' &&
          wo.status !== 'Cancelled'
        ).length
      }

      const workloadPenalty = Math.min(workload * 5, 30)

      suggestions.push({
        value: `${employee.first_name} ${employee.last_name}`,
        confidence: Math.max(confidence - workloadPenalty, 0),
        reason: `${relevantSkills.length} relevant skill${relevantSkills.length > 1 ? 's' : ''}, ${certifiedCount} certified${workload > 0 ? `, ${workload} active task${workload > 1 ? 's' : ''}` : ''}`,
        metadata: {
          employee_id: employee.employee_id,
          skills: relevantSkills,
          avgLevel,
          certifiedCount,
          workload
        }
      })
    }
  })

  return {
    field: 'assigned_technician',
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }
}

export function suggestFromSOPs(
  sops: SOP[],
  equipmentArea: string,
  type?: WorkOrderType
): WorkOrderSuggestion {
  const relevantSOPs = sops.filter(sop => {
    const titleLower = sop.title.toLowerCase()
    const scopeLower = sop.scope.toLowerCase()
    const purposeLower = sop.purpose.toLowerCase()
    const areaLower = equipmentArea.toLowerCase()
    
    const matchesArea = 
      titleLower.includes(areaLower) ||
      scopeLower.includes(areaLower) ||
      purposeLower.includes(areaLower)
    
    if (type) {
      const typeLower = type.toLowerCase()
      return matchesArea && (
        titleLower.includes(typeLower) ||
        scopeLower.includes(typeLower) ||
        purposeLower.includes(typeLower)
      )
    }
    
    return matchesArea
  })

  const suggestions = relevantSOPs.map(sop => {
    const titleMatch = sop.title.toLowerCase().includes(equipmentArea.toLowerCase())
    const confidence = titleMatch ? 90 : 70
    
    return {
      value: sop.sop_id,
      confidence,
      reason: `${sop.title} (Rev ${sop.revision})`,
      metadata: {
        sop_id: sop.sop_id,
        title: sop.title,
        revision: sop.revision,
        frequencies: sop.pm_frequencies_included
      }
    }
  })

  return {
    field: 'linked_sop_ids',
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }
}

export function suggestSpares(
  sparesLabor: SparesLabor[],
  equipmentArea: string
): WorkOrderSuggestion {
  const relevantSpares = sparesLabor.filter(spare => {
    const classLower = spare.class.toLowerCase()
    const areaLower = equipmentArea.toLowerCase()
    
    return classLower.includes(areaLower) || areaLower.includes(classLower)
  })

  const suggestions = relevantSpares.flatMap(spare => {
    return spare.common_spares.map(sparePart => ({
      value: sparePart,
      confidence: 80,
      reason: `Common spare for ${spare.class}`,
      metadata: {
        class: spare.class,
        spare_part: sparePart
      }
    }))
  })

  return {
    field: 'common_spares',
    suggestions: suggestions.slice(0, 5)
  }
}

export function getComprehensiveSuggestions(
  draft: WorkOrderDraft,
  workOrders: WorkOrder[],
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  sops: SOP[],
  sparesLabor: SparesLabor[]
): WorkOrderSuggestion[] {
  const suggestions: WorkOrderSuggestion[] = []

  if (!draft.equipment_area) {
    const areas = [...new Set(workOrders.map(wo => wo.equipment_area))]
    suggestions.push({
      field: 'equipment_area',
      suggestions: areas.slice(0, 10).map(area => ({
        value: area,
        confidence: 70,
        reason: 'Previously used equipment area',
        metadata: { area }
      }))
    })
  }

  if (draft.equipment_area) {
    suggestions.push(...analyzeWorkOrderPatterns(workOrders, draft))
    
    if (!draft.assigned_technician) {
      suggestions.push(suggestTechnician(
        employees,
        skillMatrix,
        draft.equipment_area,
        draft.type,
        workOrders
      ))
    }

    suggestions.push(suggestFromSOPs(sops, draft.equipment_area, draft.type))
    suggestions.push(suggestSpares(sparesLabor, draft.equipment_area))
  }

  return suggestions.filter(s => s.suggestions.length > 0)
}
