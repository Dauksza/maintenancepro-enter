import type { 
  WorkOrder, 
  WorkOrderStatus, 
  MaintenanceFrequency,
  SparesLabor 
} from './types'

export function isOverdue(workOrder: WorkOrder): boolean {
  if (workOrder.status === 'Completed' || workOrder.status === 'Cancelled') {
    return false
  }
  return new Date(workOrder.scheduled_date) < new Date()
}

export function getStatusColor(status: WorkOrderStatus): string {
  const colors: Record<WorkOrderStatus, string> = {
    'Scheduled (Not Started)': 'bg-[oklch(0.60_0.15_240)] text-white',
    'In Progress': 'bg-[oklch(0.65_0.14_145)] text-white',
    'Completed': 'bg-[oklch(0.62_0.17_145)] text-white',
    'Cancelled': 'bg-muted text-muted-foreground',
    'Overdue': 'bg-[oklch(0.58_0.20_25)] text-white'
  }
  return colors[status]
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'Low': 'bg-muted text-muted-foreground',
    'Medium': 'bg-[oklch(0.60_0.15_240)] text-white',
    'High': 'bg-[oklch(0.72_0.18_55)] text-white',
    'Critical': 'bg-[oklch(0.45_0.21_15)] text-white'
  }
  return colors[priority] || 'bg-muted text-muted-foreground'
}

export function extractFrequencyFromTask(task: string): MaintenanceFrequency | null {
  const text = task.toLowerCase()
  if (text.includes('daily')) return 'Daily'
  if (text.includes('weekly')) return 'Weekly'
  if (text.includes('monthly')) return 'Monthly'
  if (text.includes('quarterly')) return 'Quarterly'
  if (text.includes('bi-yearly') || text.includes('biannual')) return 'Bi-Yearly'
  if (text.includes('yearly') || text.includes('annual')) return 'Yearly'
  return null
}

export function parseLaborTypical(text: string): Record<MaintenanceFrequency, number> {
  const result: Partial<Record<MaintenanceFrequency, number>> = {}
  
  const patterns = [
    { regex: /daily[:\s]+([0-9.]+)\s*h/i, key: 'Daily' as MaintenanceFrequency },
    { regex: /weekly[:\s]+([0-9.]+)\s*h/i, key: 'Weekly' as MaintenanceFrequency },
    { regex: /monthly[:\s]+([0-9.]+)\s*h/i, key: 'Monthly' as MaintenanceFrequency },
    { regex: /quarterly[:\s]+([0-9.]+)\s*h/i, key: 'Quarterly' as MaintenanceFrequency },
    { regex: /bi-yearly[:\s]+([0-9.]+)\s*h/i, key: 'Bi-Yearly' as MaintenanceFrequency },
    { regex: /yearly[:\s]+([0-9.]+)\s*h/i, key: 'Yearly' as MaintenanceFrequency }
  ]

  patterns.forEach(({ regex, key }) => {
    const match = text.match(regex)
    if (match) {
      result[key] = parseFloat(match[1])
    }
  })

  return result as Record<MaintenanceFrequency, number>
}

export function findMatchingSparesLabor(
  equipmentArea: string, 
  sparesLabor: SparesLabor[]
): SparesLabor | null {
  return sparesLabor.find(sl => 
    equipmentArea.toLowerCase().includes(sl.class.toLowerCase())
  ) || null
}

export function calculateNextMaintenanceDate(
  currentDate: string,
  frequency: MaintenanceFrequency
): string {
  const date = new Date(currentDate)
  
  switch (frequency) {
    case 'Daily':
      date.setDate(date.getDate() + 1)
      break
    case 'Weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'Monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'Quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'Bi-Yearly':
      date.setMonth(date.getMonth() + 6)
      break
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  
  return date.toISOString().split('T')[0]
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function generateWorkOrderId(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `WO-${year}${month}-${random}`
}

export function groupWorkOrdersBy<T extends string>(
  workOrders: WorkOrder[],
  key: keyof WorkOrder
): Record<string, WorkOrder[]> {
  return workOrders.reduce((acc, wo) => {
    const value = (wo[key] as string) || 'Unassigned'
    if (!acc[value]) {
      acc[value] = []
    }
    acc[value].push(wo)
    return acc
  }, {} as Record<string, WorkOrder[]>)
}

export function calculateTotalDowntime(workOrders: WorkOrder[]): number {
  return workOrders.reduce((sum, wo) => sum + (wo.estimated_downtime_hours || 0), 0)
}

export function calculateCompletionRate(workOrders: WorkOrder[]): number {
  if (workOrders.length === 0) return 0
  const completed = workOrders.filter(wo => wo.status === 'Completed').length
  return Math.round((completed / workOrders.length) * 100)
}
