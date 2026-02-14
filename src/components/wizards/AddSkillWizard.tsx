import { useState } from 'react'
import type { Skill } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, ArrowLeft, CheckCircle, Certificate } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AddSkillWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (skill: Skill) => void
  existingCategories: string[]
}

type WizardStep = 'basic' | 'certification' | 'links' | 'review'

export function AddSkillWizard({
  open,
  onClose,
  onComplete,
  existingCategories
}: AddSkillWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [skillName, setSkillName] = useState('')
  const [skillCategory, setSkillCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [requiresCertification, setRequiresCertification] = useState(false)
  const [certificationDuration, setCertificationDuration] = useState('')

  const steps: WizardStep[] = ['basic', 'certification', 'links', 'review']
  const stepIndex = steps.indexOf(currentStep)
  const progress = ((stepIndex + 1) / steps.length) * 100

  const stepTitles: Record<WizardStep, string> = {
    basic: 'Basic Information',
    certification: 'Certification Requirements',
    links: 'Linked SOPs & Assets',
    review: 'Review & Confirm'
  }

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        return skillName.trim() !== '' && (skillCategory !== '' || customCategory.trim() !== '')
      case 'certification':
        return !requiresCertification || (certificationDuration !== '' && parseInt(certificationDuration) > 0)
      case 'links':
        return true
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }
    const nextIndex = stepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const handleSubmit = () => {
    if (!validateStep('basic')) {
      toast.error('Please complete all required fields')
      return
    }

    const category = skillCategory || customCategory
    const now = new Date().toISOString()

    const newSkill: Skill = {
      skill_id: `SKILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      skill_name: skillName,
      skill_category: category,
      description,
      requires_certification: requiresCertification,
      certification_duration_days: requiresCertification ? parseInt(certificationDuration) || null : null,
      linked_sop_ids: [],
      required_for_asset_ids: [],
      required_for_task_ids: [],
      created_at: now,
      updated_at: now
    }

    onComplete(newSkill)
    toast.success('Skill added successfully')
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setCurrentStep('basic')
    setSkillName('')
    setSkillCategory('')
    setCustomCategory('')
    setDescription('')
    setRequiresCertification(false)
    setCertificationDuration('')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name *</Label>
              <Input
                id="skill-name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., Hydraulic Systems Maintenance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Skill Category *</Label>
              <Select value={skillCategory} onValueChange={setSkillCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select or enter custom category" />
                </SelectTrigger>
                <SelectContent>
                  {existingCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {skillCategory === '__custom__' && (
              <div className="space-y-2">
                <Label htmlFor="custom-category">Custom Category *</Label>
                <Input
                  id="custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this skill"
                rows={3}
              />
            </div>
          </div>
        )

      case 'certification':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Certificate size={24} className="text-primary" />
                <div>
                  <p className="font-medium">Requires Certification</p>
                  <p className="text-sm text-muted-foreground">
                    Does this skill require formal certification?
                  </p>
                </div>
              </div>
              <Switch
                checked={requiresCertification}
                onCheckedChange={setRequiresCertification}
              />
            </div>

            {requiresCertification && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cert-duration">Certification Duration (Days) *</Label>
                  <Input
                    id="cert-duration"
                    type="number"
                    min="1"
                    value={certificationDuration}
                    onChange={(e) => setCertificationDuration(e.target.value)}
                    placeholder="e.g., 730 (2 years)"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many days is this certification valid before renewal is required?
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> The system will automatically generate certification renewal reminders based on this duration and notify employees when certifications are expiring.
                  </p>
                </div>
              </div>
            )}

            {!requiresCertification && (
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                <p>This skill will not require certification tracking.</p>
              </div>
            )}
          </div>
        )

      case 'links':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Coming Soon:</strong> Link this skill to SOPs and Assets after creation from the Assets & Skills management screens.
              </p>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Review Skill Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skill Name:</span>
                  <span className="font-medium">{skillName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{skillCategory === '__custom__' ? customCategory : skillCategory}</span>
                </div>
                {description && (
                  <div className="flex flex-col gap-1 pt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="font-medium">{description}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requires Certification:</span>
                  <span className="font-medium">{requiresCertification ? 'Yes' : 'No'}</span>
                </div>
                {requiresCertification && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Certification Duration:</span>
                    <span className="font-medium">{certificationDuration} days</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
          <DialogDescription>
            Step {stepIndex + 1} of {steps.length}: {stepTitles[currentStep]}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="py-4">{renderStepContent()}</div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <CheckCircle size={16} className="mr-2" />
                Create Skill
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
