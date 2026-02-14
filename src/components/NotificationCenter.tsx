import { useState, useMemo } from 'react'
import type { WorkOrderNotification, WorkOrder, Employee } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Bell,
  Check,
  X,
  Eye,
  Sparkle,
  User,
  Clock,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import {
  getNotificationIcon,
  getNotificationColor,
  markNotificationAsRead,
  markNotificationAsAccepted,
  markNotificationAsRejected,
  markNotificationAsDismissed,
  getCriticalNotifications
} from '@/lib/notification-utils'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  notifications: WorkOrderNotification[]
  onUpdateNotification: (notificationId: string, updates: Partial<WorkOrderNotification>) => void
  onAcceptAssignment: (notificationId: string, workOrderId: string) => void
  onRejectAssignment: (notificationId: string, workOrderId: string) => void
  onViewWorkOrder: (workOrderId: string) => void
  currentEmployeeId?: string
}

export function NotificationCenter({
  notifications,
  onUpdateNotification,
  onAcceptAssignment,
  onRejectAssignment,
  onViewWorkOrder,
  currentEmployeeId
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'assignments'>('all')

  const filteredNotifications = useMemo(() => {
    let filtered = currentEmployeeId
      ? notifications.filter(n => n.employee_id === currentEmployeeId)
      : notifications

    if (filter === 'unread') {
      filtered = filtered.filter(n => n.status === 'Unread')
    } else if (filter === 'assignments') {
      filtered = filtered.filter(n => 
        n.type === 'Assignment Suggestion' || 
        n.type === 'Assignment Changed'
      )
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [notifications, currentEmployeeId, filter])

  const unreadCount = useMemo(() => {
    const filtered = currentEmployeeId
      ? notifications.filter(n => n.employee_id === currentEmployeeId)
      : notifications
    return filtered.filter(n => n.status === 'Unread').length
  }, [notifications, currentEmployeeId])

  const criticalNotifications = useMemo(() => {
    return getCriticalNotifications(
      currentEmployeeId 
        ? notifications.filter(n => n.employee_id === currentEmployeeId)
        : notifications
    )
  }, [notifications, currentEmployeeId])

  const handleMarkAsRead = (notification: WorkOrderNotification) => {
    const updated = markNotificationAsRead(notification)
    onUpdateNotification(notification.notification_id, updated)
  }

  const handleAccept = (notification: WorkOrderNotification) => {
    const updated = markNotificationAsAccepted(notification)
    onUpdateNotification(notification.notification_id, updated)
    onAcceptAssignment(notification.notification_id, notification.work_order_id)
  }

  const handleReject = (notification: WorkOrderNotification) => {
    const updated = markNotificationAsRejected(notification)
    onUpdateNotification(notification.notification_id, updated)
    onRejectAssignment(notification.notification_id, notification.work_order_id)
  }

  const handleDismiss = (notification: WorkOrderNotification) => {
    const updated = markNotificationAsDismissed(notification)
    onUpdateNotification(notification.notification_id, updated)
  }

  const handleView = (notification: WorkOrderNotification) => {
    if (notification.status === 'Unread') {
      handleMarkAsRead(notification)
    }
    onViewWorkOrder(notification.work_order_id)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          Notifications
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell size={24} weight="fill" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount} new
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated on work order assignments and changes
          </SheetDescription>
        </SheetHeader>

        {criticalNotifications.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border-l-4 border-destructive rounded">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={18} weight="fill" className="text-destructive" />
              <span className="font-semibold text-sm text-destructive">
                {criticalNotifications.length} Critical Alert{criticalNotifications.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You have urgent notifications that require immediate attention
            </p>
          </div>
        )}

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={64} className="text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up!" 
                      : "You'll see notifications here when they arrive"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredNotifications.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onDismiss={handleDismiss}
                      onView={handleView}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

interface NotificationCardProps {
  notification: WorkOrderNotification
  onAccept: (notification: WorkOrderNotification) => void
  onReject: (notification: WorkOrderNotification) => void
  onDismiss: (notification: WorkOrderNotification) => void
  onView: (notification: WorkOrderNotification) => void
  onMarkAsRead: (notification: WorkOrderNotification) => void
}

function NotificationCard({
  notification,
  onAccept,
  onReject,
  onDismiss,
  onView,
  onMarkAsRead
}: NotificationCardProps) {
  const isUnread = notification.status === 'Unread'
  const isAssignment = notification.type === 'Assignment Suggestion' || 
                       notification.type === 'Assignment Changed'
  const canRespond = isAssignment && notification.status === 'Unread'

  const priorityColor = getNotificationColor(notification.priority)
  const icon = getNotificationIcon(notification.type)

  return (
    <Card 
      className={`p-4 border-l-4 ${priorityColor} ${isUnread ? 'bg-accent/20' : ''} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm leading-tight flex-1">
              {notification.title}
            </h4>
            {isUnread && (
              <Badge variant="default" className="flex-shrink-0 text-xs">
                New
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>

          {notification.match_score !== undefined && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Match Score</span>
                <span className="text-xs font-bold">{notification.match_score}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    notification.match_score >= 80 
                      ? 'bg-green-500' 
                      : notification.match_score >= 60 
                      ? 'bg-blue-500' 
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${notification.match_score}%` }}
                />
              </div>
            </div>
          )}

          {notification.reasons && notification.reasons.length > 0 && (
            <div className="mb-2 space-y-1">
              {notification.reasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={14} weight="fill" className="text-green-600" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </div>

            <div className="flex items-center gap-1">
              {canRespond ? (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAccept(notification)}
                    className="h-7 text-xs gap-1"
                  >
                    <Check size={14} weight="bold" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(notification)}
                    className="h-7 text-xs gap-1"
                  >
                    <X size={14} weight="bold" />
                    Decline
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView(notification)}
                    className="h-7 text-xs gap-1"
                  >
                    <Eye size={14} />
                    View
                  </Button>
                  {notification.status !== 'Dismissed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDismiss(notification)}
                      className="h-7 text-xs"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {notification.status === 'Accepted' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle size={14} weight="fill" />
              <span>Assignment accepted</span>
            </div>
          )}

          {notification.status === 'Rejected' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <XCircle size={14} weight="fill" />
              <span>Assignment declined</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
