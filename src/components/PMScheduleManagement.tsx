/**
 * PM Schedule Management Component
 * 
 * Manages preventive maintenance schedules with time-based, meter-based,
 * and condition-based triggers
 */

import React, { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Plus, Calendar, Clock, Gauge, AlertTriangle, Play, Pause, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import { PMSchedule, Asset, SOP, MaintenanceFrequency, WorkOrder } from '../lib/types'
import { PMScheduler } from '../lib/pm-scheduler'
import { v4 as uuidv4 } from 'uuid'

export function PMScheduleManagement() {
  const [schedules = [], setSchedules] = useKV<PMSchedule[]>('pm_schedules', [])
  const [assets = [], ] = useKV<Asset[]>('assets', [])
  const [sops = [], ] = useKV<SOP[]>('sops', [])
  const [workOrders = [], setWorkOrders] = useKV<WorkOrder[]>('work_orders', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<PMSchedule | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<PMSchedule>>({
    schedule_name: '',
    description: '',
    asset_ids: [],
    sop_id: null,
    trigger_type: 'time_based',
    is_active: true,
    auto_generate: true,
    recurrence_rule: {
      frequency: 'Monthly',
      interval: 1,
      end_date: null,
      max_occurrences: null,
    },
    work_order_template: {
      priority_level: 'Medium',
      type: 'Maintenance',
      estimated_downtime_hours: 0,
    },
  })

  // Statistics
  const stats = useMemo(() => {
    const active = schedules.filter(s => s.is_active).length
    const timeBasedCount = schedules.filter(s => s.trigger_type === 'time_based').length
    const meterBasedCount = schedules.filter(s => s.trigger_type === 'meter_based').length
    
    // Calculate PM compliance
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const compliance = PMScheduler.calculatePMCompliance(
      schedules,
      workOrders,
      thirtyDaysAgo,
      new Date()
    )

    return {
      total: schedules.length,
      active,
      inactive: schedules.length - active,
      time_based: timeBasedCount,
      meter_based: meterBasedCount,
      compliance_percent: compliance.compliance_percent,
    }
  }, [schedules, workOrders])

  const handleCreateSchedule = () => {
    if (!formData.schedule_name) {
      toast.error('Schedule name is required')
      return
    }

    if (!formData.asset_ids || formData.asset_ids.length === 0) {
      toast.error('At least one asset must be selected')
      return
    }

    const newSchedule: PMSchedule = {
      schedule_id: uuidv4(),
      schedule_name: formData.schedule_name,
      description: formData.description || '',
      asset_id: null,
      asset_ids: formData.asset_ids,
      sop_id: formData.sop_id || null,
      trigger_type: formData.trigger_type || 'time_based',
      recurrence_rule: formData.recurrence_rule!,
      meter_trigger: formData.meter_trigger || null,
      is_active: formData.is_active !== false,
      last_generated_at: null,
      next_generation_date: formData.trigger_type === 'time_based' 
        ? new Date().toISOString() 
        : null,
      auto_generate: formData.auto_generate !== false,
      work_order_template: formData.work_order_template!,
      created_by: 'CURRENT_USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setSchedules([...schedules, newSchedule])
    toast.success('PM schedule created successfully')
    setIsDialogOpen(false)
    resetForm()
  }

  const handleToggleActive = (scheduleId: string) => {
    setSchedules(schedules.map(s => 
      s.schedule_id === scheduleId 
        ? { ...s, is_active: !s.is_active, updated_at: new Date().toISOString() }
        : s
    ))
    toast.success('Schedule status updated')
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(s => s.schedule_id !== scheduleId))
    toast.success('PM schedule deleted')
  }

  const handleGenerateWorkOrders = () => {
    const result = PMScheduler.generatePMWorkOrders(schedules, assets, sops)
    
    if (result.generated_work_orders.length > 0) {
      setWorkOrders([...workOrders, ...result.generated_work_orders])
      
      // Update last generated dates
      const now = new Date().toISOString()
      setSchedules(schedules.map(s => {
        const generated = result.generated_work_orders.some(wo => 
          wo.comments_description?.includes(s.schedule_name)
        )
        if (generated) {
          return { 
            ...s, 
            last_generated_at: now,
            next_generation_date: PMScheduler['calculateNextScheduledDate'](
              s.recurrence_rule, 
              new Date()
            ).toISOString(),
          }
        }
        return s
      }))

      toast.success(`Generated ${result.generated_work_orders.length} work orders`)
    } else {
      toast.info('No work orders to generate at this time')
    }

    if (result.errors.length > 0) {
      toast.error(`${result.errors.length} schedules had errors`)
    }
  }

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      description: '',
      asset_ids: [],
      sop_id: null,
      trigger_type: 'time_based',
      is_active: true,
      auto_generate: true,
      recurrence_rule: {
        frequency: 'Monthly',
        interval: 1,
        end_date: null,
        max_occurrences: null,
      },
      work_order_template: {
        priority_level: 'Medium',
        type: 'Maintenance',
        estimated_downtime_hours: 0,
      },
    })
    setSelectedSchedule(null)
  }

  const getTriggerIcon = (type: PMSchedule['trigger_type']) => {
    switch (type) {
      case 'time_based':
        return <Clock className="h-4 w-4" />
      case 'meter_based':
        return <Gauge className="h-4 w-4" />
      case 'condition_based':
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PM Schedules</h2>
          <p className="text-muted-foreground">
            Manage preventive maintenance schedules and auto-generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateWorkOrders} variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Generate Work Orders
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New PM Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create PM Schedule</DialogTitle>
              </DialogHeader>
              <PMScheduleForm
                formData={formData}
                setFormData={setFormData}
                assets={assets}
                sops={sops}
                onSubmit={handleCreateSchedule}
                onCancel={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time-Based</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.time_based}</div>
            <p className="text-xs text-muted-foreground">Scheduled by date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meter-Based</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meter_based}</div>
            <p className="text-xs text-muted-foreground">Triggered by meters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PM Compliance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.compliance_percent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>All PM Schedules</CardTitle>
          <CardDescription>
            View and manage all preventive maintenance schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No PM schedules yet. Create one to get started.</p>
              </div>
            ) : (
              schedules.map(schedule => (
                <div
                  key={schedule.schedule_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getTriggerIcon(schedule.trigger_type)}
                      {schedule.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold">{schedule.schedule_name}</h4>
                      <p className="text-sm text-muted-foreground">{schedule.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{schedule.asset_ids.length} asset(s)</span>
                        <span>Every {schedule.recurrence_rule.interval} {schedule.recurrence_rule.frequency.toLowerCase()}</span>
                        {schedule.last_generated_at && (
                          <span>Last run: {new Date(schedule.last_generated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(schedule.schedule_id)}
                    >
                      {schedule.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSchedule(schedule.schedule_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// PM Schedule Form Component
function PMScheduleForm({
  formData,
  setFormData,
  assets,
  sops,
  onSubmit,
  onCancel,
}: {
  formData: Partial<PMSchedule>
  setFormData: React.Dispatch<React.SetStateAction<Partial<PMSchedule>>>
  assets: Asset[]
  sops: SOP[]
  onSubmit: () => void
  onCancel: () => void
}) {
  const frequencies: MaintenanceFrequency[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Bi-Yearly', 'Yearly']

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="schedule_name">Schedule Name *</Label>
          <Input
            id="schedule_name"
            value={formData.schedule_name || ''}
            onChange={e => setFormData({ ...formData, schedule_name: e.target.value })}
            placeholder="Monthly Equipment Inspection"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Regular preventive maintenance"
          />
        </div>

        <div>
          <Label>Trigger Type</Label>
          <Select
            value={formData.trigger_type}
            onValueChange={value => setFormData({ ...formData, trigger_type: value as PMSchedule['trigger_type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_based">Time-Based</SelectItem>
              <SelectItem value="meter_based">Meter-Based</SelectItem>
              <SelectItem value="condition_based">Condition-Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.trigger_type === 'time_based' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequency</Label>
              <Select
                value={formData.recurrence_rule?.frequency}
                onValueChange={value => setFormData({
                  ...formData,
                  recurrence_rule: {
                    ...formData.recurrence_rule!,
                    frequency: value as MaintenanceFrequency,
                  },
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Interval</Label>
              <Input
                type="number"
                min="1"
                value={formData.recurrence_rule?.interval || 1}
                onChange={e => setFormData({
                  ...formData,
                  recurrence_rule: {
                    ...formData.recurrence_rule!,
                    interval: parseInt(e.target.value) || 1,
                  },
                })}
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active !== false}
            onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto_generate"
            checked={formData.auto_generate !== false}
            onCheckedChange={checked => setFormData({ ...formData, auto_generate: checked })}
          />
          <Label htmlFor="auto_generate">Auto-generate work orders</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSubmit}>Create Schedule</Button>
      </div>
    </div>
  )
}
