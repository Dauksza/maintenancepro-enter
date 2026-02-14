import { useEffect, useRef } from 'react'
import type { WorkOrderNotification } from '@/lib/types'
import { toast } from 'sonner'
import { getNotificationIcon } from '@/lib/notification-utils'

interface NotificationToastManagerProps {
  notifications: WorkOrderNotification[]
  onAcceptAssignment: (notificationId: string, workOrderId: string) => void
  onViewWorkOrder: (workOrderId: string) => void
}

export function NotificationToastManager({
  notifications,
  onAcceptAssignment,
  onViewWorkOrder
}: NotificationToastManagerProps) {
  const previousNotificationsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const previousIds = previousNotificationsRef.current
    const currentIds = new Set(notifications.map(n => n.notification_id))

    notifications.forEach(notification => {
      if (!previousIds.has(notification.notification_id) && notification.status === 'Unread') {
        showNotificationToast(notification, onAcceptAssignment, onViewWorkOrder)
      }
    })

    previousNotificationsRef.current = currentIds
  }, [notifications, onAcceptAssignment, onViewWorkOrder])

  return null
}

function showNotificationToast(
  notification: WorkOrderNotification,
  onAcceptAssignment: (notificationId: string, workOrderId: string) => void,
  onViewWorkOrder: (workOrderId: string) => void
) {
  const icon = getNotificationIcon(notification.type)
  const isAssignment = notification.type === 'Assignment Suggestion' || 
                       notification.type === 'Assignment Changed'

  const toastOptions: any = {
    duration: notification.priority === 'Critical' ? 10000 : 5000,
    description: notification.message,
  }

  if (notification.match_score !== undefined) {
    toastOptions.description += ` (Match: ${notification.match_score}%)`
  }

  if (isAssignment && notification.status === 'Unread') {
    toastOptions.action = {
      label: 'Accept',
      onClick: () => onAcceptAssignment(notification.notification_id, notification.work_order_id)
    }
    toastOptions.cancel = {
      label: 'View',
      onClick: () => onViewWorkOrder(notification.work_order_id)
    }
  } else {
    toastOptions.action = {
      label: 'View',
      onClick: () => onViewWorkOrder(notification.work_order_id)
    }
  }

  switch (notification.priority) {
    case 'Critical':
      toast.error(`${icon} ${notification.title}`, toastOptions)
      break
    case 'High':
      toast.warning(`${icon} ${notification.title}`, toastOptions)
      break
    case 'Medium':
      toast.info(`${icon} ${notification.title}`, toastOptions)
      break
    case 'Low':
    default:
      toast(`${icon} ${notification.title}`, toastOptions)
      break
  }
}
