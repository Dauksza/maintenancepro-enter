import { 
  SkillMatrixEntry, 
  Employee, 
  CertificationReminder,
  NotificationPriority,
  NotificationType,
  CertificationRenewalStats
} from './types'

export const calculateDaysUntilExpiry = (expiryDate: string | null): number => {
  if (!expiryDate) return Infinity
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export const determineNotificationPriority = (daysUntilExpiry: number): NotificationPriority => {
  if (daysUntilExpiry < 0) return 'Critical'
  if (daysUntilExpiry <= 7) return 'Critical'
  if (daysUntilExpiry <= 30) return 'High'
  if (daysUntilExpiry <= 60) return 'Medium'
  return 'Low'
}

export const determineNotificationType = (daysUntilExpiry: number): NotificationType => {
  if (daysUntilExpiry < 0) return 'Certification Expired'
  if (daysUntilExpiry <= 30) return 'Renewal Required'
  if (daysUntilExpiry <= 90) return 'Certification Expiring'
  return 'Training Due'
}

export const shouldNotify = (
  daysUntilExpiry: number, 
  notifyAtDays: number[],
  lastNotifiedAt: string | null
): boolean => {
  if (daysUntilExpiry < 0) return true
  
  const shouldNotifyToday = notifyAtDays.some(days => daysUntilExpiry <= days)
  
  if (!shouldNotifyToday) return false
  
  if (!lastNotifiedAt) return true
  
  const lastNotified = new Date(lastNotifiedAt)
  const today = new Date()
  const daysSinceLastNotification = Math.floor(
    (today.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilExpiry < 0) return daysSinceLastNotification >= 7
  if (daysUntilExpiry <= 7) return daysSinceLastNotification >= 3
  if (daysUntilExpiry <= 30) return daysSinceLastNotification >= 7
  
  return daysSinceLastNotification >= 14
}

export const generateRemindersFromSkillMatrix = (
  skillMatrix: SkillMatrixEntry[],
  employees: Employee[],
  existingReminders: CertificationReminder[] = []
): CertificationReminder[] => {
  const reminders: CertificationReminder[] = []
  const now = new Date().toISOString()
  
  skillMatrix.forEach(skill => {
    if (!skill.certified || !skill.expiry_date) return
    
    const daysUntilExpiry = calculateDaysUntilExpiry(skill.expiry_date)
    
    if (daysUntilExpiry > 120) return
    
    const existingReminder = existingReminders.find(
      r => r.employee_id === skill.employee_id && r.skill_name === skill.skill_name
    )
    
    const priority = determineNotificationPriority(daysUntilExpiry)
    const notificationType = determineNotificationType(daysUntilExpiry)
    
    if (existingReminder) {
      reminders.push({
        ...existingReminder,
        days_until_expiry: daysUntilExpiry,
        priority,
        notification_type: notificationType,
        updated_at: now
      })
    } else {
      const employee = employees.find(e => e.employee_id === skill.employee_id)
      
      reminders.push({
        reminder_id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: skill.employee_id,
        skill_name: skill.skill_name,
        skill_category: skill.skill_category,
        certification_date: skill.certification_date || '',
        expiry_date: skill.expiry_date,
        days_until_expiry: daysUntilExpiry,
        notification_status: 'Pending',
        priority,
        notification_type: notificationType,
        last_notified_at: null,
        notification_count: 0,
        dismissed: false,
        notes: '',
        created_at: now,
        updated_at: now
      })
    }
  })
  
  return reminders
}

export const getCertificationStats = (
  skillMatrix: SkillMatrixEntry[],
  employees: Employee[]
): CertificationRenewalStats => {
  const certifications = skillMatrix.filter(s => s.certified && s.expiry_date)
  
  const expired = certifications.filter(s => calculateDaysUntilExpiry(s.expiry_date) < 0)
  const expiring30 = certifications.filter(s => {
    const days = calculateDaysUntilExpiry(s.expiry_date)
    return days >= 0 && days <= 30
  })
  const expiring60 = certifications.filter(s => {
    const days = calculateDaysUntilExpiry(s.expiry_date)
    return days > 30 && days <= 60
  })
  const expiring90 = certifications.filter(s => {
    const days = calculateDaysUntilExpiry(s.expiry_date)
    return days > 60 && days <= 90
  })
  const upToDate = certifications.filter(s => calculateDaysUntilExpiry(s.expiry_date) > 90)
  
  const categoriesMap = new Map<string, { expired: number; expiring: number; total: number }>()
  certifications.forEach(cert => {
    const existing = categoriesMap.get(cert.skill_category) || { expired: 0, expiring: 0, total: 0 }
    const days = calculateDaysUntilExpiry(cert.expiry_date)
    
    existing.total++
    if (days < 0) existing.expired++
    else if (days <= 90) existing.expiring++
    
    categoriesMap.set(cert.skill_category, existing)
  })
  
  const employeeMap = new Map<string, { expired_count: number; expiring_count: number }>()
  certifications.forEach(cert => {
    const existing = employeeMap.get(cert.employee_id) || { expired_count: 0, expiring_count: 0 }
    const days = calculateDaysUntilExpiry(cert.expiry_date)
    
    if (days < 0) existing.expired_count++
    else if (days <= 90) existing.expiring_count++
    
    employeeMap.set(cert.employee_id, existing)
  })
  
  const recentRenewals = certifications
    .filter(cert => {
      if (!cert.certification_date) return false
      const certDate = new Date(cert.certification_date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return certDate >= thirtyDaysAgo
    })
    .sort((a, b) => new Date(b.certification_date!).getTime() - new Date(a.certification_date!).getTime())
    .slice(0, 10)
    .map(cert => ({
      employee_id: cert.employee_id,
      skill_name: cert.skill_name,
      renewed_date: cert.certification_date!
    }))
  
  return {
    total_certifications: certifications.length,
    expired: expired.length,
    expiring_30_days: expiring30.length,
    expiring_60_days: expiring60.length,
    expiring_90_days: expiring90.length,
    up_to_date: upToDate.length,
    by_category: Array.from(categoriesMap.entries()).map(([category, stats]) => ({
      category,
      ...stats
    })),
    by_employee: Array.from(employeeMap.entries())
      .map(([employee_id, stats]) => {
        const employee = employees.find(e => e.employee_id === employee_id)
        return {
          employee_id,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          ...stats
        }
      })
      .filter(e => e.expired_count > 0 || e.expiring_count > 0)
      .sort((a, b) => (b.expired_count + b.expiring_count) - (a.expired_count + a.expiring_count)),
    recent_renewals: recentRenewals
  }
}

export const getDefaultNotificationSettings = () => ({
  settings_id: 'default-settings',
  enabled: true,
  notify_at_days: [90, 60, 30, 14, 7, 3, 1, 0],
  notify_methods: ['In-App', 'Email'] as Array<'Email' | 'SMS' | 'In-App'>,
  escalate_to_manager: true,
  escalation_days: 7,
  auto_disable_employee: false,
  auto_disable_days: -30,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const filterRemindersByPriority = (
  reminders: CertificationReminder[],
  priority?: NotificationPriority
): CertificationReminder[] => {
  if (!priority) return reminders
  return reminders.filter(r => r.priority === priority)
}

export const filterRemindersByEmployee = (
  reminders: CertificationReminder[],
  employeeId?: string
): CertificationReminder[] => {
  if (!employeeId) return reminders
  return reminders.filter(r => r.employee_id === employeeId)
}

export const getReminderCounts = (reminders: CertificationReminder[]) => {
  return {
    total: reminders.length,
    critical: reminders.filter(r => r.priority === 'Critical').length,
    high: reminders.filter(r => r.priority === 'High').length,
    medium: reminders.filter(r => r.priority === 'Medium').length,
    low: reminders.filter(r => r.priority === 'Low').length,
    expired: reminders.filter(r => r.notification_type === 'Certification Expired').length,
    expiring: reminders.filter(r => r.notification_type === 'Certification Expiring').length,
    pending: reminders.filter(r => r.notification_status === 'Pending').length,
    dismissed: reminders.filter(r => r.dismissed).length
  }
}
