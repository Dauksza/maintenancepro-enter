/**
 * Work Order Template Management Component
 * 
 * Manages reusable work order templates with checklists
 */

import React, { useState } from 'react'
import { useKV } from '@github/spark'
import { Plus, Copy, Trash2, Edit, CheckSquare } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import { WorkOrderTemplate, ChecklistItem, WorkOrderType, PriorityLevel, Skill, Asset, SOP } from '../lib/types'
import { v4 as uuidv4 } from 'uuid'

export function WorkOrderTemplates() {
  const [templates = [], setTemplates] = useKV<WorkOrderTemplate[]>('work_order_templates', [])
  const [skills = [], ] = useKV<Skill[]>('skills', [])
  const [assets = [], ] = useKV<Asset[]>('assets', [])
  const [sops = [], ] = useKV<SOP[]>('sops', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkOrderTemplate | null>(null)

  const workOrderTypes: WorkOrderType[] = ['Maintenance', 'Inspection', 'Calibration', 'Repair']
  const priorityLevels: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical']

  const [formData, setFormData] = useState<Partial<WorkOrderTemplate>>({
    template_name: '',
    description: '',
    type: 'Maintenance',
    priority_level: 'Medium',
    estimated_downtime_hours: 0,
    task_template: '',
    comments_template: '',
    required_skill_ids: [],
    required_asset_ids: [],
    linked_sop_ids: [],
    recurrence_rule: null,
    checklist_items: [],
    is_active: true,
  })

  const [newChecklistItem, setNewChecklistItem] = useState({
    description: '',
    is_required: false,
  })

  const handleCreateTemplate = () => {
    if (!formData.template_name) {
      toast.error('Template name is required')
      return
    }

    if (!formData.task_template) {
      toast.error('Task template is required')
      return
    }

    const template: WorkOrderTemplate = {
      template_id: uuidv4(),
      template_name: formData.template_name,
      description: formData.description || '',
      type: formData.type!,
      priority_level: formData.priority_level!,
      estimated_downtime_hours: formData.estimated_downtime_hours || 0,
      task_template: formData.task_template,
      comments_template: formData.comments_template || '',
      required_skill_ids: formData.required_skill_ids || [],
      required_asset_ids: formData.required_asset_ids || [],
      linked_sop_ids: formData.linked_sop_ids || [],
      recurrence_rule: formData.recurrence_rule || null,
      checklist_items: formData.checklist_items || [],
      is_active: formData.is_active !== false,
      usage_count: 0,
      created_by: 'CURRENT_USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (selectedTemplate) {
      // Update existing
      setTemplates(templates.map(t => 
        t.template_id === selectedTemplate.template_id 
          ? { ...template, template_id: selectedTemplate.template_id, usage_count: selectedTemplate.usage_count }
          : t
      ))
      toast.success('Template updated successfully')
    } else {
      // Create new
      setTemplates([...templates, template])
      toast.success('Template created successfully')
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.template_id !== templateId))
    toast.success('Template deleted')
  }

  const handleToggleActive = (templateId: string) => {
    setTemplates(templates.map(t => 
      t.template_id === templateId 
        ? { ...t, is_active: !t.is_active, updated_at: new Date().toISOString() }
        : t
    ))
    toast.success('Template status updated')
  }

  const handleDuplicateTemplate = (template: WorkOrderTemplate) => {
    const duplicate: WorkOrderTemplate = {
      ...template,
      template_id: uuidv4(),
      template_name: `${template.template_name} (Copy)`,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTemplates([...templates, duplicate])
    toast.success('Template duplicated')
  }

  const handleEditTemplate = (template: WorkOrderTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      template_name: template.template_name,
      description: template.description,
      type: template.type,
      priority_level: template.priority_level,
      estimated_downtime_hours: template.estimated_downtime_hours,
      task_template: template.task_template,
      comments_template: template.comments_template,
      required_skill_ids: template.required_skill_ids,
      required_asset_ids: template.required_asset_ids,
      linked_sop_ids: template.linked_sop_ids,
      recurrence_rule: template.recurrence_rule,
      checklist_items: template.checklist_items,
      is_active: template.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.description) {
      toast.error('Checklist item description is required')
      return
    }

    const item: ChecklistItem = {
      item_id: uuidv4(),
      description: newChecklistItem.description,
      is_required: newChecklistItem.is_required,
      order: (formData.checklist_items?.length || 0) + 1,
      completed: false,
    }

    setFormData({
      ...formData,
      checklist_items: [...(formData.checklist_items || []), item],
    })

    setNewChecklistItem({ description: '', is_required: false })
  }

  const handleRemoveChecklistItem = (itemId: string) => {
    setFormData({
      ...formData,
      checklist_items: formData.checklist_items?.filter(item => item.item_id !== itemId) || [],
    })
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      description: '',
      type: 'Maintenance',
      priority_level: 'Medium',
      estimated_downtime_hours: 0,
      task_template: '',
      comments_template: '',
      required_skill_ids: [],
      required_asset_ids: [],
      linked_sop_ids: [],
      recurrence_rule: null,
      checklist_items: [],
      is_active: true,
    })
    setSelectedTemplate(null)
    setNewChecklistItem({ description: '', is_required: false })
  }

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      case 'Low': return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Order Templates</h2>
          <p className="text-muted-foreground">
            Create reusable templates for common maintenance tasks
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create Work Order Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template_name">Template Name *</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name || ''}
                    onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="Monthly HVAC Inspection"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of this template"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Work Order Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value => setFormData({ ...formData, type: value as WorkOrderType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workOrderTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority Level</Label>
                    <Select
                      value={formData.priority_level}
                      onValueChange={value => setFormData({ ...formData, priority_level: value as PriorityLevel })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimated_downtime_hours">Estimated Downtime (hours)</Label>
                  <Input
                    id="estimated_downtime_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_downtime_hours || 0}
                    onChange={e => setFormData({ ...formData, estimated_downtime_hours: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="task_template">Task Template *</Label>
                  <Textarea
                    id="task_template"
                    value={formData.task_template || ''}
                    onChange={e => setFormData({ ...formData, task_template: e.target.value })}
                    placeholder="Description of work to be performed"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="comments_template">Comments Template</Label>
                  <Textarea
                    id="comments_template"
                    value={formData.comments_template || ''}
                    onChange={e => setFormData({ ...formData, comments_template: e.target.value })}
                    placeholder="Additional notes or instructions"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active !== false}
                    onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Checklist Items</Label>
                </div>
                
                {formData.checklist_items && formData.checklist_items.length > 0 && (
                  <div className="space-y-2">
                    {formData.checklist_items.map((item, index) => (
                      <div key={item.item_id} className="flex items-center gap-2 p-2 border rounded">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{item.description}</span>
                        {item.is_required && <Badge variant="secondary">Required</Badge>}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveChecklistItem(item.item_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem.description}
                    onChange={e => setNewChecklistItem({ ...newChecklistItem, description: e.target.value })}
                    placeholder="Add checklist item..."
                    onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newChecklistItem.is_required}
                      onCheckedChange={checked => setNewChecklistItem({ ...newChecklistItem, is_required: checked })}
                    />
                    <Label className="text-xs">Required</Label>
                  </div>
                  <Button onClick={handleAddChecklistItem} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  {selectedTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No templates yet. Create one to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          templates.map(template => (
            <Card key={template.template_id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  {!template.is_active && <Badge variant="outline">Inactive</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="outline">{template.type}</Badge>
                    <Badge variant={getPriorityColor(template.priority_level)}>
                      {template.priority_level}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Est. Downtime:</span>
                      <span className="font-medium">{template.estimated_downtime_hours}h</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Checklist Items:</span>
                      <span className="font-medium">{template.checklist_items.length}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Times Used:</span>
                      <span className="font-medium">{template.usage_count}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.template_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
