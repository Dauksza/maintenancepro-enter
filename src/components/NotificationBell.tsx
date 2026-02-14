import { useMemo } from 'react'
import type { WorkOrderNotification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, X, Eye } from '@phosphor-icons/react'
import { getNotificationIcon, getNotificationColor } from '@/lib/notification-utils'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  notifications: WorkOrderNotification[]
  onAcceptAssignment: (notificationId: string, workOrderId: string) => void
  onViewWorkOrder: (workOrderId: string) => void
  onMarkAsRead: (notificationId: string) => void
  currentEmployeeId?: string
}

export function NotificationBell({
  notifications,
  onAcceptAssignment,
  onViewWorkOrder,
  onMarkAsRead,
  currentEmployeeId
}: NotificationBellProps) {
  const filteredNotifications = useMemo(() => {
    const filtered = currentEmployeeId
      ? notifications.filter(n => n.employee_id === currentEmployeeId)
      : notifications

    return filtered
      .filter(n => n.status === 'Unread')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [notifications, currentEmployeeId])

  const unreadCount = useMemo(() => {
    const filtered = currentEmployeeId
      ? notifications.filter(n => n.employee_id === currentEmployeeId)
      : notifications
    return filtered.filter(n => n.status === 'Unread').length
  }, [notifications, currentEmployeeId])

  const hasCritical = useMemo(() => {
    return filteredNotifications.some(n => n.priority === 'Critical')
  }, [filteredNotifications])

  if (unreadCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell size={20} />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative ${hasCritical ? 'animate-pulse' : ''}`}
        >
          <Bell size={20} weight="fill" className={hasCritical ? 'text-destructive' : ''} />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell size={20} weight="fill" />
            <h3 className="font-semibold">Notifications</h3>
            <Badge variant="destructive">{unreadCount}</Badge>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell size={48} className="text-muted-foreground opacity-20 mb-2" />
              <p className="text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onAccept={() => onAcceptAssignment(notification.notification_id, notification.work_order_id)}
                  onView={() => {
                    onMarkAsRead(notification.notification_id)
                    onViewWorkOrder(notification.work_order_id)
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {unreadCount > 5 && (
          <div className="p-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              +{unreadCount - 5} more notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: WorkOrderNotification
  onAccept: () => void
  onView: () => void
}

function NotificationItem({
  notification,
  onAccept,
  onView
}: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type)
  const priorityColor = getNotificationColor(notification.priority)
  const isAssignment = notification.type === 'Assignment Suggestion' || 
                       notification.type === 'Assignment Changed'

  return (
    <div className={`p-3 hover:bg-accent cursor-pointer border-l-4 ${priorityColor}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight mb-1">
            {notification.title}
          </h4>
          
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>

          {notification.match_score !== undefined && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      notification.match_score >= 80 
                        ? 'bg-green-500' 
                        : notification.match_score >= 60 
                        ? 'bg-blue-500' 
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${notification.match_score}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{notification.match_score}%</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>

            <div className="flex items-center gap-1">
              {isAssignment && notification.status === 'Unread' ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAccept()
                  }}
                  className="h-6 text-xs gap-1 px-2"
                >
                  <Check size={12} weight="bold" />
                  Accept
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView()
                  }}
                  className="h-6 text-xs gap-1 px-2"
                >
                  <Eye size={12} />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
