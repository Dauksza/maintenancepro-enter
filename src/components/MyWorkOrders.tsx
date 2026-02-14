import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Wrench, 
  CalendarBlank, 
  Clock,
  CheckCircle,
  Warning,
  ArrowRight
} from '@phosphor-icons/react'
import type { WorkOrder } from '@/lib/types'

interface MyWorkOrdersProps {
  workOrders: WorkOrder[]
  assignedTechnicianName: string | null
  onSelectWorkOrder: (workOrder: WorkOrder) => void
}

export function MyWorkOrders({ 
  workOrders, 
  assignedTechnicianName,
  onSelectWorkOrder 
}: MyWorkOrdersProps) {
  const myWorkOrders = useMemo(() => {
    if (!assignedTechnicianName) return []
    return workOrders.filter(wo => 
      wo.assigned_technician === assignedTechnicianName
    )
  }, [workOrders, assignedTechnicianName])

  const stats = useMemo(() => {
    const total = myWorkOrders.length
    const overdue = myWorkOrders.filter(wo => wo.is_overdue).length
    const inProgress = myWorkOrders.filter(wo => wo.status === 'In Progress').length
    const scheduled = myWorkOrders.filter(wo => wo.status === 'Scheduled (Not Started)').length
    const completed = myWorkOrders.filter(wo => wo.status === 'Completed').length

    return { total, overdue, inProgress, scheduled, completed }
  }, [myWorkOrders])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-600'
      case 'High': return 'bg-orange-600'
      case 'Medium': return 'bg-blue-600'
      case 'Low': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600'
      case 'In Progress': return 'text-blue-600'
      case 'Overdue': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!assignedTechnicianName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench size={20} />
            My Work Orders
          </CardTitle>
          <CardDescription>
            Link your user profile to an employee to see your assigned work orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Warning size={48} className="mx-auto mb-4 opacity-50" />
            <p>No employee linked to your account</p>
            <p className="text-sm mt-2">Go to your profile to link an employee record</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench size={20} />
          My Work Orders
        </CardTitle>
        <CardDescription>
          Work orders assigned to {assignedTechnicianName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.scheduled}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        <Separator />

        {myWorkOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No work orders assigned</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {myWorkOrders
                .sort((a, b) => {
                  if (a.is_overdue && !b.is_overdue) return -1
                  if (!a.is_overdue && b.is_overdue) return 1
                  if (a.status === 'In Progress' && b.status !== 'In Progress') return -1
                  if (a.status !== 'In Progress' && b.status === 'In Progress') return 1
                  return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
                })
                .map((wo) => (
                  <div
                    key={wo.work_order_id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onSelectWorkOrder(wo)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(wo.priority_level)}>
                            {wo.priority_level}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {wo.work_order_id}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1 truncate">{wo.equipment_area}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {wo.task}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarBlank size={14} />
                            {new Date(wo.scheduled_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {wo.estimated_downtime_hours}h
                          </div>
                          <div className={`flex items-center gap-1 font-medium ${getStatusColor(wo.status)}`}>
                            {wo.status}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
