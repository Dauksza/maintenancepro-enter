import type { 
  Employee, 
  SkillMatrixEntry, 
  EmployeeSchedule, 
  Message, 
  EmployeeAnalytics,
  WorkOrder 
} from './types'

export function generateSampleEmployees(): Employee[] {
  const positions = ['Senior Technician', 'Maintenance Technician', 'Junior Technician', 'Lead Technician', 'Supervisor']
  const departments = ['Mechanical', 'Electrical', 'Instrumentation', 'HVAC', 'General Maintenance']
  const shifts = ['Day Shift', 'Night Shift', 'Rotating', 'On Call'] as const
  
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Amanda', 'James', 'Lisa']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  
  return Array.from({ length: 12 }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const employeeId = `EMP${String(i + 1).padStart(4, '0')}`
    
    return {
      employee_id: employeeId,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maintenancepro.com`,
      phone: `(555) ${String(Math.floor(Math.random() * 900 + 100))}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
      position: positions[i % positions.length],
      department: departments[i % departments.length],
      status: i === 11 ? 'On Leave' : 'Active',
      shift: shifts[i % shifts.length],
      hire_date: new Date(2020 + Math.floor(i / 3), (i * 2) % 12, 1).toISOString(),
      emergency_contact_name: `${firstNames[(i + 1) % firstNames.length]} ${lastNames[(i + 2) % lastNames.length]}`,
      emergency_contact_phone: `(555) ${String(Math.floor(Math.random() * 900 + 100))}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
      certifications: generateCertifications(i),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })
}

function generateCertifications(index: number): string[] {
  const allCerts = [
    'OSHA 30-Hour',
    'Forklift Operator',
    'Confined Space Entry',
    'First Aid/CPR',
    'Electrical Safety',
    'Welding Certified',
    'HVAC Certified',
    'Lockout/Tagout',
    'Crane Operator',
    'Rigging Certified'
  ]
  
  const certCount = 2 + (index % 4)
  return allCerts.slice(index % 3, index % 3 + certCount)
}

export function generateSampleSkillMatrix(): SkillMatrixEntry[] {
  const skills = [
    { category: 'Mechanical', skills: ['Pump Maintenance', 'Bearing Replacement', 'Alignment', 'Vibration Analysis'] },
    { category: 'Electrical', skills: ['Motor Troubleshooting', 'PLC Programming', 'Wiring', 'VFD Configuration'] },
    { category: 'Instrumentation', skills: ['Sensor Calibration', 'Flow Meter Setup', 'Control Loop Tuning', 'SCADA'] },
    { category: 'Safety', skills: ['LOTO Procedures', 'Confined Space', 'Fall Protection', 'Hot Work'] },
    { category: 'Welding', skills: ['MIG Welding', 'TIG Welding', 'Arc Welding', 'Pipe Welding'] }
  ]
  
  const levels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  const entries: SkillMatrixEntry[] = []
  
  for (let empIndex = 0; empIndex < 12; empIndex++) {
    const employeeId = `EMP${String(empIndex + 1).padStart(4, '0')}`
    const primaryCategory = skills[empIndex % skills.length]
    
    primaryCategory.skills.forEach((skillName, skillIndex) => {
      const level = levels[Math.min(3, Math.floor(empIndex / 3) + (skillIndex % 2))]
      const certified = level === 'Advanced' || level === 'Expert'
      
      entries.push({
        employee_id: employeeId,
        skill_category: primaryCategory.category,
        skill_name: skillName,
        level,
        certified,
        certification_date: certified ? new Date(2022, empIndex % 12, 1).toISOString() : null,
        expiry_date: certified ? new Date(2025, (empIndex + 6) % 12, 1).toISOString() : null,
        notes: certified ? 'Certified and current' : 'In training'
      })
    })
    
    if (empIndex % 2 === 0) {
      const secondaryCategory = skills[(empIndex + 1) % skills.length]
      secondaryCategory.skills.slice(0, 2).forEach((skillName) => {
        entries.push({
          employee_id: employeeId,
          skill_category: secondaryCategory.category,
          skill_name: skillName,
          level: 'Intermediate',
          certified: false,
          certification_date: null,
          expiry_date: null,
          notes: 'Cross-training in progress'
        })
      })
    }
  }
  
  return entries
}

export function generateSampleSchedules(): EmployeeSchedule[] {
  const schedules: EmployeeSchedule[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  
  for (let day = 0; day < 21; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    for (let empIndex = 0; empIndex < 12; empIndex++) {
      const employeeId = `EMP${String(empIndex + 1).padStart(4, '0')}`
      const shiftType = empIndex % 4
      
      let shiftStart = '08:00'
      let shiftEnd = '16:00'
      let hours = 8
      
      if (shiftType === 1) {
        shiftStart = '16:00'
        shiftEnd = '00:00'
        hours = 8
      } else if (shiftType === 2) {
        shiftStart = day % 2 === 0 ? '08:00' : '16:00'
        shiftEnd = day % 2 === 0 ? '16:00' : '00:00'
        hours = 8
      } else if (shiftType === 3) {
        shiftStart = '00:00'
        shiftEnd = '00:00'
        hours = 0
      }
      
      if (empIndex === 11 && day >= 10 && day <= 16) {
        continue
      }
      
      if (hours > 0) {
        schedules.push({
          schedule_id: `SCH-${employeeId}-${dateStr}`,
          employee_id: employeeId,
          date: dateStr,
          shift_start: shiftStart,
          shift_end: shiftEnd,
          hours,
          notes: shiftType === 3 ? 'On-call shift' : '',
          created_at: new Date().toISOString()
        })
      }
    }
  }
  
  return schedules
}

export function calculateEmployeeAnalytics(
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  workOrders: WorkOrder[]
): EmployeeAnalytics {
  const activeEmployees = employees.filter(e => e.status === 'Active').length
  const onLeave = employees.filter(e => e.status === 'On Leave').length
  
  const byDepartment = employees.reduce((acc, emp) => {
    const existing = acc.find(d => d.department === emp.department)
    if (existing) {
      existing.count++
    } else {
      acc.push({ department: emp.department, count: 1 })
    }
    return acc
  }, [] as Array<{ department: string; count: number }>)
  
  const byShift = employees.reduce((acc, emp) => {
    const existing = acc.find(s => s.shift === emp.shift)
    if (existing) {
      existing.count++
    } else {
      acc.push({ shift: emp.shift, count: 1 })
    }
    return acc
  }, [] as Array<{ shift: any; count: number }>)
  
  const skillCoverage = skillMatrix.reduce((acc, entry) => {
    const existing = acc.find(s => s.skill === entry.skill_name)
    const levelValue = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 }[entry.level]
    
    if (existing) {
      existing.employee_count++
      existing.total_level += levelValue
      existing.avg_level = existing.total_level / existing.employee_count
    } else {
      acc.push({ 
        skill: entry.skill_name, 
        employee_count: 1, 
        avg_level: levelValue,
        total_level: levelValue 
      })
    }
    return acc
  }, [] as Array<{ skill: string; employee_count: number; avg_level: number; total_level: number }>)
    .map(({ skill, employee_count, avg_level }) => ({ skill, employee_count, avg_level }))
  
  const now = new Date()
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  
  const certificationExpiringSoon = skillMatrix
    .filter(entry => {
      if (!entry.expiry_date) return false
      const expiryDate = new Date(entry.expiry_date)
      return expiryDate > now && expiryDate <= threeMonthsFromNow
    })
    .map(entry => ({
      employee_id: entry.employee_id,
      skill: entry.skill_name,
      expiry_date: entry.expiry_date!
    }))
  
  const completionByTech = workOrders
    .filter(wo => wo.status === 'Completed' && wo.assigned_technician)
    .reduce((acc, wo) => {
      const tech = wo.assigned_technician!
      const existing = acc.find(t => t.technician === tech)
      
      if (existing) {
        existing.completed++
        if (wo.scheduled_date && wo.completed_at) {
          const scheduledTime = new Date(wo.scheduled_date).getTime()
          const completedTime = new Date(wo.completed_at).getTime()
          const daysDiff = Math.abs((completedTime - scheduledTime) / (1000 * 60 * 60 * 24))
          existing.total_time += daysDiff
        }
      } else {
        let initialTime = 0
        if (wo.scheduled_date && wo.completed_at) {
          const scheduledTime = new Date(wo.scheduled_date).getTime()
          const completedTime = new Date(wo.completed_at).getTime()
          initialTime = Math.abs((completedTime - scheduledTime) / (1000 * 60 * 60 * 24))
        }
        acc.push({ technician: tech, completed: 1, avg_time: 0, total_time: initialTime })
      }
      return acc
    }, [] as Array<{ technician: string; completed: number; avg_time: number; total_time: number }>)
    .map(({ technician, completed, total_time }) => ({
      technician,
      completed,
      avg_time: completed > 0 ? total_time / completed : 0
    }))
  
  return {
    total_employees: employees.length,
    active_employees: activeEmployees,
    on_leave: onLeave,
    by_department: byDepartment,
    by_shift: byShift,
    skill_coverage: skillCoverage,
    certification_expiring_soon: certificationExpiringSoon,
    work_order_completion_by_tech: completionByTech
  }
}

export function getEmployeeFullName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name}`
}

export function getEmployeesByDepartment(employees: Employee[], department: string): Employee[] {
  return employees.filter(e => e.department === department)
}

export function getEmployeeSkills(skillMatrix: SkillMatrixEntry[], employeeId: string): SkillMatrixEntry[] {
  return skillMatrix.filter(s => s.employee_id === employeeId)
}

export function getScheduleForEmployee(schedules: EmployeeSchedule[], employeeId: string, startDate: string, endDate: string): EmployeeSchedule[] {
  return schedules.filter(s => 
    s.employee_id === employeeId && 
    s.date >= startDate && 
    s.date <= endDate
  )
}
