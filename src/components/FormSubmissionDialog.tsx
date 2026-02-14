import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FormTemplate, FormSubmission, FormFieldResponse, HazardLevel } from '@/lib/types'
import { calculateFormScore, identifyIssues, generateCorrectiveActions } from '@/lib/form-utils'
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FormSubmissionDialogProps {
  open: boolean
  onClose: () => void
  template: FormTemplate
  submission: FormSubmission | null
  onCreateSubmission: (submission: FormSubmission) => void
  onUpdateSubmission: (submissionId: string, updates: Partial<FormSubmission>) => void
}

export function FormSubmissionDialog({
  open,
  onClose,
  template,
  submission,
  onCreateSubmission,
  onUpdateSubmission,
}: FormSubmissionDialogProps) {
  const [responses, setResponses] = useState<Record<string, FormFieldResponse>>({})
  const [isReadOnly] = useState(!!submission && submission.status === 'Completed')

  useEffect(() => {
    if (submission) {
      setResponses(submission.field_responses)
    } else {
      setResponses({})
    }
  }, [submission])

  const handleFieldChange = (fieldId: string, fieldLabel: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: {
        field_id: fieldId,
        field_label: fieldLabel,
        value,
        answered_at: new Date().toISOString()
      }
    }))
  }

  const handleSaveDraft = () => {
    if (submission) {
      onUpdateSubmission(submission.submission_id, {
        field_responses: responses,
        updated_at: new Date().toISOString()
      })
      toast.success('Draft saved')
    } else {
      const newSubmission: FormSubmission = {
        submission_id: `sub-${Date.now()}`,
        template_id: template.template_id,
        template_name: template.template_name,
        submitted_by: 'current-user',
        submitted_by_name: 'Current User',
        submission_date: new Date().toISOString(),
        status: 'In Progress',
        field_responses: responses,
        signatures: [],
        attachments: [],
        approval_history: [],
        issues_identified: 0,
        corrective_actions_required: [],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      onCreateSubmission(newSubmission)
      toast.success('Draft saved')
      onClose()
    }
  }

  const handleSubmit = () => {
    const requiredFields = template.sections.flatMap(s => 
      s.fields.filter(f => f.required).map(f => f.field_id)
    )

    const missingFields = requiredFields.filter(fieldId => !responses[fieldId]?.value)

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields (${missingFields.length} missing)`)
      return
    }

    const tempSubmission: FormSubmission = {
      submission_id: submission?.submission_id || `sub-${Date.now()}`,
      template_id: template.template_id,
      template_name: template.template_name,
      submitted_by: 'current-user',
      submitted_by_name: 'Current User',
      submission_date: new Date().toISOString(),
      status: 'Completed',
      field_responses: responses,
      signatures: [],
      attachments: [],
      approval_history: [],
      issues_identified: 0,
      corrective_actions_required: [],
      notes: '',
      created_at: submission?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }

    const score = calculateFormScore(tempSubmission)
    const issues = identifyIssues(tempSubmission)
    const actions = generateCorrectiveActions(tempSubmission)

    const finalSubmission = {
      ...tempSubmission,
      score,
      issues_identified: issues.length,
      corrective_actions_required: actions
    }

    if (submission) {
      onUpdateSubmission(submission.submission_id, finalSubmission)
    } else {
      onCreateSubmission(finalSubmission)
    }

    toast.success('Form submitted successfully')
    onClose()
  }

  const renderField = (sectionId: string, field: any) => {
    const value = responses[field.field_id]?.value

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            placeholder={field.description}
            disabled={isReadOnly}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            placeholder={field.description}
            rows={4}
            disabled={isReadOnly}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, parseFloat(e.target.value))}
            placeholder={field.description}
            min={field.validation?.min}
            max={field.validation?.max}
            disabled={isReadOnly}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            disabled={isReadOnly}
          />
        )

      case 'time':
        return (
          <Input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            disabled={isReadOnly}
          />
        )

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            disabled={isReadOnly}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => handleFieldChange(field.field_id, field.label, checked)}
              disabled={isReadOnly}
            />
            <span className="text-sm">{field.description || 'Yes'}</span>
          </div>
        )

      case 'radio':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(val) => handleFieldChange(field.field_id, field.label, val)}
            disabled={isReadOnly}
          >
            {field.options?.map((option: string) => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${field.field_id}-${option}`} />
                <Label htmlFor={`${field.field_id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => handleFieldChange(field.field_id, field.label, val)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={value === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFieldChange(field.field_id, field.label, rating)}
                disabled={isReadOnly}
              >
                {rating}
              </Button>
            ))}
          </div>
        )

      case 'hazard-level':
        const hazardLevels: HazardLevel[] = ['Low', 'Medium', 'High', 'Extreme']
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => handleFieldChange(field.field_id, field.label, val)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select hazard level" />
            </SelectTrigger>
            <SelectContent>
              {hazardLevels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.field_id, field.label, e.target.value)}
            disabled={isReadOnly}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.template_name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{template.template_type}</Badge>
            <Badge variant="outline">{template.category}</Badge>
            {template.requires_approval && (
              <Badge variant="secondary">Requires Approval</Badge>
            )}
            {isReadOnly && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Completed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {template.sections.map((section) => (
            <Card key={section.section_id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.field_id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                    {renderField(section.section_id, field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
                <FloppyDisk size={18} />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                <CheckCircle size={18} weight="fill" />
                Submit Form
              </Button>
            </div>
          )}

          {isReadOnly && submission && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Score</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          (submission.score || 0) >= 80 ? 'bg-green-600' :
                          (submission.score || 0) >= 60 ? 'bg-amber-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${submission.score || 0}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold">{submission.score || 0}%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Issues Identified</Label>
                  <div className="text-2xl font-bold mt-1">
                    {submission.issues_identified}
                  </div>
                </div>
              </div>

              {submission.corrective_actions_required.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Corrective Actions Required</Label>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {submission.corrective_actions_required.map((action, i) => (
                      <li key={i} className="text-sm">{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
