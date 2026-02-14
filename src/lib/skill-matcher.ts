import type { 
  WorkOrder, 
  Employee, 
  SkillMatrixEntry, 
  EmployeeSchedule,
  SkillLevel,
  CertificationReminder
} from './types'
import { isOverdue } from './maintenance-utils'
import { differenceInDays } from 'date-fns'

export interface EmployeeRecommendation {
  employee: Employee
  score: number
  match_percentage: number
  strengths: string[]
  concerns: string[]
  workload_hours: number
  availability: 'Available' | 'Busy' | 'Overloaded' | 'Unavailable'
  skill_matches: SkillMatch[]
  certifications_status: 'All Valid' | 'Some Expiring' | 'Expired'
  recommended: boolean
}

export interface SkillMatch {
  skill_name: string
  skill_category: string
  level: SkillLevel
  certified: boolean
  is_required: boolean
  match_quality: 'Perfect' | 'Good' | 'Adequate' | 'Missing'
}

export interface WorkOrderAnalysis {
  work_order: WorkOrder
  required_skills: string[]
  optional_skills: string[]
  equipment_keywords: string[]
  complexity_score: number
}

const SKILL_LEVEL_SCORES: Record<SkillLevel, number> = {
  'Expert': 100,
  'Advanced': 75,
  'Intermediate': 50,
  'Beginner': 25
}

const PRIORITY_MULTIPLIERS = {
  'Critical': 2.0,
  'High': 1.5,
  'Medium': 1.0,
  'Low': 0.8
}

const MAX_DAILY_HOURS = 8

export function analyzeWorkOrder(workOrder: WorkOrder): WorkOrderAnalysis {
  const task = workOrder.task.toLowerCase()
  const description = workOrder.comments_description.toLowerCase()
  const equipment = workOrder.equipment_area.toLowerCase()
  const combined = `${task} ${description} ${equipment}`

  const skillKeywords = {
    'electrical': ['electric', 'electrical', 'wiring', 'circuit', 'voltage', 'current', 'breaker', 'panel'],
    'mechanical': ['mechanical', 'bearing', 'motor', 'pump', 'valve', 'shaft', 'gear', 'belt'],
    'hydraulic': ['hydraulic', 'cylinder', 'hose', 'pressure', 'fluid'],
    'pneumatic': ['pneumatic', 'air', 'compressor', 'actuator'],
    'plc': ['plc', 'programming', 'ladder', 'automation', 'control'],
    'hvac': ['hvac', 'heating', 'cooling', 'ventilation', 'air conditioning', 'temperature'],
    'welding': ['weld', 'welding', 'fabrication', 'cutting', 'torch'],
    'calibration': ['calibrat', 'adjust', 'tune', 'precision', 'measurement'],
    'inspection': ['inspect', 'examination', 'check', 'survey', 'audit'],
    'safety': ['safety', 'loto', 'lockout', 'ppe', 'hazard', 'emergency']
  }

  const requiredSkills: string[] = []
  const optionalSkills: string[] = []

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    const matches = keywords.filter(kw => combined.includes(kw)).length
    if (matches >= 2) {
      requiredSkills.push(skill)
    } else if (matches === 1) {
      optionalSkills.push(skill)
    }
  }

  const equipmentKeywords = workOrder.equipment_area
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(word => word.length > 3)

  let complexityScore = 50

  if (workOrder.priority_level === 'Critical') complexityScore += 30
  else if (workOrder.priority_level === 'High') complexityScore += 20
  else if (workOrder.priority_level === 'Medium') complexityScore += 10

  if (workOrder.estimated_downtime_hours > 8) complexityScore += 20
  else if (workOrder.estimated_downtime_hours > 4) complexityScore += 10

  if (requiredSkills.length > 3) complexityScore += 15
  if (workOrder.type === 'Calibration') complexityScore += 10
  if (workOrder.type === 'Repair') complexityScore += 5

  complexityScore = Math.min(complexityScore, 100)

  return {
    work_order: workOrder,
    required_skills: requiredSkills,
    optional_skills: optionalSkills,
    equipment_keywords: equipmentKeywords,
    complexity_score: complexityScore
  }
}

export function calculateEmployeeWorkload(
  employee: Employee,
  workOrders: WorkOrder[],
  targetDate: string
): number {
  const targetDay = new Date(targetDate).toISOString().split('T')[0]
  
  const assignedOrders = workOrders.filter(wo => 
    wo.assigned_technician === `${employee.first_name} ${employee.last_name}` &&
    wo.status !== 'Completed' &&
    wo.status !== 'Cancelled' &&
    wo.scheduled_date.split('T')[0] === targetDay
  )

  return assignedOrders.reduce((total, wo) => total + wo.estimated_downtime_hours, 0)
}

export function getEmployeeSkills(
  employee: Employee,
  skillMatrix: SkillMatrixEntry[]
): SkillMatrixEntry[] {
  return skillMatrix.filter(skill => skill.employee_id === employee.employee_id)
}

export function checkCertificationStatus(
  employee: Employee,
  skillMatrix: SkillMatrixEntry[],
  reminders: CertificationReminder[]
): 'All Valid' | 'Some Expiring' | 'Expired' {
  const employeeSkills = getEmployeeSkills(employee, skillMatrix)
  const certifiedSkills = employeeSkills.filter(s => s.certified && s.expiry_date)

  if (certifiedSkills.length === 0) return 'All Valid'

  const expired = certifiedSkills.some(skill => {
    if (!skill.expiry_date) return false
    return new Date(skill.expiry_date) < new Date()
  })

  if (expired) return 'Expired'

  const expiringSoon = certifiedSkills.some(skill => {
    if (!skill.expiry_date) return false
    const daysUntilExpiry = differenceInDays(new Date(skill.expiry_date), new Date())
    return daysUntilExpiry <= 30
  })

  if (expiringSoon) return 'Some Expiring'

  return 'All Valid'
}

export function matchEmployeeSkills(
  analysis: WorkOrderAnalysis,
  employee: Employee,
  employeeSkills: SkillMatrixEntry[]
): SkillMatch[] {
  const matches: SkillMatch[] = []

  const allRequiredSkills = [...analysis.required_skills, ...analysis.optional_skills]
  const uniqueSkills = [...new Set(allRequiredSkills)]

  for (const skillName of uniqueSkills) {
    const isRequired = analysis.required_skills.includes(skillName)
    const employeeSkill = employeeSkills.find(s => 
      s.skill_name.toLowerCase().includes(skillName) ||
      s.skill_category.toLowerCase().includes(skillName)
    )

    if (employeeSkill) {
      let matchQuality: 'Perfect' | 'Good' | 'Adequate' | 'Missing' = 'Adequate'
      
      if (employeeSkill.level === 'Expert' && employeeSkill.certified) {
        matchQuality = 'Perfect'
      } else if (employeeSkill.level === 'Advanced' || (employeeSkill.level === 'Expert' && !employeeSkill.certified)) {
        matchQuality = 'Good'
      } else if (employeeSkill.level === 'Intermediate') {
        matchQuality = 'Adequate'
      }

      matches.push({
        skill_name: employeeSkill.skill_name,
        skill_category: employeeSkill.skill_category,
        level: employeeSkill.level,
        certified: employeeSkill.certified,
        is_required: isRequired,
        match_quality: matchQuality
      })
    } else {
      matches.push({
        skill_name: skillName,
        skill_category: 'Unknown',
        level: 'Beginner',
        certified: false,
        is_required: isRequired,
        match_quality: 'Missing'
      })
    }
  }

  return matches
}

export function calculateRecommendationScore(
  analysis: WorkOrderAnalysis,
  employee: Employee,
  skillMatches: SkillMatch[],
  workloadHours: number,
  certificationStatus: 'All Valid' | 'Some Expiring' | 'Expired'
): number {
  let score = 0

  const requiredSkillMatches = skillMatches.filter(m => m.is_required && m.match_quality !== 'Missing')
  const totalRequiredSkills = skillMatches.filter(m => m.is_required).length

  if (totalRequiredSkills > 0) {
    const requiredSkillScore = (requiredSkillMatches.length / totalRequiredSkills) * 40
    score += requiredSkillScore

    for (const match of requiredSkillMatches) {
      score += (SKILL_LEVEL_SCORES[match.level] / 100) * 10
      if (match.certified) score += 5
    }
  } else {
    score += 40
  }

  const optionalSkillMatches = skillMatches.filter(m => !m.is_required && m.match_quality !== 'Missing')
  score += optionalSkillMatches.length * 3

  if (employee.status === 'Active') {
    score += 10
  } else if (employee.status === 'On Leave') {
    score -= 50
  } else {
    score -= 100
  }

  if (workloadHours < MAX_DAILY_HOURS * 0.5) {
    score += 15
  } else if (workloadHours < MAX_DAILY_HOURS * 0.75) {
    score += 10
  } else if (workloadHours < MAX_DAILY_HOURS) {
    score += 5
  } else {
    score -= 20
  }

  if (certificationStatus === 'Expired') {
    score -= 30
  } else if (certificationStatus === 'Some Expiring') {
    score -= 5
  } else {
    score += 5
  }

  const priorityMultiplier = PRIORITY_MULTIPLIERS[analysis.work_order.priority_level]
  score *= priorityMultiplier

  return Math.max(0, Math.min(score, 100))
}

export function generateRecommendations(
  workOrder: WorkOrder,
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  workOrders: WorkOrder[],
  reminders: CertificationReminder[] = []
): EmployeeRecommendation[] {
  const analysis = analyzeWorkOrder(workOrder)
  const recommendations: EmployeeRecommendation[] = []

  for (const employee of employees) {
    if (employee.status === 'Inactive') continue

    const employeeSkills = getEmployeeSkills(employee, skillMatrix)
    const workloadHours = calculateEmployeeWorkload(employee, workOrders, workOrder.scheduled_date)
    const certificationStatus = checkCertificationStatus(employee, skillMatrix, reminders)
    const skillMatches = matchEmployeeSkills(analysis, employee, employeeSkills)

    const score = calculateRecommendationScore(
      analysis,
      employee,
      skillMatches,
      workloadHours,
      certificationStatus
    )

    const strengths: string[] = []
    const concerns: string[] = []

    const perfectMatches = skillMatches.filter(m => m.match_quality === 'Perfect')
    if (perfectMatches.length > 0) {
      strengths.push(`Expert in ${perfectMatches.map(m => m.skill_name).join(', ')}`)
    }

    const certifiedSkills = skillMatches.filter(m => m.certified && m.match_quality !== 'Missing')
    if (certifiedSkills.length > 0) {
      strengths.push(`Certified: ${certifiedSkills.length} skill${certifiedSkills.length > 1 ? 's' : ''}`)
    }

    if (workloadHours < MAX_DAILY_HOURS * 0.5) {
      strengths.push('Low workload - readily available')
    }

    const missingRequired = skillMatches.filter(m => m.is_required && m.match_quality === 'Missing')
    if (missingRequired.length > 0) {
      concerns.push(`Missing required skills: ${missingRequired.map(m => m.skill_name).join(', ')}`)
    }

    if (certificationStatus === 'Expired') {
      concerns.push('Has expired certifications')
    } else if (certificationStatus === 'Some Expiring') {
      concerns.push('Some certifications expiring soon')
    }

    if (employee.status === 'On Leave') {
      concerns.push('Currently on leave')
    }

    if (workloadHours >= MAX_DAILY_HOURS) {
      concerns.push(`Overloaded (${workloadHours}h scheduled)`)
    } else if (workloadHours >= MAX_DAILY_HOURS * 0.75) {
      concerns.push(`High workload (${workloadHours}h scheduled)`)
    }

    let availability: 'Available' | 'Busy' | 'Overloaded' | 'Unavailable' = 'Available'
    if (employee.status !== 'Active') {
      availability = 'Unavailable'
    } else if (workloadHours >= MAX_DAILY_HOURS) {
      availability = 'Overloaded'
    } else if (workloadHours >= MAX_DAILY_HOURS * 0.6) {
      availability = 'Busy'
    }

    const requiredSkillsCount = skillMatches.filter(m => m.is_required).length
    const matchedRequiredSkills = skillMatches.filter(m => m.is_required && m.match_quality !== 'Missing').length
    const matchPercentage = requiredSkillsCount > 0 
      ? (matchedRequiredSkills / requiredSkillsCount) * 100 
      : 100

    const recommended = score >= 60 && 
                       availability !== 'Unavailable' && 
                       certificationStatus !== 'Expired' &&
                       matchPercentage >= 80

    recommendations.push({
      employee,
      score,
      match_percentage: matchPercentage,
      strengths,
      concerns,
      workload_hours: workloadHours,
      availability,
      skill_matches: skillMatches,
      certifications_status: certificationStatus,
      recommended
    })
  }

  return recommendations.sort((a, b) => b.score - a.score)
}

export function getBestMatch(
  workOrder: WorkOrder,
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  workOrders: WorkOrder[],
  reminders: CertificationReminder[] = []
): EmployeeRecommendation | null {
  const recommendations = generateRecommendations(workOrder, employees, skillMatrix, workOrders, reminders)
  const bestMatch = recommendations.find(r => r.recommended)
  return bestMatch || (recommendations.length > 0 ? recommendations[0] : null)
}

export function getRecommendationSummary(recommendation: EmployeeRecommendation): string {
  const name = `${recommendation.employee.first_name} ${recommendation.employee.last_name}`
  
  if (recommendation.recommended) {
    return `${name} - Excellent match (${Math.round(recommendation.score)}% score, ${Math.round(recommendation.match_percentage)}% skill match)`
  } else if (recommendation.score >= 50) {
    return `${name} - Good alternative (${Math.round(recommendation.score)}% score) - ${recommendation.concerns[0] || 'Some limitations'}`
  } else {
    return `${name} - Not recommended (${Math.round(recommendation.score)}% score) - ${recommendation.concerns.join(', ')}`
  }
}
