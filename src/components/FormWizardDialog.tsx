import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FormTemplate, FormSection, FormField, FormFieldType } from '@/lib/types'
import { Plus, Trash, ArrowUp, ArrowDown, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FormWizardDialogProps {
  open: boolean
  onClose: () => void
  onCreateTemplate: (template: FormTemplate) => void
  onUpdateTemplate?: (templateId: string, updates: Partial<FormTemplate>) => void
  editingTemplate?: FormTemplate | null
}

export function FormWizardDialog({
  open,
  onClose,
  onCreateTemplate,
  onUpdateTemplate,
  editingTemplate,
}: FormWizardDialogProps) {
  const [step, setStep] = useState(1)
  const [templateName, setTemplateName] = useState('')
  const [templateType, setTemplateType] = useState<'JHA' | 'Inspection' | 'Safety' | 'Quality' | 'Audit' | 'Custom'>('Custom')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [sections, setSections] = useState<FormSection[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Pre-populate when editing
  useEffect(() => {
    if (editingTemplate && open) {
      setTemplateName(editingTemplate.template_name)
      setTemplateType(editingTemplate.template_type as typeof templateType)
      setDescription(editingTemplate.description)
      setCategory(editingTemplate.category)
      setRequiresApproval(editingTemplate.requires_approval)
      setSections(editingTemplate.sections)
      setTags(editingTemplate.tags)
    }
  }, [editingTemplate, open])

  const fieldTypes: FormFieldType[] = [
    'text', 'textarea', 'number', 'date', 'time', 'datetime',
    'checkbox', 'radio', 'select', 'rating', 'hazard-level'
  ]

  const handleAddSection = () => {
    const newSection: FormSection = {
      section_id: `section-${Date.now()}`,
      title: '',
      description: '',
      fields: [],
      order: sections.length + 1,
    }
    setSections([...sections, newSection])
  }

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(s => s.section_id !== sectionId))
  }

  const handleUpdateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setSections(sections.map(s => 
      s.section_id === sectionId ? { ...s, ...updates } : s
    ))
  }

  const handleAddField = (sectionId: string) => {
    const newField: FormField = {
      field_id: `field-${Date.now()}`,
      field_type: 'text',
      label: '',
      required: false,
      order: 1,
    }
    
    setSections(sections.map(s => {
      if (s.section_id === sectionId) {
        return {
          ...s,
          fields: [...s.fields, { ...newField, order: s.fields.length + 1 }]
        }
      }
      return s
    }))
  }

  const handleRemoveField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s => {
      if (s.section_id === sectionId) {
        return {
          ...s,
          fields: s.fields.filter(f => f.field_id !== fieldId)
        }
      }
      return s
    }))
  }

  const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    setSections(sections.map(s => {
      if (s.section_id === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => 
            f.field_id === fieldId ? { ...f, ...updates } : f
          )
        }
      }
      return s
    }))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSections = [...sections]
      ;[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]]
      setSections(newSections.map((s, i) => ({ ...s, order: i + 1 })))
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      setSections(newSections.map((s, i) => ({ ...s, order: i + 1 })))
    }
  }

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleCreate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (!category.trim()) {
      toast.error('Please enter a category')
      return
    }

    if (sections.length === 0) {
      toast.error('Please add at least one section')
      return
    }

    const hasEmptySections = sections.some(s => !s.title.trim())
    if (hasEmptySections) {
      toast.error('All sections must have a title')
      return
    }

    const hasEmptyFields = sections.some(s => 
      s.fields.some(f => !f.label.trim())
    )
    if (hasEmptyFields) {
      toast.error('All fields must have a label')
      return
    }

    if (editingTemplate && onUpdateTemplate) {
      onUpdateTemplate(editingTemplate.template_id, {
        template_name: templateName,
        template_type: templateType,
        description,
        category,
        sections,
        requires_approval: requiresApproval,
        approval_workflow: requiresApproval ? ['supervisor'] : undefined,
        tags,
        updated_at: new Date().toISOString(),
      })
      toast.success('Form template updated successfully')
    } else {
      const template: FormTemplate = {
        template_id: `custom-${Date.now()}`,
        template_name: templateName,
        template_type: templateType,
        description,
        category,
        is_premade: false,
        sections,
        version: 1,
        status: 'Active',
        requires_approval: requiresApproval,
        approval_workflow: requiresApproval ? ['supervisor'] : undefined,
        linked_sop_ids: [],
        linked_asset_ids: [],
        linked_work_order_types: [],
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags,
      }

      onCreateTemplate(template)
      toast.success('Custom form created successfully')
    }
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setStep(1)
    setTemplateName('')
    setTemplateType('Custom')
    setDescription('')
    setCategory('')
    setRequiresApproval(false)
    setSections([])
    setTags([])
    setTagInput('')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Form Template' : 'Create Custom Form'}</DialogTitle>
          <DialogDescription>
            {editingTemplate ? 'Modify the form template settings, sections, and fields' : 'Build a custom form template for your specific needs'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 1: Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Quarterly Equipment Inspection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Form Type</Label>
                <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                  <SelectTrigger id="template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JHA">JHA (Job Hazard Analysis)</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Equipment, Safety, Quality Control"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this form..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="requires-approval"
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
                <Label htmlFor="requires-approval">Requires supervisor approval</Label>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add tags..."
                  />
                  <Button type="button" onClick={handleAddTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          size={14}
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Next: Add Sections
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Step 2: Form Sections</h3>
                <Button onClick={handleAddSection} size="sm" className="gap-2">
                  <Plus size={16} />
                  Add Section
                </Button>
              </div>

              {sections.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No sections yet</p>
                    <Button onClick={handleAddSection}>
                      <Plus size={18} />
                      Add First Section
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, sectionIndex) => (
                    <Card key={section.section_id}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-3">
                            <Input
                              value={section.title}
                              onChange={(e) => handleUpdateSection(section.section_id, { title: e.target.value })}
                              placeholder="Section Title *"
                              className="font-semibold"
                            />
                            <Input
                              value={section.description || ''}
                              onChange={(e) => handleUpdateSection(section.section_id, { description: e.target.value })}
                              placeholder="Section Description (optional)"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveSection(sectionIndex, 'up')}
                              disabled={sectionIndex === 0}
                            >
                              <ArrowUp size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveSection(sectionIndex, 'down')}
                              disabled={sectionIndex === sections.length - 1}
                            >
                              <ArrowDown size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSection(section.section_id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Fields</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddField(section.section_id)}
                              className="gap-2"
                            >
                              <Plus size={14} />
                              Add Field
                            </Button>
                          </div>

                          {section.fields.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No fields yet - click "Add Field" to get started
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {section.fields.map((field) => (
                                <div key={field.field_id} className="border rounded p-3 space-y-2 bg-muted/30">
                                  <div className="flex gap-2">
                                    <Input
                                      value={field.label}
                                      onChange={(e) => handleUpdateField(section.section_id, field.field_id, { label: e.target.value })}
                                      placeholder="Field Label *"
                                      className="flex-1"
                                    />
                                    <Select
                                      value={field.field_type}
                                      onValueChange={(value: FormFieldType) => 
                                        handleUpdateField(section.section_id, field.field_id, { field_type: value })
                                      }
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fieldTypes.map(type => (
                                          <SelectItem key={type} value={type}>
                                            {type}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={field.required}
                                        onCheckedChange={(checked) =>
                                          handleUpdateField(section.section_id, field.field_id, { required: checked })
                                        }
                                      />
                                      <span className="text-sm">Required</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveField(section.section_id, field.field_id)}
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </div>
                                  {(field.field_type === 'select' || field.field_type === 'radio') && (
                                    <Input
                                      value={field.options?.join(', ') || ''}
                                      onChange={(e) => 
                                        handleUpdateField(section.section_id, field.field_id, { 
                                          options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                                        })
                                      }
                                      placeholder="Options (comma-separated)"
                                      className="text-sm"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    {editingTemplate ? 'Save Changes' : 'Create Form Template'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
