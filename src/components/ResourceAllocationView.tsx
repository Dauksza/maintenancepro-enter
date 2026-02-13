import { useState, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, differenceInDays, addDays, parseISO, isSameDay, differenceInMinutes } from 'date-fns'
import type { WorkOrder } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CaretLeft, CaretRight, User, Clock, Wrench } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ResourceAllocationViewProps {
  workOrders: WorkOrder[]
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  onSelectWorkOrder: (wo: WorkOrder) => void
}

type ViewMode = 'week' | 'month' | 'quarter'

interface TechnicianWorkload {
  technician: string
  workOrders: WorkOrder[]
  totalHours: number
  dailyLoad: Map<string, { hours: number; workOrders: WorkOrder[] }>
}

interface TimelineBar {
  workOrder: WorkOrder
  startDate: Date
  left: number
  width: number
}

const getStatusColor = (status: WorkOrder['status']) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-500'
    case 'In Progress': return 'bg-blue-500'
    case 'Scheduled (Not Started)': return 'bg-indigo-500'
    case 'Overdue': return 'bg-red-500'
    case 'Cancelled': return 'bg-gray-400'
    default: return 'bg-gray-500'
  }
}

const getPriorityColor = (priority: WorkOrder['priority_level']) => {
  switch (priority) {
    case 'Critical': return 'border-red-600'
    case 'High': return 'border-orange-500'
    case 'Medium': return 'border-yellow-500'
    case 'Low': return 'border-gray-400'
    default: return 'border-gray-400'
  }
}

export function ResourceAllocationView({ workOrders, onUpdateWorkOrder, onSelectWorkOrder }: ResourceAllocationViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<string | null>(null)
  const [draggedTechnician, setDraggedTechnician] = useState<string | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragCurrentX, setDragCurrentX] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const { dateRange, days, technicianWorkloads, timelineWidth } = useMemo(() => {
    let start: Date
    let end: Date

    switch (viewMode) {
      case 'week':
        start = startOfWeek(currentDate)
        end = endOfWeek(currentDate)
        break
      case 'month':
        start = startOfWeek(startOfMonth(currentDate))
        end = endOfWeek(endOfMonth(currentDate))
        break
      case 'quarter':
        start = startOfMonth(subMonths(currentDate, 1))
        end = endOfMonth(addMonths(currentDate, 2))
        break
    }

    const daysArray = eachDayOfInterval({ start, end })
    const totalDays = daysArray.length
    const width = Math.max(totalDays * 80, 1200)

    const technicianMap = new Map<string, TechnicianWorkload>()
    
    workOrders.forEach(wo => {
      const tech = wo.assigned_technician || 'Unassigned'
      
      if (!technicianMap.has(tech)) {
        technicianMap.set(tech, {
          technician: tech,
          workOrders: [],
          totalHours: 0,
          dailyLoad: new Map()
        })
      }
      
      const techData = technicianMap.get(tech)!
      techData.workOrders.push(wo)
      techData.totalHours += wo.estimated_downtime_hours
      
      const woDate = format(parseISO(wo.scheduled_date), 'yyyy-MM-dd')
      const existingDayLoad = techData.dailyLoad.get(woDate) || { hours: 0, workOrders: [] }
      existingDayLoad.hours += wo.estimated_downtime_hours
      existingDayLoad.workOrders.push(wo)
      techData.dailyLoad.set(woDate, existingDayLoad)
    })

    const sortedTechnicians = Array.from(technicianMap.values()).sort((a, b) => {
      if (a.technician === 'Unassigned') return 1
      if (b.technician === 'Unassigned') return -1
      return a.technician.localeCompare(b.technician)
    })

    return {
      dateRange: { start, end },
      days: daysArray,
      technicianWorkloads: sortedTechnicians,
      timelineWidth: width
    }
  }, [workOrders, currentDate, viewMode])

  const calculateBarPosition = (workOrder: WorkOrder): TimelineBar | null => {
    const startDate = parseISO(workOrder.scheduled_date)
    
    if (startDate < dateRange.start || startDate > dateRange.end) {
      return null
    }

    const daysSinceStart = differenceInDays(startDate, dateRange.start)
    const left = (daysSinceStart / days.length) * 100
    const width = Math.max((1 / days.length) * 100, 1.2)

    return {
      workOrder,
      startDate,
      left,
      width
    }
  }

  const handlePrevious = () => {
    switch (viewMode) {
      case 'week':
        setCurrentDate(subMonths(currentDate, 0.25))
        break
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
      case 'quarter':
        setCurrentDate(subMonths(currentDate, 3))
        break
    }
  }

  const handleNext = () => {
    switch (viewMode) {
      case 'week':
        setCurrentDate(addMonths(currentDate, 0.25))
        break
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
      case 'quarter':
        setCurrentDate(addMonths(currentDate, 3))
        break
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (e: React.MouseEvent, workOrderId: string, technician: string) => {
    setDraggedWorkOrder(workOrderId)
    setDraggedTechnician(technician)
    setDragStartX(e.clientX)
    setDragCurrentX(e.clientX)
    e.preventDefault()
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (draggedWorkOrder && timelineRef.current) {
      setDragCurrentX(e.clientX)
    }
  }

  const handleDragEnd = (e: React.MouseEvent) => {
    if (draggedWorkOrder && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const dayIndex = Math.floor((offsetX / rect.width) * days.length)
      
      if (dayIndex >= 0 && dayIndex < days.length) {
        const newDate = days[dayIndex]
        const workOrder = workOrders.find(wo => wo.work_order_id === draggedWorkOrder)
        
        if (workOrder) {
          onUpdateWorkOrder(draggedWorkOrder, {
            scheduled_date: newDate.toISOString()
          })
          toast.success(`Work order rescheduled to ${format(newDate, 'MMM dd, yyyy')}`)
        }
      }
    }
    
    setDraggedWorkOrder(null)
    setDraggedTechnician(null)
    setDragStartX(0)
    setDragCurrentX(0)
  }

  const handleTechnicianReassign = (e: React.MouseEvent, targetTechnician: string) => {
    if (draggedWorkOrder && draggedTechnician !== targetTechnician) {
      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const offsetX = e.clientX - rect.left
      const dayIndex = Math.floor((offsetX / rect.width) * days.length)
      
      if (dayIndex >= 0 && dayIndex < days.length) {
        const newDate = days[dayIndex]
        onUpdateWorkOrder(draggedWorkOrder, {
          assigned_technician: targetTechnician === 'Unassigned' ? null : targetTechnician,
          scheduled_date: newDate.toISOString()
        })
        toast.success(`Work order reassigned to ${targetTechnician}`)
      }
    }
  }

  const getDailyWorkloadColor = (hours: number): string => {
    if (hours === 0) return 'bg-transparent'
    if (hours <= 2) return 'bg-green-100'
    if (hours <= 4) return 'bg-yellow-100'
    if (hours <= 6) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getDailyWorkloadIntensity = (hours: number): string => {
    if (hours === 0) return 'opacity-0'
    if (hours <= 2) return 'opacity-30'
    if (hours <= 4) return 'opacity-50'
    if (hours <= 6) return 'opacity-70'
    return 'opacity-90'
  }

  const viewModeLabel = useMemo(() => {
    switch (viewMode) {
      case 'week':
        return format(currentDate, 'MMM dd, yyyy')
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'quarter':
        return `${format(subMonths(currentDate, 1), 'MMM')} - ${format(addMonths(currentDate, 2), 'MMM yyyy')}`
    }
  }, [currentDate, viewMode])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <CaretLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <CaretRight size={16} />
            </Button>
            <div className="text-lg font-semibold ml-2">{viewModeLabel}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
                <span>Light (&le;2h)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded" />
                <span>Moderate (2-4h)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded" />
                <span>Heavy (4-6h)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
                <span>Critical (&gt;6h)</span>
              </div>
            </div>
            
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[200px_1fr] gap-0 border rounded-lg overflow-hidden">
              <div className="bg-muted/30">
                <div className="h-12 border-b flex items-center px-4 font-semibold bg-muted/50">
                  Technician
                </div>
                <div>
                  {technicianWorkloads.map((tech) => (
                    <div
                      key={tech.technician}
                      className="h-24 border-b flex flex-col justify-center px-4 gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        <span className="font-medium text-sm">{tech.technician}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={14} />
                        <span>{tech.totalHours.toFixed(1)}h total</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{tech.workOrders.length} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden">
                <div className="h-12 border-b flex bg-muted/50">
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 flex flex-col items-center justify-center text-xs border-l first:border-l-0',
                        isSameDay(day, new Date()) && 'bg-primary/5'
                      )}
                    >
                      <div className="font-medium">{format(day, 'EEE')}</div>
                      <div className={cn(
                        'text-muted-foreground',
                        isSameDay(day, new Date()) && 'text-primary font-semibold'
                      )}>
                        {format(day, 'dd')}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  ref={timelineRef}
                  className="relative"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {technicianWorkloads.map((tech, techIndex) => {
                    const bars = tech.workOrders
                      .map(wo => calculateBarPosition(wo))
                      .filter((bar): bar is TimelineBar => bar !== null)

                    return (
                      <div
                        key={tech.technician}
                        className={cn(
                          'h-24 border-b relative',
                          draggedWorkOrder && 'cursor-grabbing'
                        )}
                        onMouseUp={(e) => handleTechnicianReassign(e, tech.technician)}
                      >
                        <div className="absolute inset-0 flex">
                          {days.map((day, dayIndex) => {
                            const dateKey = format(day, 'yyyy-MM-dd')
                            const dayLoad = tech.dailyLoad.get(dateKey)
                            const hours = dayLoad?.hours || 0

                            return (
                              <TooltipProvider key={dayIndex} delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'flex-1 border-l first:border-l-0 transition-colors',
                                        getDailyWorkloadColor(hours),
                                        getDailyWorkloadIntensity(hours),
                                        isSameDay(day, new Date()) && 'bg-primary/5'
                                      )}
                                    />
                                  </TooltipTrigger>
                                  {hours > 0 && (
                                    <TooltipContent>
                                      <div className="text-xs space-y-1">
                                        <div className="font-semibold">
                                          {format(day, 'MMM dd, yyyy')}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {hours.toFixed(1)}h workload
                                        </div>
                                        <div className="text-muted-foreground">
                                          {dayLoad?.workOrders.length} work orders
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )
                          })}
                        </div>

                        <div className="absolute inset-0 pointer-events-none">
                          {bars.map((bar) => (
                            <TooltipProvider key={bar.workOrder.work_order_id} delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      'absolute top-1/2 -translate-y-1/2 h-16 rounded border-2 cursor-grab pointer-events-auto transition-all',
                                      getStatusColor(bar.workOrder.status),
                                      getPriorityColor(bar.workOrder.priority_level),
                                      'hover:scale-105 hover:shadow-lg hover:z-10',
                                      draggedWorkOrder === bar.workOrder.work_order_id && 'opacity-50 cursor-grabbing'
                                    )}
                                    style={{
                                      left: `${bar.left}%`,
                                      width: `${bar.width}%`,
                                    }}
                                    onMouseDown={(e) => handleDragStart(e, bar.workOrder.work_order_id, tech.technician)}
                                    onClick={() => onSelectWorkOrder(bar.workOrder)}
                                  >
                                    <div className="h-full flex items-center justify-center px-2">
                                      <div className="text-white text-xs font-medium truncate">
                                        {bar.workOrder.equipment_area}
                                      </div>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <div className="space-y-1 text-xs max-w-xs">
                                    <div className="font-semibold">{bar.workOrder.work_order_id}</div>
                                    <div className="text-muted-foreground">{bar.workOrder.equipment_area}</div>
                                    <div className="text-muted-foreground">{bar.workOrder.task}</div>
                                    <div className="flex items-center gap-2 pt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {bar.workOrder.status}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {bar.workOrder.priority_level}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground pt-1">
                                      <Clock size={12} />
                                      <span>{bar.workOrder.estimated_downtime_hours}h</span>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>

                        {isSameDay(new Date(), new Date()) && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                            style={{
                              left: `${(differenceInDays(new Date(), dateRange.start) / days.length) * 100}%`
                            }}
                          >
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Technicians</div>
              <div className="text-2xl font-bold">{technicianWorkloads.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Clock size={20} className="text-accent-foreground" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Workload</div>
              <div className="text-2xl font-bold">
                {technicianWorkloads.reduce((sum, t) => sum + t.totalHours, 0).toFixed(1)}h
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Wrench size={20} className="text-secondary-foreground" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg per Technician</div>
              <div className="text-2xl font-bold">
                {technicianWorkloads.length > 0
                  ? (technicianWorkloads.reduce((sum, t) => sum + t.totalHours, 0) / technicianWorkloads.length).toFixed(1)
                  : '0.0'}h
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
