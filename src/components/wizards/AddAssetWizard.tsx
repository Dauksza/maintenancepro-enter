import { useState } from 'react'
import type { Asset, AssetStatus, AssetCategory, Area, Skill, Employee } from '@/lib/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Package, ArrowRight, ArrowLeft, CheckCircle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AddAssetWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (asset: Asset) => void
  areas: Area[]
  skills: Skill[]
  employees: Employee[]
}

type WizardStep = 'basic' | 'classification' | 'assignments' | 'requirements' | 'review'

export function AddAssetWizard({
  open,
  onClose,
  onComplete,
  areas,
  skills,
  employees
}: AddAssetWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [assetName, setAssetName] = useState('')
  const [assetType, setAssetType] = useState('')
  const [category, setCategory] = useState<AssetCategory>('Equipment')
  const [status, setStatus] = useState<AssetStatus>('Operational')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [warrantyExpiry, setWarrantyExpiry] = useState('')
  const [areaId, setAreaId] = useState<string | null>(null)
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([])
  const [requiredSkillIds, setRequiredSkillIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const steps: WizardStep[] = ['basic', 'classification', 'assignments', 'requirements', 'review']
  const stepIndex = steps.indexOf(currentStep)
  const progress = ((stepIndex + 1) / steps.length) * 100

  const stepTitles: Record<WizardStep, string> = {
    basic: 'Basic Information',
    classification: 'Classification',
    assignments: 'Area & Employees',
    requirements: 'Skill Requirements',
    review: 'Review & Confirm'
  }

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        return assetName.trim() !== '' && assetType.trim() !== ''
      case 'classification':
        return true
      case 'assignments':
        return true
      case 'requirements':
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

  const toggleEmployee = (employeeId: string) => {
    setAssignedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const toggleSkill = (skillId: string) => {
    setRequiredSkillIds(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleComplete = () => {
    if (!validateStep('basic')) {
      toast.error('Please complete all required fields')
      return
    }

    const newAsset: Asset = {
      asset_id: `AST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      asset_name: assetName.trim(),
      asset_type: assetType.trim(),
      category,
      status,
      area_id: areaId,
      assigned_employee_ids: assignedEmployeeIds,
      required_skill_ids: requiredSkillIds,
      maintenance_task_ids: [],
      linked_sop_ids: [],
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serial_number: serialNumber.trim(),
      purchase_date: purchaseDate || null,
      warranty_expiry: warrantyExpiry || null,
      availability_windows: [],
      notes: notes.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onComplete(newAsset)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setCurrentStep('basic')
    setAssetName('')
    setAssetType('')
    setCategory('Equipment')
    setStatus('Operational')
    setManufacturer('')
    setModel('')
    setSerialNumber('')
    setPurchaseDate('')
    setWarrantyExpiry('')
    setAreaId(null)
    setAssignedEmployeeIds([])
    setRequiredSkillIds([])
    setNotes('')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Asset Name *</Label>
              <Input
                id="assetName"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g., Forklift #1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type *</Label>
              <Input
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                placeholder="e.g., Electric Forklift"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as AssetCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Tool">Tool</SelectItem>
                    <SelectItem value="Instrument">Instrument</SelectItem>
                    <SelectItem value="Facility">Facility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as AssetStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
                    <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'classification':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g., Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., 8FBN25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., SN123456789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 'assignments':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area">Assign to Area</Label>
              <Select value={areaId || ''} onValueChange={setAreaId}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="Select an area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_name} ({area.zone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Employees (Optional)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees available</p>
                ) : (
                  employees.map(emp => (
                    <div key={emp.employee_id} className="flex items-center gap-2">
                      <Checkbox
                        id={`emp-${emp.employee_id}`}
                        checked={assignedEmployeeIds.includes(emp.employee_id)}
                        onCheckedChange={() => toggleEmployee(emp.employee_id)}
                      />
                      <Label htmlFor={`emp-${emp.employee_id}`} className="flex-1 cursor-pointer">
                        {emp.first_name} {emp.last_name} - {emp.department}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )

      case 'requirements':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Required Skills (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Select skills required to operate or maintain this asset
              </p>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills defined yet</p>
                ) : (
                  skills.map(skill => (
                    <div key={skill.skill_id} className="flex items-center gap-2">
                      <Checkbox
                        id={`skill-${skill.skill_id}`}
                        checked={requiredSkillIds.includes(skill.skill_id)}
                        onCheckedChange={() => toggleSkill(skill.skill_id)}
                      />
                      <Label htmlFor={`skill-${skill.skill_id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{skill.skill_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({skill.skill_category})</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about this asset..."
                rows={4}
              />
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-muted-foreground">Asset Name</Label>
                <p className="font-semibold">{assetName}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{assetType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={status === 'Operational' ? 'default' : 'secondary'}>
                    {status}
                  </Badge>
                </div>
                {manufacturer && (
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="font-medium">{manufacturer}</p>
                  </div>
                )}
              </div>
              {serialNumber && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Serial Number</Label>
                    <p className="font-medium font-mono">{serialNumber}</p>
                  </div>
                </>
              )}
              {areaId && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Area</Label>
                    <p className="font-medium">{areas.find(a => a.area_id === areaId)?.area_name}</p>
                  </div>
                </>
              )}
              {assignedEmployeeIds.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Assigned Employees</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {assignedEmployeeIds.map(empId => {
                        const emp = employees.find(e => e.employee_id === empId)
                        return emp ? (
                          <Badge key={empId} variant="secondary">
                            {emp.first_name} {emp.last_name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                </>
              )}
              {requiredSkillIds.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Required Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {requiredSkillIds.map(skillId => {
                        const skill = skills.find(s => s.skill_id === skillId)
                        return skill ? (
                          <Badge key={skillId} variant="outline">
                            {skill.skill_name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={24} weight="duotone" />
            Add New Asset
          </DialogTitle>
          <DialogDescription>
            Step {stepIndex + 1} of {steps.length}: {stepTitles[currentStep]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="h-2" />
          
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            <ArrowLeft size={18} />
            Back
          </Button>

          {currentStep !== 'review' ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle size={18} />
              Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
