import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { TechnicianCapacity, WorkOrder } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash, UserGear, Clock, TrendUp, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getAllTechnicians, getTechnicianCapacity, DEFAULT_DAILY_HOURS, calculateDailyCapacity } from '@/lib/capacity-utils'
import { format, startOfWeek, addDays } from 'date-fns'

interface CapacityPlanningProps {
  workOrders: WorkOrder[]
}

export function CapacityPlanning({ workOrders }: CapacityPlanningProps) {
  const [capacities, setCapacities] = useKV<TechnicianCapacity[]>('technician-capacities', [])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState<string | null>(null)
  const [technicianName, setTechnicianName] = useState('')
  const [dailyHourLimit, setDailyHourLimit] = useState('8')

  const safeCapacities = capacities || []
  const technicians = useMemo(() => getAllTechnicians(workOrders), [workOrders])

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const capacityData = useMemo(() => {
    return technicians.map(tech => {
      const capacity = getTechnicianCapacity(tech, safeCapacities)
      
      const weeklyStats = weekDays.map(day => 
        calculateDailyCapacity(day, tech, workOrders, safeCapacities)
      )

      const totalScheduledThisWeek = weeklyStats.reduce((sum, day) => sum + day.scheduled_hours, 0)
      const totalCapacityThisWeek = capacity * 7
      const avgUtilization = totalCapacityThisWeek > 0 
        ? (totalScheduledThisWeek / totalCapacityThisWeek) * 100 
        : 0
      const overallocatedDays = weeklyStats.filter(day => day.is_overallocated).length

      return {
        technician: tech,
        capacity,
        totalScheduledThisWeek,
        totalCapacityThisWeek,
        avgUtilization,
        overallocatedDays,
        weeklyStats
      }
    })
  }, [technicians, safeCapacities, workOrders, weekDays])

  const handleOpenAddDialog = () => {
    setEditingTechnician(null)
    setTechnicianName('')
    setDailyHourLimit('8')
    setEditDialogOpen(true)
  }

  const handleOpenEditDialog = (tech: string) => {
    setEditingTechnician(tech)
    setTechnicianName(tech)
    const existing = safeCapacities.find(c => c.technician_name === tech)
    setDailyHourLimit(String(existing?.daily_hour_limit || DEFAULT_DAILY_HOURS))
    setEditDialogOpen(true)
  }

  const handleSaveCapacity = () => {
    if (!technicianName.trim()) {
      toast.error('Technician name is required')
      return
    }

    const limit = parseFloat(dailyHourLimit)
    if (isNaN(limit) || limit <= 0) {
      toast.error('Daily hour limit must be a positive number')
      return
    }

    setCapacities((current) => {
      const updated = [...(current || [])]
      const existingIndex = updated.findIndex(c => c.technician_name === technicianName)

      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          daily_hour_limit: limit,
          updated_at: new Date().toISOString()
        }
      } else {
        updated.push({
          technician_name: technicianName,
          daily_hour_limit: limit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      return updated
    })

    toast.success(editingTechnician ? 'Capacity updated' : 'Capacity added')
    setEditDialogOpen(false)
  }

  const handleDeleteCapacity = (tech: string) => {
    setCapacities((current) => (current || []).filter(c => c.technician_name !== tech))
    toast.success('Capacity setting removed')
  }

  const totalCapacity = capacityData.reduce((sum, d) => sum + d.totalCapacityThisWeek, 0)
  const totalScheduled = capacityData.reduce((sum, d) => sum + d.totalScheduledThisWeek, 0)
  const overallUtilization = totalCapacity > 0 ? (totalScheduled / totalCapacity) * 100 : 0
  const totalOverallocatedDays = capacityData.reduce((sum, d) => sum + d.overallocatedDays, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Capacity Planning</h2>
          <p className="text-muted-foreground">
            Configure daily hour limits per technician and monitor workload utilization
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus size={18} />
          Add Capacity Limit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <UserGear size={32} className="text-primary" weight="duotone" />
              <div className="text-3xl font-bold">{technicians.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock size={32} className="text-primary" weight="duotone" />
              <div className="text-3xl font-bold">{totalCapacity}h</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendUp size={32} className="text-primary" weight="duotone" />
              <div className="text-3xl font-bold">{overallUtilization.toFixed(0)}%</div>
            </div>
            <Progress value={Math.min(overallUtilization, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className={totalOverallocatedDays > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overallocated Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Warning size={32} className={totalOverallocatedDays > 0 ? 'text-destructive' : 'text-muted-foreground'} weight="duotone" />
              <div className={`text-3xl font-bold ${totalOverallocatedDays > 0 ? 'text-destructive' : ''}`}>
                {totalOverallocatedDays}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technician Capacity Overview</CardTitle>
          <CardDescription>
            Weekly capacity utilization for {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {technicians.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserGear size={48} className="mx-auto mb-4 opacity-50" />
              <p>No technicians found in work orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-center">Daily Limit</TableHead>
                    <TableHead className="text-center">Weekly Scheduled</TableHead>
                    <TableHead className="text-center">Weekly Capacity</TableHead>
                    <TableHead className="text-center">Avg Utilization</TableHead>
                    <TableHead className="text-center">Overallocated Days</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityData.map((data) => (
                    <TableRow key={data.technician}>
                      <TableCell className="font-medium">{data.technician}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{data.capacity}h/day</Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {data.totalScheduledThisWeek.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {data.totalCapacityThisWeek}h
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          <span className={`font-semibold ${data.avgUtilization > 100 ? 'text-destructive' : ''}`}>
                            {data.avgUtilization.toFixed(0)}%
                          </span>
                          <Progress value={Math.min(data.avgUtilization, 100)} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {data.overallocatedDays > 0 ? (
                          <Badge variant="destructive">{data.overallocatedDays} days</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(data.technician)}
                          >
                            <Pencil size={16} />
                          </Button>
                          {safeCapacities.find(c => c.technician_name === data.technician) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCapacity(data.technician)}
                            >
                              <Trash size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Utilization Heatmap</CardTitle>
          <CardDescription>Hour utilization by technician and day</CardDescription>
        </CardHeader>
        <CardContent>
          {technicians.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p>No data to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b font-semibold text-sm">Technician</th>
                    {weekDays.map(day => (
                      <th key={day.toISOString()} className="text-center p-3 border-b font-semibold text-sm">
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-xs text-muted-foreground font-normal">{format(day, 'MMM d')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capacityData.map(data => (
                    <tr key={data.technician} className="border-b">
                      <td className="p-3 font-medium">{data.technician}</td>
                      {data.weeklyStats.map((dayStat, idx) => {
                        const utilizationPercent = dayStat.utilization_percent
                        let bgColor = 'bg-green-100'
                        let textColor = 'text-green-800'
                        
                        if (utilizationPercent > 100) {
                          bgColor = 'bg-red-100'
                          textColor = 'text-red-800'
                        } else if (utilizationPercent > 75) {
                          bgColor = 'bg-orange-100'
                          textColor = 'text-orange-800'
                        } else if (utilizationPercent > 50) {
                          bgColor = 'bg-yellow-100'
                          textColor = 'text-yellow-800'
                        }

                        return (
                          <td key={idx} className="p-1.5">
                            <div className={`${bgColor} ${textColor} rounded p-2 text-center text-xs font-medium min-h-[60px] flex flex-col justify-center`}>
                              <div className="font-semibold">{dayStat.scheduled_hours.toFixed(1)}h</div>
                              <div className="text-[10px] opacity-75">/ {dayStat.capacity_limit}h</div>
                              <div className="text-[10px] font-bold mt-0.5">
                                {dayStat.utilization_percent.toFixed(0)}%
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTechnician ? 'Edit Capacity Limit' : 'Add Capacity Limit'}
            </DialogTitle>
            <DialogDescription>
              Set the maximum daily work hours for a technician
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="technician-name">Technician Name</Label>
              {editingTechnician ? (
                <Input
                  id="technician-name"
                  value={technicianName}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Input
                  id="technician-name"
                  placeholder="Enter technician name"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Hour Limit</Label>
              <Input
                id="daily-limit"
                type="number"
                min="0"
                step="0.5"
                placeholder="8"
                value={dailyHourLimit}
                onChange={(e) => setDailyHourLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum hours per day this technician can be scheduled
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCapacity}>
              {editingTechnician ? 'Update' : 'Add'} Capacity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
