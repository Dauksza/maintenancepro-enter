import { useState, useMemo, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, differenceInDays, addDays, parseISO, isSameDay } from 'date-fns'
import type { WorkOrder } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CaretLeft, CaretRight, Wrench } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TimelineViewProps {
  workOrders: WorkOrder[]
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  onSelectWorkOrder: (wo: WorkOrder) => void
}

type ViewMode = 'month' | 'quarter' | 'year'

interface TimelineBar {
  workOrder: WorkOrder
  startDate: Date
  endDate: Date
  left: number
  width: number
}

export function TimelineView({ workOrders, onUpdateWorkOrder, onSelectWorkOrder }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const { dateRange, days, equipmentGroups, timelineWidth } = useMemo(() => {
    let start: Date
    let end: Date

    switch (viewMode) {
      case 'month':
        start = startOfWeek(startOfMonth(currentDate))
        end = endOfWeek(endOfMonth(currentDate))
        break
      case 'quarter':
        start = startOfMonth(subMonths(currentDate, 1))
        end = endOfMonth(addMonths(currentDate, 2))
        break
      case 'year':
        start = startOfMonth(subMonths(currentDate, 5))
        end = endOfMonth(addMonths(currentDate, 6))
        break
    }

    const days = eachDayOfInterval({ start, end })
    
    const groups = workOrders.reduce((acc, wo) => {
      if (!acc[wo.equipment_area]) {
        acc[wo.equipment_area] = []
      }
      acc[wo.equipment_area].push(wo)
      return acc
    }, {} as Record<string, WorkOrder[]>)

    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

    const dayWidth = viewMode === 'month' ? 60 : viewMode === 'quarter' ? 30 : 15
    const timelineWidth = days.length * dayWidth

    return { dateRange: { start, end }, days, equipmentGroups: sortedGroups, timelineWidth }
  }, [currentDate, viewMode, workOrders])

  const getBarPosition = (scheduledDate: string, downtimeHours: number): { left: number; width: number } => {
    const startDate = parseISO(scheduledDate)
    const daysDiff = differenceInDays(startDate, dateRange.start)
    const dayWidth = viewMode === 'month' ? 60 : viewMode === 'quarter' ? 30 : 15
    
    const left = daysDiff * dayWidth
    const durationDays = Math.max(downtimeHours / 24, 0.25)
    const width = Math.max(durationDays * dayWidth, dayWidth * 0.5)

    return { left, width }
  }

  const calculateTimelineBars = (orders: WorkOrder[]): TimelineBar[] => {
    return orders.map(wo => {
      const startDate = parseISO(wo.scheduled_date)
      const durationDays = Math.max(wo.estimated_downtime_hours / 24, 0.25)
      const endDate = addDays(startDate, durationDays)
      const { left, width } = getBarPosition(wo.scheduled_date, wo.estimated_downtime_hours)

      return {
        workOrder: wo,
        startDate,
        endDate,
        left,
        width
      }
    }).filter(bar => bar.left + bar.width >= 0 && bar.left <= timelineWidth)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'month':
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
        case 'quarter':
          return direction === 'prev' ? subMonths(prev, 3) : addMonths(prev, 3)
        case 'year':
          return direction === 'prev' ? subMonths(prev, 12) : addMonths(prev, 12)
      }
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (e: React.DragEvent, workOrderId: string, barLeft: number) => {
    setDraggedWorkOrder(workOrderId)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset(e.clientX - rect.left)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedWorkOrder || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset
    const dayWidth = viewMode === 'month' ? 60 : viewMode === 'quarter' ? 30 : 15
    const dayIndex = Math.round(x / dayWidth)
    const newDate = addDays(dateRange.start, dayIndex)

    const workOrder = workOrders.find(wo => wo.work_order_id === draggedWorkOrder)
    if (workOrder) {
      onUpdateWorkOrder(draggedWorkOrder, {
        scheduled_date: newDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      toast.success(`Rescheduled to ${format(newDate, 'MMM d, yyyy')}`)
    }

    setDraggedWorkOrder(null)
    setDragOffset(0)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-600 border-red-700'
      case 'High':
        return 'bg-orange-500 border-orange-600'
      case 'Medium':
        return 'bg-blue-500 border-blue-600'
      case 'Low':
        return 'bg-gray-400 border-gray-500'
      default:
        return 'bg-gray-400 border-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-600 border-green-700'
      case 'In Progress':
        return 'bg-yellow-500 border-yellow-600'
      case 'Overdue':
        return 'bg-red-600 border-red-700'
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  const todayPosition = useMemo(() => {
    const today = new Date()
    const daysDiff = differenceInDays(today, dateRange.start)
    const dayWidth = viewMode === 'month' ? 60 : viewMode === 'quarter' ? 30 : 15
    return daysDiff * dayWidth
  }, [dateRange.start, viewMode])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => handleNavigate('prev')}>
              <CaretLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigate('next')}>
              <CaretRight size={16} />
            </Button>
            <div className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex border-b bg-muted/30">
                <div className="w-48 flex-shrink-0 border-r p-3 font-semibold">
                  Equipment / Area
                </div>
                <div 
                  className="flex-1 relative overflow-x-auto"
                  style={{ minWidth: `${timelineWidth}px` }}
                >
                  <div className="flex">
                    {days.map((day, idx) => {
                      const isToday = isSameDay(day, new Date())
                      const dayWidth = viewMode === 'month' ? 60 : viewMode === 'quarter' ? 30 : 15
                      
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border-r text-center p-2 flex-shrink-0",
                            isToday && "bg-accent/20"
                          )}
                          style={{ width: `${dayWidth}px` }}
                        >
                          {viewMode === 'month' ? (
                            <>
                              <div className="text-xs text-muted-foreground">
                                {format(day, 'EEE')}
                              </div>
                              <div className={cn("text-sm font-medium", isToday && "text-accent font-bold")}>
                                {format(day, 'd')}
                              </div>
                            </>
                          ) : viewMode === 'quarter' ? (
                            <div className={cn("text-xs", isToday && "text-accent font-bold")}>
                              {format(day, 'M/d')}
                            </div>
                          ) : (
                            <div className={cn("text-xs", isToday && "text-accent font-bold")}>
                              {format(day, 'd')}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {equipmentGroups.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <div className="text-center">
                      <Wrench size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No work orders to display</p>
                    </div>
                  </div>
                ) : (
                  equipmentGroups.map(([equipment, orders]) => {
                    const bars = calculateTimelineBars(orders)
                    
                    return (
                      <div key={equipment} className="flex hover:bg-muted/20 transition-colors">
                        <div className="w-48 flex-shrink-0 border-r p-3">
                          <div className="font-medium text-sm">{equipment}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {orders.length} {orders.length === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                        <div 
                          ref={timelineRef}
                          className="flex-1 relative p-3"
                          style={{ minWidth: `${timelineWidth}px`, minHeight: '80px' }}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {todayPosition >= 0 && todayPosition <= timelineWidth && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-accent z-10 pointer-events-none"
                              style={{ left: `${todayPosition}px` }}
                            />
                          )}
                          
                          {bars.map((bar, idx) => (
                            <div
                              key={bar.workOrder.work_order_id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, bar.workOrder.work_order_id, bar.left)}
                              onClick={() => onSelectWorkOrder(bar.workOrder)}
                              className={cn(
                                "absolute h-8 rounded border-2 cursor-move hover:shadow-lg transition-all group",
                                "flex items-center px-2 text-white text-xs font-medium overflow-hidden",
                                draggedWorkOrder === bar.workOrder.work_order_id && "opacity-50",
                                getStatusColor(bar.workOrder.status)
                              )}
                              style={{
                                left: `${bar.left}px`,
                                width: `${bar.width}px`,
                                top: `${(idx % 2) * 40}px`
                              }}
                              title={`${bar.workOrder.task} - ${bar.workOrder.status}`}
                            >
                              <div className="truncate flex items-center gap-1">
                                {bar.workOrder.is_overdue && (
                                  <span className="text-xs">⚠️</span>
                                )}
                                <span className="truncate">{bar.workOrder.task}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status:</span>
            <Badge variant="outline" className="bg-blue-500 text-white border-blue-600">
              Scheduled
            </Badge>
            <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
              In Progress
            </Badge>
            <Badge variant="outline" className="bg-green-600 text-white border-green-700">
              Completed
            </Badge>
            <Badge variant="outline" className="bg-red-600 text-white border-red-700">
              Overdue
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
