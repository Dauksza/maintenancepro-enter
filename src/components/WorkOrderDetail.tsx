import { useState } from 'react'
import type { WorkOrder, SOP, SparesLabor } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, Package, Clock, Calendar as CalendarIcon } from '@phosphor-icons/react'
import { formatDate, formatDateTime, findMatchingSparesLabor } from '@/lib/maintenance-utils'
import { cn } from '@/lib/utils'

interface WorkOrderDetailProps {
  workOrder: WorkOrder | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<WorkOrder>) => void
  sparesLabor: SparesLabor[]
}

export function WorkOrderDetail({ 
  workOrder, 
  open, 
  onClose, 
  onUpdate,
  sparesLabor 
}: WorkOrderDetailProps) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<WorkOrder>>({})

  if (!workOrder) return null

  const currentData = editMode ? { ...workOrder, ...formData } : workOrder
  const matchingSpares = findMatchingSparesLabor(workOrder.equipment_area, sparesLabor)

  const handleSave = () => {
    onUpdate(workOrder.work_order_id, {
      ...formData,
      updated_at: new Date().toISOString()
    })
    setEditMode(false)
    setFormData({})
  }

  const handleCancel = () => {
    setEditMode(false)
    setFormData({})
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl">
                <code className="font-mono text-primary">{workOrder.work_order_id}</code>
              </SheetTitle>
              <SheetDescription>{workOrder.equipment_area}</SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex gap-2">
            <Badge className={cn(
              workOrder.priority_level === 'Critical' && 'priority-badge-critical',
              workOrder.priority_level === 'High' && 'priority-badge-high',
              workOrder.priority_level === 'Medium' && 'priority-badge-medium',
              workOrder.priority_level === 'Low' && 'priority-badge-low'
            )}>
              {currentData.priority_level}
            </Badge>
            <Badge className={cn(
              workOrder.status === 'Completed' && 'status-badge-completed',
              workOrder.status === 'In Progress' && 'status-badge-in-progress',
              workOrder.status === 'Overdue' && 'status-badge-overdue',
              workOrder.status.includes('Scheduled') && 'status-badge-scheduled'
            )}>
              {currentData.status}
            </Badge>
            <Badge variant="outline">{currentData.type}</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Task Description</Label>
              {editMode ? (
                <Textarea
                  value={formData.task ?? currentData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm">{currentData.task}</p>
              )}
            </div>

            <div>
              <Label>Comments / Description</Label>
              {editMode ? (
                <Textarea
                  value={formData.comments_description ?? currentData.comments_description}
                  onChange={(e) => setFormData({ ...formData, comments_description: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentData.comments_description || 'No additional comments'}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority Level</Label>
              {editMode ? (
                <Select
                  value={formData.priority_level ?? currentData.priority_level}
                  onValueChange={(v) => setFormData({ ...formData, priority_level: v as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm">{currentData.priority_level}</p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              {editMode ? (
                <Select
                  value={formData.status ?? currentData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled (Not Started)">Scheduled (Not Started)</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm">{currentData.status}</p>
              )}
            </div>

            <div>
              <Label>Scheduled Date</Label>
              {editMode ? (
                <Input
                  type="date"
                  value={formData.scheduled_date ?? currentData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm flex items-center gap-1">
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  {formatDate(currentData.scheduled_date)}
                </p>
              )}
            </div>

            <div>
              <Label>Estimated Downtime (hours)</Label>
              {editMode ? (
                <Input
                  type="number"
                  step="0.5"
                  value={formData.estimated_downtime_hours ?? currentData.estimated_downtime_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_downtime_hours: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm flex items-center gap-1">
                  <Clock size={14} className="text-muted-foreground" />
                  {currentData.estimated_downtime_hours}h
                </p>
              )}
            </div>

            <div>
              <Label>Assigned Technician</Label>
              {editMode ? (
                <Input
                  value={formData.assigned_technician ?? currentData.assigned_technician ?? ''}
                  onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
                  className="mt-1"
                  placeholder="Enter technician name"
                />
              ) : (
                <p className="mt-1 text-sm">{currentData.assigned_technician || 'Unassigned'}</p>
              )}
            </div>

            <div>
              <Label>Terminal</Label>
              <p className="mt-1 text-sm">{currentData.terminal}</p>
            </div>
          </div>

          {matchingSpares && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Recommended Spare Parts
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchingSpares.common_spares.map((spare, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {spare}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDateTime(currentData.created_at)}</p>
            <p>Last Updated: {formatDateTime(currentData.updated_at)}</p>
            {currentData.completed_at && (
              <p>Completed: {formatDateTime(currentData.completed_at)}</p>
            )}
            {currentData.auto_generated && (
              <p className="text-accent">Auto-generated from SOP</p>
            )}
          </div>

          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} className="flex-1">
                Edit Work Order
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
