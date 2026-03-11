import type {
  WorkOrder,
  SOP,
  SparesLabor,
  Employee,
  SkillMatrixEntry,
  EmployeeSchedule,
  Message,
  CertificationReminder,
  WorkOrderNotification,
  PartInventoryItem,
  PartTransaction,
  FormTemplate,
  FormSubmission,
  UserProfile,
  Asset,
  Area,
  Skill,
  DashboardWidget
} from './types'

declare const spark: {
  kv: {
    get: <T>(key: string) => Promise<T | undefined>
    set: <T>(key: string, value: T) => Promise<void>
    delete: (key: string) => Promise<void>
  }
}

export interface DatabaseSnapshot {
  version: string
  timestamp: string
  data: {
    workOrders: WorkOrder[]
    sops: SOP[]
    sparesLabor: SparesLabor[]
    employees: Employee[]
    skillMatrix: SkillMatrixEntry[]
    schedules: EmployeeSchedule[]
    messages: Message[]
    reminders: CertificationReminder[]
    notifications: WorkOrderNotification[]
    parts: PartInventoryItem[]
    partTransactions: PartTransaction[]
    formTemplates: FormTemplate[]
    formSubmissions: FormSubmission[]
    userProfile: UserProfile | null
    assets: Asset[]
    areas: Area[]
    skills: Skill[]
    dashboardWidgets: DashboardWidget[]
  }
}

export const DATABASE_KEYS = {
  WORK_ORDERS: 'maintenance-work-orders',
  SOPS: 'sop-library',
  SPARES_LABOR: 'spares-labor',
  EMPLOYEES: 'employees',
  SKILL_MATRIX: 'skill-matrix',
  SCHEDULES: 'employee-schedules',
  MESSAGES: 'employee-messages',
  REMINDERS: 'certification-reminders',
  NOTIFICATIONS: 'work-order-notifications',
  PARTS: 'parts-inventory',
  PART_TRANSACTIONS: 'part-transactions',
  FORM_TEMPLATES: 'form-templates',
  FORM_SUBMISSIONS: 'form-submissions',
  USER_PROFILE: 'user-profile',
  NOTIFICATION_PREFS: 'notification-preferences',
  ASSETS: 'assets',
  AREAS: 'areas',
  SKILLS: 'skills',
  DASHBOARD_WIDGETS: 'dashboard-widgets'
} as const

export async function exportDatabase(): Promise<DatabaseSnapshot> {
  const workOrders = await spark.kv.get<WorkOrder[]>(DATABASE_KEYS.WORK_ORDERS) || []
  const sops = await spark.kv.get<SOP[]>(DATABASE_KEYS.SOPS) || []
  const sparesLabor = await spark.kv.get<SparesLabor[]>(DATABASE_KEYS.SPARES_LABOR) || []
  const employees = await spark.kv.get<Employee[]>(DATABASE_KEYS.EMPLOYEES) || []
  const skillMatrix = await spark.kv.get<SkillMatrixEntry[]>(DATABASE_KEYS.SKILL_MATRIX) || []
  const schedules = await spark.kv.get<EmployeeSchedule[]>(DATABASE_KEYS.SCHEDULES) || []
  const messages = await spark.kv.get<Message[]>(DATABASE_KEYS.MESSAGES) || []
  const reminders = await spark.kv.get<CertificationReminder[]>(DATABASE_KEYS.REMINDERS) || []
  const notifications = await spark.kv.get<WorkOrderNotification[]>(DATABASE_KEYS.NOTIFICATIONS) || []
  const parts = await spark.kv.get<PartInventoryItem[]>(DATABASE_KEYS.PARTS) || []
  const partTransactions = await spark.kv.get<PartTransaction[]>(DATABASE_KEYS.PART_TRANSACTIONS) || []
  const formTemplates = await spark.kv.get<FormTemplate[]>(DATABASE_KEYS.FORM_TEMPLATES) || []
  const formSubmissions = await spark.kv.get<FormSubmission[]>(DATABASE_KEYS.FORM_SUBMISSIONS) || []
  const userProfile = await spark.kv.get<UserProfile | null>(DATABASE_KEYS.USER_PROFILE) || null
  const assets = await spark.kv.get<Asset[]>(DATABASE_KEYS.ASSETS) || []
  const areas = await spark.kv.get<Area[]>(DATABASE_KEYS.AREAS) || []
  const skills = await spark.kv.get<Skill[]>(DATABASE_KEYS.SKILLS) || []
  const dashboardWidgets = await spark.kv.get<DashboardWidget[]>(DATABASE_KEYS.DASHBOARD_WIDGETS) || []

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data: {
      workOrders,
      sops,
      sparesLabor,
      employees,
      skillMatrix,
      schedules,
      messages,
      reminders,
      notifications,
      parts,
      partTransactions,
      formTemplates,
      formSubmissions,
      userProfile,
      assets,
      areas,
      skills,
      dashboardWidgets
    }
  }
}

export async function importDatabase(snapshot: DatabaseSnapshot): Promise<void> {
  await spark.kv.set(DATABASE_KEYS.WORK_ORDERS, snapshot.data.workOrders)
  await spark.kv.set(DATABASE_KEYS.SOPS, snapshot.data.sops)
  await spark.kv.set(DATABASE_KEYS.SPARES_LABOR, snapshot.data.sparesLabor)
  await spark.kv.set(DATABASE_KEYS.EMPLOYEES, snapshot.data.employees)
  await spark.kv.set(DATABASE_KEYS.SKILL_MATRIX, snapshot.data.skillMatrix)
  await spark.kv.set(DATABASE_KEYS.SCHEDULES, snapshot.data.schedules)
  await spark.kv.set(DATABASE_KEYS.MESSAGES, snapshot.data.messages)
  await spark.kv.set(DATABASE_KEYS.REMINDERS, snapshot.data.reminders)
  await spark.kv.set(DATABASE_KEYS.NOTIFICATIONS, snapshot.data.notifications)
  await spark.kv.set(DATABASE_KEYS.PARTS, snapshot.data.parts)
  await spark.kv.set(DATABASE_KEYS.PART_TRANSACTIONS, snapshot.data.partTransactions)
  await spark.kv.set(DATABASE_KEYS.FORM_TEMPLATES, snapshot.data.formTemplates)
  await spark.kv.set(DATABASE_KEYS.FORM_SUBMISSIONS, snapshot.data.formSubmissions)
  await spark.kv.set(DATABASE_KEYS.USER_PROFILE, snapshot.data.userProfile)
  await spark.kv.set(DATABASE_KEYS.ASSETS, snapshot.data.assets)
  await spark.kv.set(DATABASE_KEYS.AREAS, snapshot.data.areas)
  await spark.kv.set(DATABASE_KEYS.SKILLS, snapshot.data.skills)
  await spark.kv.set(DATABASE_KEYS.DASHBOARD_WIDGETS, snapshot.data.dashboardWidgets)
}

export async function clearAllData(): Promise<void> {
  const keys = Object.values(DATABASE_KEYS)
  await Promise.all(keys.map(key => spark.kv.delete(key)))
}

export async function getDataStatistics() {
  const workOrders = await spark.kv.get<WorkOrder[]>(DATABASE_KEYS.WORK_ORDERS) || []
  const sops = await spark.kv.get<SOP[]>(DATABASE_KEYS.SOPS) || []
  const employees = await spark.kv.get<Employee[]>(DATABASE_KEYS.EMPLOYEES) || []
  const skillMatrix = await spark.kv.get<SkillMatrixEntry[]>(DATABASE_KEYS.SKILL_MATRIX) || []
  const parts = await spark.kv.get<PartInventoryItem[]>(DATABASE_KEYS.PARTS) || []
  const formTemplates = await spark.kv.get<FormTemplate[]>(DATABASE_KEYS.FORM_TEMPLATES) || []
  const formSubmissions = await spark.kv.get<FormSubmission[]>(DATABASE_KEYS.FORM_SUBMISSIONS) || []
  const assets = await spark.kv.get<Asset[]>(DATABASE_KEYS.ASSETS) || []
  const areas = await spark.kv.get<Area[]>(DATABASE_KEYS.AREAS) || []
  const skills = await spark.kv.get<Skill[]>(DATABASE_KEYS.SKILLS) || []

  return {
    workOrders: {
      total: workOrders.length,
      byStatus: workOrders.reduce((acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    },
    sops: {
      total: sops.length
    },
    employees: {
      total: employees.length,
      active: employees.filter(e => e.status === 'Active').length
    },
    skills: {
      total: skillMatrix.length,
      uniqueSkills: new Set(skillMatrix.map(s => s.skill_name)).size
    },
    parts: {
      total: parts.length,
      lowStock: parts.filter(p => p.status === 'Low Stock').length,
      outOfStock: parts.filter(p => p.status === 'Out of Stock').length
    },
    forms: {
      templates: formTemplates.length,
      submissions: formSubmissions.length
    },
    assets: {
      total: assets.length,
      operational: assets.filter(a => a.status === 'Operational').length
    },
    areas: {
      total: areas.length
    },
    skillDefinitions: {
      total: skills.length
    }
  }
}

export async function validateDataIntegrity(): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  const workOrders = await spark.kv.get<WorkOrder[]>(DATABASE_KEYS.WORK_ORDERS) || []
  const employees = await spark.kv.get<Employee[]>(DATABASE_KEYS.EMPLOYEES) || []
  const skillMatrix = await spark.kv.get<SkillMatrixEntry[]>(DATABASE_KEYS.SKILL_MATRIX) || []
  const parts = await spark.kv.get<PartInventoryItem[]>(DATABASE_KEYS.PARTS) || []
  const partTransactions = await spark.kv.get<PartTransaction[]>(DATABASE_KEYS.PART_TRANSACTIONS) || []
  const formSubmissions = await spark.kv.get<FormSubmission[]>(DATABASE_KEYS.FORM_SUBMISSIONS) || []
  const formTemplates = await spark.kv.get<FormTemplate[]>(DATABASE_KEYS.FORM_TEMPLATES) || []
  const assets = await spark.kv.get<Asset[]>(DATABASE_KEYS.ASSETS) || []
  const areas = await spark.kv.get<Area[]>(DATABASE_KEYS.AREAS) || []

  const employeeIds = new Set(employees.map(e => e.employee_id))
  const partIds = new Set(parts.map(p => p.part_id))
  const templateIds = new Set(formTemplates.map(t => t.template_id))
  const assetIds = new Set(assets.map(a => a.asset_id))
  const areaIds = new Set(areas.map(a => a.area_id))

  workOrders.forEach((wo, idx) => {
    if (!wo.work_order_id) {
      errors.push(`Work order at index ${idx} missing work_order_id`)
    }
    if (!wo.scheduled_date) {
      errors.push(`Work order ${wo.work_order_id} missing scheduled_date`)
    }
    if (wo.priority_level && !['Low', 'Medium', 'High', 'Critical'].includes(wo.priority_level)) {
      errors.push(`Work order ${wo.work_order_id} has invalid priority: ${wo.priority_level}`)
    }
    if (wo.assigned_technician && !wo.assigned_technician.includes(' ')) {
      warnings.push(`Work order ${wo.work_order_id} has technician that might not be in employee list`)
    }
  })

  skillMatrix.forEach((skill, idx) => {
    if (!skill.employee_id) {
      errors.push(`Skill entry at index ${idx} missing employee_id`)
    } else if (!employeeIds.has(skill.employee_id)) {
      errors.push(`Skill entry references non-existent employee ${skill.employee_id}`)
    }
  })

  partTransactions.forEach((txn, idx) => {
    if (!txn.part_id) {
      errors.push(`Transaction at index ${idx} missing part_id`)
    } else if (!partIds.has(txn.part_id)) {
      errors.push(`Transaction ${txn.transaction_id} references non-existent part ${txn.part_id}`)
    }
  })

  formSubmissions.forEach((sub, idx) => {
    if (!sub.template_id) {
      errors.push(`Form submission at index ${idx} missing template_id`)
    } else if (!templateIds.has(sub.template_id)) {
      errors.push(`Form submission ${sub.submission_id} references non-existent template ${sub.template_id}`)
    }
  })

  assets.forEach((asset, idx) => {
    if (asset.area_id && !areaIds.has(asset.area_id)) {
      warnings.push(`Asset ${asset.asset_id} references non-existent area ${asset.area_id}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

export async function repairDataIntegrity(): Promise<{
  repaired: boolean
  actions: string[]
}> {
  const actions: string[] = []

  const workOrders = await spark.kv.get<WorkOrder[]>(DATABASE_KEYS.WORK_ORDERS) || []
  const parts = await spark.kv.get<PartInventoryItem[]>(DATABASE_KEYS.PARTS) || []

  let modified = false

  const repairedWorkOrders = workOrders.map(wo => {
    const repairs: Partial<WorkOrder> = {}
    
    if (!wo.work_order_id) {
      repairs.work_order_id = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      actions.push(`Generated missing work_order_id: ${repairs.work_order_id}`)
      modified = true
    }
    
    if (!wo.created_at) {
      repairs.created_at = new Date().toISOString()
      actions.push(`Set missing created_at for ${wo.work_order_id}`)
      modified = true
    }
    
    if (!wo.updated_at) {
      repairs.updated_at = new Date().toISOString()
      actions.push(`Set missing updated_at for ${wo.work_order_id}`)
      modified = true
    }

    return { ...wo, ...repairs }
  })

  const repairedParts = parts.map(part => {
    const repairs: Partial<PartInventoryItem> = {}
    
    if (part.quantity_on_hand < 0) {
      repairs.quantity_on_hand = 0
      actions.push(`Fixed negative quantity for part ${part.part_id}`)
      modified = true
    }
    
    if (part.quantity_on_hand === 0 && part.status !== 'Out of Stock') {
      repairs.status = 'Out of Stock'
      actions.push(`Fixed status for part ${part.part_id}`)
      modified = true
    } else if (part.quantity_on_hand > 0 && part.quantity_on_hand <= part.minimum_stock_level && part.status !== 'Low Stock') {
      repairs.status = 'Low Stock'
      actions.push(`Fixed status for part ${part.part_id}`)
      modified = true
    } else if (part.quantity_on_hand > part.minimum_stock_level && part.status !== 'In Stock') {
      repairs.status = 'In Stock'
      actions.push(`Fixed status for part ${part.part_id}`)
      modified = true
    }

    return { ...part, ...repairs }
  })

  if (modified) {
    await spark.kv.set(DATABASE_KEYS.WORK_ORDERS, repairedWorkOrders)
    await spark.kv.set(DATABASE_KEYS.PARTS, repairedParts)
  }

  return {
    repaired: modified,
    actions
  }
}

export function downloadSnapshot(snapshot: DatabaseSnapshot) {
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `maintenancepro-backup-${snapshot.timestamp.replace(/:/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isValidSnapshot(obj: unknown): obj is DatabaseSnapshot {
  if (!obj || typeof obj !== 'object') return false
  const snap = obj as Record<string, unknown>
  if (typeof snap.version !== 'string') return false
  if (typeof snap.timestamp !== 'string') return false
  if (!snap.data || typeof snap.data !== 'object') return false
  const data = snap.data as Record<string, unknown>
  const requiredArrayFields: Array<keyof DatabaseSnapshot['data']> = [
    'workOrders', 'sops', 'sparesLabor', 'employees', 'skillMatrix',
    'schedules', 'messages', 'reminders', 'notifications', 'parts',
    'partTransactions', 'formTemplates', 'formSubmissions',
    'assets', 'areas', 'skills', 'dashboardWidgets'
  ]
  for (const field of requiredArrayFields) {
    if (!Array.isArray(data[field])) return false
  }
  return true
}

export async function uploadSnapshot(file: File): Promise<DatabaseSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(e.target?.result as string)
        if (!isValidSnapshot(parsed)) {
          reject(new Error('Invalid backup file: missing required fields'))
          return
        }
        resolve(parsed)
      } catch {
        reject(new Error('Invalid backup file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
