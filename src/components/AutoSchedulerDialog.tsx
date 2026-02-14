import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { WorkOrder, TechnicianCapacity } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkle, 
  CalendarBlank, 
  Users, 
  Clock, 
  Warning,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import { 
  autoScheduleOverdueTasks, 
  generateSchedulingPreview,
  type SchedulingResult 
} from '@/lib/auto-scheduler'
import { isOverdue } from '@/lib/maintenance-utils'
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'

interface AutoSchedulerDialogProps {
  open: boolean
  onClose: () => void
  workOrders: WorkOrder[]
  onScheduleComplete: (scheduledOrders: WorkOrder[]) => void
}

export function AutoSchedulerDialog({
  open,
  onClose,
  workOrders,
  onScheduleComplete
}: AutoSchedulerDialogProps) {
  const [capacities] = useKV<TechnicianCapacity[]>('technician-capacities', [])
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [prioritizeBy, setPrioritizeBy] = useState<'priority' | 'date' | 'duration'>('priority')
  const [allowWeekends, setAllowWeekends] = useState(false)
  const [maxDaysAhead, setMaxDaysAhead] = useState(30)
  const [isScheduling, setIsScheduling] = useState(false)
  const [result, setResult] = useState<SchedulingResult | null>(null)

  const safeCapacities = capacities || []

  const preview = useMemo(() => {
    return generateSchedulingPreview(workOrders, safeCapacities, {
      startDate: new Date(startDate),
      maxDaysAhead
    })
  }, [workOrders, safeCapacities, startDate, maxDaysAhead])

  const overdueCount = workOrders.filter(wo => 
    isOverdue(wo) && 
    wo.status !== 'Completed' && 
    wo.status !== 'Cancelled'
  ).length

  const handleSchedule = () => {
    setIsScheduling(true)
    
    try {
      const schedulingResult = autoScheduleOverdueTasks(
        workOrders,
        safeCapacities,
        {
          startDate: new Date(startDate),
          prioritizeBy,
          allowWeekends,
          maxDaysAhead
        }
      )

      setResult(schedulingResult)

      if (schedulingResult.scheduled.length > 0) {
        onScheduleComplete(schedulingResult.scheduled)
        
        if (schedulingResult.failed.length === 0) {
          toast.success(
            `Successfully scheduled ${schedulingResult.scheduled.length} work orders`,
            { duration: 4000 }
          )
        } else {
          toast.warning(
            `Scheduled ${schedulingResult.scheduled.length} work orders, ${schedulingResult.failed.length} could not be scheduled`,
            { duration: 5000 }
          )
        }
      } else {
        toast.error('Could not schedule any work orders', { duration: 4000 })
      }
    } catch (error) {
      console.error('Scheduling error:', error)
      toast.error('Failed to schedule work orders')
    } finally {
      setIsScheduling(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
    setPrioritizeBy('priority')
    setAllowWeekends(false)
    setMaxDaysAhead(30)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (overdueCount === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              No Overdue Tasks
            </DialogTitle>
            <DialogDescription>
              All work orders are up to date. There are no overdue tasks to reschedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkle className="text-accent" size={28} weight="fill" />
            Auto-Schedule Overdue Tasks
          </DialogTitle>
          <DialogDescription>
            Automatically reassign and reschedule overdue work orders based on technician availability and capacity
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            <Alert>
              <Warning className="h-4 w-4" />
              <AlertDescription>
                <strong>{overdueCount} overdue work orders</strong> will be rescheduled starting from the selected date.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <CalendarBlank size={18} />
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <p className="text-xs text-muted-foreground">
                  Work orders will be scheduled starting from this date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioritize-by">Priority Strategy</Label>
                <Select value={prioritizeBy} onValueChange={(v: any) => setPrioritizeBy(v)}>
                  <SelectTrigger id="prioritize-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">By Priority Level (Critical first)</SelectItem>
                    <SelectItem value="date">By Original Date (Oldest first)</SelectItem>
                    <SelectItem value="duration">By Duration (Longest first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-days">Scheduling Window (Days)</Label>
                  <Input
                    id="max-days"
                    type="number"
                    min="7"
                    max="90"
                    value={maxDaysAhead}
                    onChange={(e) => setMaxDaysAhead(parseInt(e.target.value) || 30)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 pt-8">
                  <Label htmlFor="allow-weekends" className="text-sm cursor-pointer">
                    Include Weekends
                  </Label>
                  <Switch
                    id="allow-weekends"
                    checked={allowWeekends}
                    onCheckedChange={setAllowWeekends}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Scheduling Preview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock size={16} />
                    Estimated Days Needed
                  </div>
                  <div className="text-2xl font-bold">
                    {preview.estimatedDaysNeeded} days
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users size={16} />
                    Technicians Involved
                  </div>
                  <div className="text-2xl font-bold">
                    {preview.technicianWorkload.length}
                  </div>
                </div>
              </div>

              {!preview.canScheduleAll && (
                <Alert variant="destructive">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    Not all work orders may fit within the {maxDaysAhead}-day window. 
                    Consider increasing the scheduling window or adjusting technician capacity.
                  </AlertDescription>
                </Alert>
              )}

              {preview.technicianWorkload.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Workload Distribution</Label>
                  {preview.technicianWorkload.map(({ technician, totalHours, daysNeeded }) => (
                    <div key={technician} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{technician}</span>
                        <span className="text-muted-foreground">
                          {totalHours.toFixed(1)}h / {daysNeeded} days
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((daysNeeded / maxDaysAhead) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-3">
              {result.scheduled.length > 0 ? (
                <CheckCircle className="mx-auto text-green-600" size={64} weight="fill" />
              ) : (
                <XCircle className="mx-auto text-red-600" size={64} weight="fill" />
              )}
              
              <div>
                <h3 className="text-2xl font-bold">
                  {result.scheduled.length > 0 
                    ? 'Scheduling Complete!' 
                    : 'Scheduling Failed'}
                </h3>
                <p className="text-muted-foreground">
                  {result.scheduled.length > 0
                    ? `Successfully scheduled ${result.stats.successfullyScheduled} work orders`
                    : 'Unable to schedule work orders with current constraints'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">
                  {result.stats.successfullyScheduled}
                </div>
                <div className="text-sm text-green-600">Scheduled</div>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700">
                  {result.stats.failed}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {result.stats.techniciansUsed}
                </div>
                <div className="text-sm text-blue-600">Technicians</div>
              </div>
            </div>

            {result.stats.successfullyScheduled > 0 && (
              <div className="space-y-2 bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date Range:</span>
                  <span className="font-medium">
                    {format(new Date(result.stats.dateRange.start), 'MMM d, yyyy')} - {format(new Date(result.stats.dateRange.end), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">
                  Failed to Schedule ({result.failed.length})
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.failed.map(({ workOrder, reason }) => (
                    <div 
                      key={workOrder.work_order_id}
                      className="text-xs bg-red-500/5 border border-red-500/20 rounded p-2"
                    >
                      <div className="font-medium">{workOrder.work_order_id}</div>
                      <div className="text-muted-foreground">{reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSchedule} 
                disabled={isScheduling || overdueCount === 0}
                className="gap-2"
              >
                {isScheduling ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    Schedule {overdueCount} Tasks
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset}>
                Schedule Again
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
