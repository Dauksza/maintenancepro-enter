import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { 
  WorkOrder, 
  Employee, 
  SkillMatrixEntry, 
  SOP, 
  SparesLabor,
  PriorityLevel,
  WorkOrderType
} from '@/lib/types'
import { 
  getComprehensiveSuggestions,
  type WorkOrderDraft,
  type WorkOrderSuggestion 
} from '@/lib/work-order-suggestions'
import { generateRecommendations, type EmployeeRecommendation } from '@/lib/skill-matcher'
import { Sparkle, CheckCircle, Lightbulb, Clock, User, Package } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface NewWorkOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreateWorkOrder: (workOrder: WorkOrder) => void
  workOrders: WorkOrder[]
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  sops: SOP[]
  sparesLabor: SparesLabor[]
  cloneFrom?: WorkOrder | null
}

export function NewWorkOrderDialog({
  open,
  onClose,
  onCreateWorkOrder,
  workOrders,
  employees,
  skillMatrix,
  sops,
  sparesLabor,
  cloneFrom
}: NewWorkOrderDialogProps) {
  const [draft, setDraft] = useState<WorkOrderDraft>({
    terminal: 'Hanceville Terminal',
    scheduled_date: new Date().toISOString().split('T')[0]
  })
  
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [selectedSpares, setSelectedSpares] = useState<string[]>([])
  const [appliedSuggestions, setAppliedSuggestions] = useState<Array<{ field: string, value: string }>>([])
  const [technicianRecommendations, setTechnicianRecommendations] = useState<EmployeeRecommendation[]>([])
  const [showTechnicianRecommendations, setShowTechnicianRecommendations] = useState(false)

  const suggestions = useMemo(() => {
    return getComprehensiveSuggestions(
      draft,
      workOrders,
      employees,
      skillMatrix,
      sops,
      sparesLabor
    )
  }, [draft, workOrders, employees, skillMatrix, sops, sparesLabor])

  useEffect(() => {
    if (open) {
      if (cloneFrom) {
        setDraft({
          equipment_area: cloneFrom.equipment_area,
          priority_level: cloneFrom.priority_level,
          type: cloneFrom.type,
          task: cloneFrom.task,
          comments_description: cloneFrom.comments_description,
          estimated_downtime_hours: cloneFrom.estimated_downtime_hours,
          assigned_technician: cloneFrom.assigned_technician || undefined,
          terminal: cloneFrom.terminal,
          scheduled_date: new Date().toISOString().split('T')[0]
        })
        toast.info('Cloning work order', {
          description: `Pre-filled from ${cloneFrom.work_order_id}`,
          duration: 3000
        })
      } else {
        setDraft({
          terminal: 'Hanceville Terminal',
          scheduled_date: new Date().toISOString().split('T')[0]
        })
      }
      setSelectedSpares([])
      setShowSuggestions(true)
      setAppliedSuggestions([])
      setTechnicianRecommendations([])
      setShowTechnicianRecommendations(false)
    }
  }, [open, cloneFrom])

  const handleSuggestTechnicians = () => {
    if (!draft.equipment_area || !draft.priority_level || !draft.type || !draft.task) {
      toast.error('Enter equipment, priority, type, and task before suggesting technicians')
      return
    }

    const draftWorkOrder: WorkOrder = {
      work_order_id: `DRAFT-${Date.now()}`,
      equipment_area: draft.equipment_area,
      priority_level: draft.priority_level,
      status: 'Scheduled (Not Started)',
      type: draft.type,
      task: draft.task,
      comments_description: draft.comments_description || '',
      scheduled_date: draft.scheduled_date || new Date().toISOString(),
      estimated_downtime_hours: draft.estimated_downtime_hours || 1,
      assigned_technician: null,
      entered_by: null,
      terminal: draft.terminal || 'Hanceville Terminal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      is_overdue: false,
      auto_generated: false
    }

    const ranked = generateRecommendations(
      draftWorkOrder,
      employees.filter(emp => emp.status === 'Active'),
      skillMatrix,
      workOrders,
      []
    )

    setTechnicianRecommendations(ranked)
    setShowTechnicianRecommendations(true)

    if (ranked.length === 0) {
      toast.error('No technicians available for recommendation')
      return
    }

    toast.success(`Generated ${ranked.length} ranked technician recommendation${ranked.length === 1 ? '' : 's'}`)
  }

  const handleSelectRecommendedTechnician = (recommendation: EmployeeRecommendation) => {
    const technicianName = `${recommendation.employee.first_name} ${recommendation.employee.last_name}`
    setDraft(prev => ({ ...prev, assigned_technician: technicianName }))
    toast.success('Technician auto-filled from recommendation')
  }

  const handleApplySuggestion = (field: string, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }))
    setAppliedSuggestions(prev => {
      const filtered = prev.filter(s => s.field !== field)
      return [...filtered, { field, value }]
    })
    toast.success('Suggestion applied', {
      description: `${field.replace(/_/g, ' ')}: ${value}`,
      duration: 2000
    })
  }

  const handleCreate = () => {
    if (!draft.equipment_area || !draft.priority_level || !draft.type || !draft.task) {
      toast.error('Please fill in all required fields')
      return
    }

    const workOrder: WorkOrder = {
      work_order_id: `WO-${Date.now()}`,
      equipment_area: draft.equipment_area,
      priority_level: draft.priority_level,
      status: 'Scheduled (Not Started)',
      type: draft.type,
      task: draft.task,
      comments_description: draft.comments_description || '',
      scheduled_date: draft.scheduled_date || new Date().toISOString(),
      estimated_downtime_hours: draft.estimated_downtime_hours || 0,
      assigned_technician: draft.assigned_technician || null,
      entered_by: null,
      terminal: draft.terminal || 'Hanceville Terminal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      is_overdue: false,
      auto_generated: false
    }

    onCreateWorkOrder(workOrder)
    toast.success('Work order created successfully')
    onClose()
  }

  const getSuggestionIcon = (field: string) => {
    switch (field) {
      case 'assigned_technician':
        return <User size={14} weight="fill" />
      case 'estimated_downtime_hours':
        return <Clock size={14} weight="fill" />
      case 'common_spares':
        return <Package size={14} weight="fill" />
      default:
        return <Lightbulb size={14} weight="fill" />
    }
  }

  const getSuggestionColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-accent text-accent-foreground'
    if (confidence >= 60) return 'bg-primary/10 text-primary'
    return 'bg-muted text-muted-foreground'
  }

  const renderSuggestion = (suggestion: WorkOrderSuggestion) => {
    if (suggestion.suggestions.length === 0) return null

    return (
      <Card key={suggestion.field} className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {getSuggestionIcon(suggestion.field)}
          <span className="font-semibold text-sm capitalize">
            {suggestion.field.replace(/_/g, ' ')} Suggestions
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestion.suggestions.slice(0, 3).map((item, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleApplySuggestion(suggestion.field, item.value)}
              className={`gap-2 ${getSuggestionColor(item.confidence)}`}
            >
              <Sparkle size={12} weight="fill" />
              <span className="max-w-[200px] truncate">{item.value}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {item.confidence.toFixed(0)}%
              </Badge>
            </Button>
          ))}
        </div>
        
        {suggestion.suggestions[0] && (
          <p className="text-xs text-muted-foreground">
            {suggestion.suggestions[0].reason}
          </p>
        )}
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkle size={24} weight="fill" className="text-accent" />
            {cloneFrom ? 'Clone Work Order' : 'Create New Work Order'}
          </DialogTitle>
          <DialogDescription>
            {cloneFrom 
              ? `Creating a new work order based on ${cloneFrom.work_order_id}. Adjust as needed.`
              : "Fill in the details below. We'll suggest values based on historical data and employee skills."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="equipment_area" className="flex items-center gap-2">
                Equipment / Area <span className="text-destructive">*</span>
              </Label>
              <Input
                id="equipment_area"
                value={draft.equipment_area || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, equipment_area: e.target.value }))}
                placeholder="e.g., Actuator, Pump, Conveyor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.type}
                onValueChange={(value) => setDraft(prev => ({ ...prev, type: value as WorkOrderType }))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Calibration">Calibration</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority_level" className="flex items-center gap-2">
                Priority Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.priority_level}
                onValueChange={(value) => setDraft(prev => ({ ...prev, priority_level: value as PriorityLevel }))}
              >
                <SelectTrigger id="priority_level">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task" className="flex items-center gap-2">
                Task Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="task"
                value={draft.task || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, task: e.target.value }))}
                placeholder="Describe the maintenance task..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments_description">Additional Comments</Label>
              <Textarea
                id="comments_description"
                value={draft.comments_description || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, comments_description: e.target.value }))}
                placeholder="Any additional notes or instructions..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={draft.scheduled_date || ''}
                  onChange={(e) => setDraft(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_downtime_hours">Est. Downtime (hrs)</Label>
                <Input
                  id="estimated_downtime_hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={draft.estimated_downtime_hours || ''}
                  onChange={(e) => setDraft(prev => ({ 
                    ...prev, 
                    estimated_downtime_hours: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_technician">Assigned Technician</Label>
              <Select
                value={draft.assigned_technician}
                onValueChange={(value) => setDraft(prev => ({ ...prev, assigned_technician: value }))}
              >
                <SelectTrigger id="assigned_technician">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(emp => emp.status === 'Active')
                    .map(emp => (
                      <SelectItem 
                        key={emp.employee_id} 
                        value={`${emp.first_name} ${emp.last_name}`}
                      >
                        {emp.first_name} {emp.last_name} - {emp.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
                onClick={handleSuggestTechnicians}
              >
                <Sparkle size={14} weight="fill" />
                Suggest Technician
              </Button>

              {showTechnicianRecommendations && (
                <Card className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Ranked Candidates</span>
                    <Badge variant="secondary">{technicianRecommendations.length}</Badge>
                  </div>

                  {technicianRecommendations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No matching technicians found.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {technicianRecommendations.slice(0, 5).map((candidate, index) => {
                        const name = `${candidate.employee.first_name} ${candidate.employee.last_name}`
                        return (
                          <div key={candidate.employee.employee_id} className="flex items-center justify-between gap-2 border rounded-md p-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{index + 1}. {name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {Math.round(candidate.score)}% score · {Math.round(candidate.match_percentage)}% skill match · {candidate.availability}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                Certs: {candidate.certifications_status}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectRecommendedTechnician(candidate)}
                            >
                              Select
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminal">Terminal</Label>
              <Input
                id="terminal"
                value={draft.terminal || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, terminal: e.target.value }))}
                placeholder="Hanceville Terminal"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background pb-2 z-10">
              <div className="flex items-center gap-2">
                <Sparkle size={20} weight="fill" className="text-accent" />
                <h3 className="font-semibold">AI Suggestions</h3>
                {appliedSuggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {appliedSuggestions.length} applied
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showSuggestions && (
              <div className="space-y-3">
                {suggestions.length === 0 && (
                  <Card className="p-6 text-center">
                    <Lightbulb size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Start entering equipment area to see suggestions
                    </p>
                  </Card>
                )}

                {suggestions.map(suggestion => renderSuggestion(suggestion))}

                {appliedSuggestions.length > 0 && (
                  <>
                    <Separator />
                    <Card className="p-4 bg-accent/5 border-accent/20">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} weight="fill" className="text-accent" />
                        <span className="text-sm font-semibold">Applied Suggestions</span>
                      </div>
                      <div className="space-y-2">
                        {appliedSuggestions.map((applied, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground capitalize">
                              {applied.field.replace(/_/g, ' ')}
                            </span>
                            <span className="font-medium truncate max-w-[200px]">
                              {applied.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Required fields
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <CheckCircle size={18} weight="fill" />
              Create Work Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
