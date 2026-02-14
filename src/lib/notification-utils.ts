import type {
  WorkOrderNotification,
  WorkOrderNotificationType,
  NotificationPriority,
  WorkOrder,
  Employee,
  SkillMatrixEntry
} from './types'
import { generateRecommendations } from './skill-matcher'
import { v4 as uuidv4 } from 'uuid'

export function generateAssignmentSuggestionNotification(
  workOrder: WorkOrder,
  employee: Employee,
  matchScore: number,
  reasons: string[],
  skillMatches: string[]
): WorkOrderNotification {
  const employeeName = `${employee.first_name} ${employee.last_name}`
  
  return {
    notification_id: uuidv4(),
    employee_id: employee.employee_id,
    work_order_id: workOrder.work_order_id,
    type: 'Assignment Suggestion',
    title: `New Assignment Suggestion: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
    message: `You've been suggested for work order ${workOrder.work_order_id} based on your skills and availability. Match score: ${matchScore}%`,
    status: 'Unread',
    priority: mapPriorityToNotificationPriority(workOrder.priority_level),
    action_label: 'View Work Order',
    match_score: matchScore,
    reasons: reasons,
    created_at: new Date().toISOString(),
    read_at: null,
    responded_at: null,
    metadata: {
      suggested_by: 'skill-matcher',
      skill_matches: skillMatches,
      area_match: true,
      priority_match: true
    }
  }
}

export function generateAssignmentChangeNotification(
  workOrder: WorkOrder,
  employee: Employee,
  previousTechnician: string | null
): WorkOrderNotification {
  const employeeName = `${employee.first_name} ${employee.last_name}`
  const message = previousTechnician
    ? `Work order ${workOrder.work_order_id} has been reassigned from ${previousTechnician} to you`
    : `You have been assigned to work order ${workOrder.work_order_id}`
  
  return {
    notification_id: uuidv4(),
    employee_id: employee.employee_id,
    work_order_id: workOrder.work_order_id,
    type: 'Assignment Changed',
    title: `Assignment: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
    message: message,
    status: 'Unread',
    priority: mapPriorityToNotificationPriority(workOrder.priority_level),
    action_label: 'View Details',
    created_at: new Date().toISOString(),
    read_at: null,
    responded_at: null,
    metadata: {
      previous_technician: previousTechnician || undefined,
      suggested_by: 'manual'
    }
  }
}

export function generateWorkOrderCreatedNotification(
  workOrder: WorkOrder,
  employee: Employee
): WorkOrderNotification {
  return {
    notification_id: uuidv4(),
    employee_id: employee.employee_id,
    work_order_id: workOrder.work_order_id,
    type: 'Work Order Created',
    title: `New Work Order: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
    message: `A new ${workOrder.priority_level.toLowerCase()} priority work order has been created in ${workOrder.equipment_area}`,
    status: 'Unread',
    priority: mapPriorityToNotificationPriority(workOrder.priority_level),
    action_label: 'Review',
    created_at: new Date().toISOString(),
    read_at: null,
    responded_at: null
  }
}

export function generateOverdueNotification(
  workOrder: WorkOrder,
  employee: Employee
): WorkOrderNotification {
  return {
    notification_id: uuidv4(),
    employee_id: employee.employee_id,
    work_order_id: workOrder.work_order_id,
    type: 'Work Order Overdue',
    title: `Overdue: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
    message: `Work order ${workOrder.work_order_id} assigned to you is now overdue. Scheduled date was ${new Date(workOrder.scheduled_date).toLocaleDateString()}`,
    status: 'Unread',
    priority: 'Critical',
    action_label: 'Update Status',
    created_at: new Date().toISOString(),
    read_at: null,
    responded_at: null
  }
}

export function generatePriorityEscalatedNotification(
  workOrder: WorkOrder,
  employee: Employee,
  oldPriority: string
): WorkOrderNotification {
  return {
    notification_id: uuidv4(),
    employee_id: employee.employee_id,
    work_order_id: workOrder.work_order_id,
    type: 'Priority Escalated',
    title: `Priority Escalated: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
    message: `Work order ${workOrder.work_order_id} priority has been escalated from ${oldPriority} to ${workOrder.priority_level}`,
    status: 'Unread',
    priority: mapPriorityToNotificationPriority(workOrder.priority_level),
    action_label: 'View',
    created_at: new Date().toISOString(),
    read_at: null,
    responded_at: null
  }
}

export function generateSkillMatchNotifications(
  workOrder: WorkOrder,
  employees: Employee[],
  skillMatrix: SkillMatrixEntry[],
  allWorkOrders: WorkOrder[]
): WorkOrderNotification[] {
  const recommendations = generateRecommendations(workOrder, employees, skillMatrix, allWorkOrders, [])
  
  return recommendations
    .filter(rec => rec.recommended && rec.score >= 70)
    .slice(0, 3)
    .map(rec => {
      return generateAssignmentSuggestionNotification(
        workOrder,
        rec.employee,
        Math.round(rec.score),
        rec.strengths,
        rec.skill_matches.map(sm => sm.skill_name)
      )
    })
}

export function generateAutoSchedulerNotifications(
  scheduledWorkOrders: WorkOrder[],
  employees: Employee[]
): WorkOrderNotification[] {
  const notifications: WorkOrderNotification[] = []
  
  for (const workOrder of scheduledWorkOrders) {
    if (!workOrder.assigned_technician) continue
    
    const employee = employees.find(
      e => `${e.first_name} ${e.last_name}` === workOrder.assigned_technician
    )
    
    if (employee) {
      notifications.push({
        notification_id: uuidv4(),
        employee_id: employee.employee_id,
        work_order_id: workOrder.work_order_id,
        type: 'Assignment Suggestion',
        title: `Auto-Scheduled: ${workOrder.task.substring(0, 50)}${workOrder.task.length > 50 ? '...' : ''}`,
        message: `You have been automatically assigned to work order ${workOrder.work_order_id} on ${new Date(workOrder.scheduled_date).toLocaleDateString()}`,
        status: 'Unread',
        priority: mapPriorityToNotificationPriority(workOrder.priority_level),
        action_label: 'Accept Assignment',
        created_at: new Date().toISOString(),
        read_at: null,
        responded_at: null,
        metadata: {
          suggested_by: 'auto-scheduler'
        }
      })
    }
  }
  
  return notifications
}

export function markNotificationAsRead(
  notification: WorkOrderNotification
): WorkOrderNotification {
  return {
    ...notification,
    status: 'Read',
    read_at: new Date().toISOString()
  }
}

export function markNotificationAsAccepted(
  notification: WorkOrderNotification
): WorkOrderNotification {
  return {
    ...notification,
    status: 'Accepted',
    responded_at: new Date().toISOString()
  }
}

export function markNotificationAsRejected(
  notification: WorkOrderNotification
): WorkOrderNotification {
  return {
    ...notification,
    status: 'Rejected',
    responded_at: new Date().toISOString()
  }
}

export function markNotificationAsDismissed(
  notification: WorkOrderNotification
): WorkOrderNotification {
  return {
    ...notification,
    status: 'Dismissed',
    responded_at: new Date().toISOString()
  }
}

export function getNotificationsByEmployee(
  notifications: WorkOrderNotification[],
  employeeId: string
): WorkOrderNotification[] {
  return notifications
    .filter(n => n.employee_id === employeeId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function getUnreadNotificationCount(
  notifications: WorkOrderNotification[],
  employeeId: string
): number {
  return notifications.filter(
    n => n.employee_id === employeeId && n.status === 'Unread'
  ).length
}

export function getCriticalNotifications(
  notifications: WorkOrderNotification[]
): WorkOrderNotification[] {
  return notifications.filter(n => n.priority === 'Critical' && n.status === 'Unread')
}

export function groupNotificationsByType(
  notifications: WorkOrderNotification[]
): Record<WorkOrderNotificationType, WorkOrderNotification[]> {
  const grouped: Record<string, WorkOrderNotification[]> = {}
  
  for (const notification of notifications) {
    if (!grouped[notification.type]) {
      grouped[notification.type] = []
    }
    grouped[notification.type].push(notification)
  }
  
  return grouped as Record<WorkOrderNotificationType, WorkOrderNotification[]>
}

function mapPriorityToNotificationPriority(
  priority: string
): NotificationPriority {
  switch (priority) {
    case 'Critical':
      return 'Critical'
    case 'High':
      return 'High'
    case 'Medium':
      return 'Medium'
    case 'Low':
    default:
      return 'Low'
  }
}

export function getNotificationIcon(type: WorkOrderNotificationType): string {
  switch (type) {
    case 'Assignment Suggestion':
      return '💡'
    case 'Assignment Changed':
      return '🔄'
    case 'Work Order Created':
      return '✨'
    case 'Work Order Updated':
      return '📝'
    case 'Work Order Overdue':
      return '⚠️'
    case 'Work Order Completed':
      return '✅'
    case 'Priority Escalated':
      return '🔴'
    case 'Skill Match':
      return '🎯'
    default:
      return '📋'
  }
}

export function getNotificationColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'Critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'High':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'Medium':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'Low':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
