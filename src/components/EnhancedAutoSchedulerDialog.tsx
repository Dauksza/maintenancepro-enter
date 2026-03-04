import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { 
  WorkOrder, 
  Employee, 
  Skill, 
  Asset, 
  Area, 
  SkillMatrixEntry, 
  EmployeeSchedule,
  TechnicianCapacity 
} from '@/lib/types'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Sparkle, 
  CalendarBlank, 
  Users, 
  Clock, 
  Warning,
  CheckCircle,
  XCircle,
  GraduationCap,
  MapPin,
  Package
} from '@phosphor-icons/react'
import { enhancedAutoSchedule } from '@/lib/enhanced-auto-scheduler'
import { isOverdue } from '@/lib/maintenance-utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface EnhancedAutoSchedulerDialogProps {
  open: boolean
  onClose: () => void
  workOrders: WorkOrder[]
  onScheduleComplete: (scheduledOrders: WorkOrder[]) => void
  employees?: Employee[]
  skillMatrix?: SkillMatrixEntry[]
  schedules?: EmployeeSchedule[]
}

export function EnhancedAutoSchedulerDialog({
  open,
  onClose,
  workOrders,
  onScheduleComplete,
  employees: employeesProp,
  skillMatrix: skillMatrixProp,
  schedules: schedulesProp
}: EnhancedAutoSchedulerDialogProps) {
  const [employeesKV] = useKV<Employee[]>('employees', [])
  const [skills] = useKV<Skill[]>('skills', [])
  const [skillMatrixKV] = useKV<SkillMatrixEntry[]>('skill-matrix', [])
  const [assets] = useKV<Asset[]>('assets', [])
  const [areas] = useKV<Area[]>('areas', [])
  const [schedulesKV] = useKV<EmployeeSchedule[]>('employee-schedules', [])
  const [capacities] = useKV<TechnicianCapacity[]>('technician-capacities', [])

  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [prioritizeBy, setPrioritizeBy] = useState<'priority' | 'date' | 'duration' | 'skill_match'>('priority')
  const [allowWeekends, setAllowWeekends] = useState(false)
  const [maxDaysAhead, setMaxDaysAhead] = useState(30)
  const [considerSkills, setConsiderSkills] = useState(true)
  const [considerAreas, setConsiderAreas] = useState(true)
  const [considerAssets, setConsiderAssets] = useState(true)
  const [allowPartialMatch, setAllowPartialMatch] = useState(true)
  const [minSkillLevel, setMinSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Beginner')
  const [isScheduling, setIsScheduling] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Prefer props passed from parent (always current) over local KV reads
  const safeEmployees = employeesProp ?? employeesKV ?? []
  const safeSkills = skills || []
  const safeSkillMatrix = skillMatrixProp ?? skillMatrixKV ?? []
  const safeAssets = assets || []
  const safeAreas = areas || []
  const safeSchedules = schedulesProp ?? schedulesKV ?? []
  const safeCapacities = capacities || []

  const targetOrders = workOrders.filter(wo => 
    (isOverdue(wo) || wo.status === 'Scheduled (Not Started)') &&
    wo.status !== 'Completed' && 
    wo.status !== 'Cancelled'
  )

  const activeEmployees = safeEmployees.filter(emp => emp.status === 'Active')

  const preview = useMemo(() => {
    if (!showPreview || targetOrders.length === 0) return null

    return enhancedAutoSchedule(
      targetOrders,
      activeEmployees,
      safeSkills,
      safeSkillMatrix,
      safeAssets,
      safeAreas,
      safeSchedules,
      safeCapacities,
      {
        startDate: new Date(startDate),
        prioritizeBy,
        allowWeekends,
        maxDaysAhead,
        considerSkills,
        considerAreas,
        considerAssets,
        allowPartialMatch,
        minSkillLevel
      }
    )
  }, [
    showPreview,
    targetOrders,
    activeEmployees,
    safeSkills,
    safeSkillMatrix,
    safeAssets,
    safeAreas,
    safeSchedules,
    safeCapacities,
    startDate,
    prioritizeBy,
    allowWeekends,
    maxDaysAhead,
    considerSkills,
    considerAreas,
    considerAssets,
    allowPartialMatch,
    minSkillLevel
  ])

  const handleGeneratePreview = () => {
    setShowPreview(true)
    toast.info('Generating scheduling preview...')
  }

  const handleSchedule = () => {
    setIsScheduling(true)
    
    try {
      const result = enhancedAutoSchedule(
        targetOrders,
        activeEmployees,
        safeSkills,
        safeSkillMatrix,
        safeAssets,
        safeAreas,
        safeSchedules,
        safeCapacities,
        {
          startDate: new Date(startDate),
          prioritizeBy,
          allowWeekends,
          maxDaysAhead,
          considerSkills,
          considerAreas,
          considerAssets,
          allowPartialMatch,
          minSkillLevel
        }
      )

      if (result.scheduled.length > 0) {
        onScheduleComplete(result.scheduled)
        toast.success(
          `Successfully scheduled ${result.scheduled.length} work order${result.scheduled.length === 1 ? '' : 's'}!`,
          {
            description: `Average score: ${result.stats.avgScore.toFixed(1)}/100. ${result.failed.length} could not be scheduled.`
          }
        )
        onClose()
      } else {
        toast.error('No work orders could be scheduled', {
          description: result.failed.length > 0 ? result.failed[0].reason : 'Unknown error'
        })
      }
    } catch (error) {
      toast.error('Failed to schedule work orders')
      console.error(error)
    } finally {
      setIsScheduling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-accent" />
            Enhanced Auto-Scheduler
          </DialogTitle>
          <DialogDescription>
            Intelligent work order scheduling using skills, areas, assets, and employee availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <CheckCircle size={18} />
            <AlertDescription>
              Found <strong>{targetOrders.length}</strong> work order{targetOrders.length === 1 ? '' : 's'} to schedule
              across <strong>{activeEmployees.length}</strong> active employee{activeEmployees.length === 1 ? '' : 's'}
            </AlertDescription>
          </Alert>

          {activeEmployees.length === 0 && (
            <Alert variant="destructive">
              <Warning size={18} />
              <AlertDescription>
                No active employees available. Add employees to enable auto-scheduling.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDays">Max Days Ahead</Label>
                  <Input
                    id="maxDays"
                    type="number"
                    min={1}
                    max={90}
                    value={maxDaysAhead}
                    onChange={(e) => setMaxDaysAhead(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioritize">Prioritize By</Label>
                  <Select value={prioritizeBy} onValueChange={(val: any) => setPrioritizeBy(val)}>
                    <SelectTrigger id="prioritize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority Level</SelectItem>
                      <SelectItem value="date">Scheduled Date</SelectItem>
                      <SelectItem value="duration">Task Duration</SelectItem>
                      <SelectItem value="skill_match">Skill Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="weekends" className="cursor-pointer">
                    Allow Weekend Scheduling
                  </Label>
                  <Switch
                    id="weekends"
                    checked={allowWeekends}
                    onCheckedChange={setAllowWeekends}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="skills" className="cursor-pointer flex items-center gap-2">
                    <GraduationCap size={16} />
                    Consider Skills
                  </Label>
                  <Switch
                    id="skills"
                    checked={considerSkills}
                    onCheckedChange={setConsiderSkills}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="areas" className="cursor-pointer flex items-center gap-2">
                    <MapPin size={16} />
                    Consider Areas
                  </Label>
                  <Switch
                    id="areas"
                    checked={considerAreas}
                    onCheckedChange={setConsiderAreas}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="assets" className="cursor-pointer flex items-center gap-2">
                    <Package size={16} />
                    Consider Assets
                  </Label>
                  <Switch
                    id="assets"
                    checked={considerAssets}
                    onCheckedChange={setConsiderAssets}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="partial" className="cursor-pointer">
                    Allow Partial Matches
                  </Label>
                  <Switch
                    id="partial"
                    checked={allowPartialMatch}
                    onCheckedChange={setAllowPartialMatch}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minSkill">Minimum Skill Level</Label>
                  <Select value={minSkillLevel} onValueChange={(val: any) => setMinSkillLevel(val)}>
                    <SelectTrigger id="minSkill">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {showPreview && preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview Results</CardTitle>
                <CardDescription>
                  Scheduling simulation - no changes will be made until you confirm
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-3xl font-bold text-green-600">{preview.stats.successfullyScheduled}</div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-3xl font-bold text-red-600">{preview.stats.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-3xl font-bold text-blue-600">{preview.stats.employeesUsed}</div>
                    <div className="text-sm text-muted-foreground">Employees</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-3xl font-bold text-purple-600">{preview.stats.avgScore.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                </div>

                {preview.failed.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-destructive">Failed Assignments</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {preview.failed.slice(0, 5).map((failure) => (
                        <Alert key={failure.workOrder.work_order_id} variant="destructive">
                          <XCircle size={16} />
                          <AlertDescription className="text-xs">
                            <strong>{failure.workOrder.work_order_id}</strong>: {failure.reason}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {preview.failed.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{preview.failed.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isScheduling}>
            Cancel
          </Button>
          {!showPreview && (
            <Button 
              onClick={handleGeneratePreview} 
              variant="secondary"
              disabled={activeEmployees.length === 0 || targetOrders.length === 0}
            >
              Generate Preview
            </Button>
          )}
          <Button 
            onClick={handleSchedule} 
            disabled={isScheduling || activeEmployees.length === 0 || targetOrders.length === 0}
            className="gap-2"
          >
            {isScheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                Scheduling...
              </>
            ) : (
              <>
                <Sparkle size={18} weight="fill" />
                Schedule Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
