import { useState, useMemo } from 'react'
import type { WorkOrder } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CaretLeft, 
  CaretRight, 
  CalendarBlank,
  Rows,
  Clock,
  Wrench
} from '@phosphor-icons/react'
import { getStatusColor, getPriorityColor } from '@/lib/maintenance-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CalendarViewProps {
  workOrders: WorkOrder[]
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  onSelectWorkOrder: (wo: WorkOrder) => void
}

type CalendarView = 'month' | 'week'

interface DayCell {
  date: Date
  isCurrentMonth: boolean
  workOrders: WorkOrder[]
}

export function CalendarView({
  workOrders,
  onUpdateWorkOrder,
  onSelectWorkOrder
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<WorkOrder | null>(null)

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const weekStart = useMemo(() => {
    const date = new Date(currentDate)
    const day = date.getDay()
    const diff = date.getDate() - day
    return new Date(date.setDate(diff))
  }, [currentDate])

  const weekEnd = useMemo(() => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + 6)
    return date
  }, [weekStart])

  const calendarDays = useMemo(() => {
    const days: DayCell[] = []
    const start = new Date(monthStart)
    start.setDate(start.getDate() - start.getDay())

    for (let i = 0; i < 42; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      
      const dayWorkOrders = workOrders.filter(wo => {
        const woDate = new Date(wo.scheduled_date)
        return (
          woDate.getFullYear() === date.getFullYear() &&
          woDate.getMonth() === date.getMonth() &&
          woDate.getDate() === date.getDate()
        )
      })

      days.push({
        date,
        isCurrentMonth: date.getMonth() === monthStart.getMonth(),
        workOrders: dayWorkOrders
      })
    }

    return days
  }, [monthStart, workOrders])

  const weekDays = useMemo(() => {
    const days: DayCell[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      
      const dayWorkOrders = workOrders.filter(wo => {
        const woDate = new Date(wo.scheduled_date)
        return (
          woDate.getFullYear() === date.getFullYear() &&
          woDate.getMonth() === date.getMonth() &&
          woDate.getDate() === date.getDate()
        )
      })

      days.push({
        date,
        isCurrentMonth: true,
        workOrders: dayWorkOrders
      })
    }

    return days
  }, [weekStart, workOrders])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (e: React.DragEvent, workOrder: WorkOrder) => {
    setDraggedWorkOrder(workOrder)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedWorkOrder(null)
    e.currentTarget.classList.remove('opacity-50')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    
    if (!draggedWorkOrder) return

    const newScheduledDate = new Date(targetDate)
    const oldDate = new Date(draggedWorkOrder.scheduled_date)
    
    newScheduledDate.setHours(oldDate.getHours())
    newScheduledDate.setMinutes(oldDate.getMinutes())
    
    const newDateString = newScheduledDate.toISOString()
    
    onUpdateWorkOrder(draggedWorkOrder.work_order_id, {
      scheduled_date: newDateString
    })

    toast.success(`Work order rescheduled to ${formatDate(targetDate)}`)
    setDraggedWorkOrder(null)
  }

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatWeekRange = () => {
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const WorkOrderCard = ({ workOrder }: { workOrder: WorkOrder }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, workOrder)}
      onDragEnd={handleDragEnd}
      onClick={() => onSelectWorkOrder(workOrder)}
      className={cn(
        "p-2 rounded text-xs cursor-move hover:shadow-md transition-shadow mb-1",
        "border-l-4",
        workOrder.is_overdue 
          ? "bg-red-50 border-l-red-500" 
          : workOrder.status === 'Completed'
          ? "bg-green-50 border-l-green-500"
          : workOrder.status === 'In Progress'
          ? "bg-blue-50 border-l-blue-500"
          : "bg-card border-l-primary"
      )}
    >
      <div className="font-medium truncate">{workOrder.work_order_id}</div>
      <div className="text-muted-foreground truncate text-[10px]">
        {workOrder.equipment_area}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Badge 
          variant="secondary" 
          className={cn("text-[9px] h-4 px-1", getPriorityColor(workOrder.priority_level))}
        >
          {workOrder.priority_level}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Calendar View</h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarBlank size={16} />
                Month
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Rows size={16} />
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
            >
              <CaretLeft size={18} />
            </Button>
            <div className="min-w-[200px] text-center font-semibold">
              {view === 'month' ? formatMonthYear(currentDate) : formatWeekRange()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
            >
              <CaretRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4">
        {view === 'month' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.date)}
                  className={cn(
                    "min-h-[120px] p-2 rounded-lg border-2 border-dashed transition-colors",
                    day.isCurrentMonth ? "bg-card border-border" : "bg-muted/30 border-muted",
                    isToday(day.date) && "ring-2 ring-primary",
                    draggedWorkOrder && "hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    !day.isCurrentMonth && "text-muted-foreground",
                    isToday(day.date) && "text-primary font-bold"
                  )}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {day.workOrders.map((wo) => (
                      <WorkOrderCard key={wo.work_order_id} workOrder={wo} />
                    ))}
                  </div>

                  {day.workOrders.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center mt-1">
                      +{day.workOrders.length - 2} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day, idx) => (
                <div key={idx} className="text-center">
                  <div className="font-semibold text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}
                  </div>
                  <div className={cn(
                    "text-xs text-muted-foreground",
                    isToday(day.date) && "text-primary font-bold"
                  )}>
                    {day.date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.date)}
                  className={cn(
                    "min-h-[400px] p-3 rounded-lg border-2 border-dashed bg-card transition-colors",
                    isToday(day.date) && "ring-2 ring-primary",
                    draggedWorkOrder && "hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <div className="space-y-2">
                    {day.workOrders.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-8">
                        No scheduled work
                      </div>
                    ) : (
                      day.workOrders.map((wo) => (
                        <WorkOrderCard key={wo.work_order_id} workOrder={wo} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 mt-4 pt-4 border-t">
              {weekDays.map((day, idx) => {
                const totalHours = day.workOrders.reduce(
                  (sum, wo) => sum + (wo.estimated_downtime_hours || 0), 
                  0
                )
                return (
                  <div key={idx} className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {totalHours.toFixed(1)}h
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Wrench size={12} />
                      {day.workOrders.length} tasks
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border-l-4 border-l-red-500 rounded" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border-l-4 border-l-blue-500 rounded" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border-l-4 border-l-green-500 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-card border-l-4 border-l-primary rounded" />
          <span>Scheduled</span>
        </div>
        <div className="ml-auto text-xs">
          💡 Drag and drop work orders to reschedule
        </div>
      </div>
    </div>
  )
}
