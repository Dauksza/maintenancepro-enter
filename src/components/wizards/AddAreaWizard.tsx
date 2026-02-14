import { useState } from 'react'
import type { Area, Employee } from '@/lib/types'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, ArrowLeft, CheckCircle, MapPin, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AddAreaWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (area: Area) => void
  existingDepartments: string[]
  existingZones: string[]
  employees: Employee[]
}

type WizardStep = 'basic' | 'assignments' | 'capacity' | 'review'

export function AddAreaWizard({
  open,
  onClose,
  onComplete,
  existingDepartments,
  existingZones,
  employees
}: AddAreaWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [areaName, setAreaName] = useState('')
  const [department, setDepartment] = useState('')
  const [customDepartment, setCustomDepartment] = useState('')
  const [zone, setZone] = useState('')
  const [customZone, setCustomZone] = useState('')
  const [notes, setNotes] = useState('')
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([])
  const [capacityHoursPerDay, setCapacityHoursPerDay] = useState('40')

  const steps: WizardStep[] = ['basic', 'assignments', 'capacity', 'review']
  const stepIndex = steps.indexOf(currentStep)
  const progress = ((stepIndex + 1) / steps.length) * 100

  const stepTitles: Record<WizardStep, string> = {
    basic: 'Basic Information',
    assignments: 'Employee Assignments',
    capacity: 'Capacity Settings',
    review: 'Review & Confirm'
  }

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        return areaName.trim() !== '' && 
               (department !== '' || customDepartment.trim() !== '') &&
               (zone !== '' || customZone.trim() !== '')
      case 'assignments':
        return true
      case 'capacity':
        return capacityHoursPerDay !== '' && parseInt(capacityHoursPerDay) > 0
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

  const handleSubmit = () => {
    if (!validateStep('basic')) {
      toast.error('Please complete all required fields')
      return
    }

    const finalDepartment = department || customDepartment
    const finalZone = zone || customZone
    const now = new Date().toISOString()

    const newArea: Area = {
      area_id: `AREA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      area_name: areaName,
      department: finalDepartment,
      zone: finalZone,
      parent_area_id: null,
      assigned_employee_ids: assignedEmployeeIds,
      asset_ids: [],
      priority_task_ids: [],
      capacity_hours_per_day: parseInt(capacityHoursPerDay) || 40,
      notes,
      created_at: now,
      updated_at: now
    }

    onComplete(newArea)
    toast.success('Area added successfully')
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setCurrentStep('basic')
    setAreaName('')
    setDepartment('')
    setCustomDepartment('')
    setZone('')
    setCustomZone('')
    setNotes('')
    setAssignedEmployeeIds([])
    setCapacityHoursPerDay('40')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area-name">Area Name *</Label>
              <Input
                id="area-name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Production Floor A"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select or create" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom Department</SelectItem>
                  </SelectContent>
                </Select>
                {department === '__custom__' && (
                  <Input
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Enter department name"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone *</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger id="zone">
                    <SelectValue placeholder="Select or create" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingZones.map((z) => (
                      <SelectItem key={z} value={z}>
                        {z}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom Zone</SelectItem>
                  </SelectContent>
                </Select>
                {zone === '__custom__' && (
                  <Input
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    placeholder="Enter zone name"
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this area"
                rows={3}
              />
            </div>
          </div>
        )

      case 'assignments':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Assign Employees to this Area</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select employees who will work in this area. They will be prioritized for work orders in this location.
              </p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-4">
              {employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No employees available. Add employees first.
                </p>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.employee_id}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={assignedEmployeeIds.includes(employee.employee_id)}
                        onCheckedChange={() => toggleEmployee(employee.employee_id)}
                      />
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • {employee.department}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{employee.status}</Badge>
                  </div>
                ))
              )}
            </div>

            {assignedEmployeeIds.length > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  {assignedEmployeeIds.length} employee{assignedEmployeeIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        )

      case 'capacity':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Daily Capacity (Hours) *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacityHoursPerDay}
                onChange={(e) => setCapacityHoursPerDay(e.target.value)}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground">
                Total available work hours per day for this area, across all assigned employees
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> This capacity helps the auto-scheduler distribute work appropriately. It represents the total manhours available for this area each day.
              </p>
            </div>
          </div>
        )

      case 'review':
        const assignedEmployees = employees.filter(e => assignedEmployeeIds.includes(e.employee_id))
        const finalDepartment = department === '__custom__' ? customDepartment : department
        const finalZone = zone === '__custom__' ? customZone : zone

        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Review Area Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area Name:</span>
                  <span className="font-medium">{areaName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{finalDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zone:</span>
                  <span className="font-medium">{finalZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Capacity:</span>
                  <span className="font-medium">{capacityHoursPerDay} hours</span>
                </div>
                {notes && (
                  <div className="flex flex-col gap-1 pt-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="font-medium text-xs">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            {assignedEmployees.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Assigned Employees ({assignedEmployees.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {assignedEmployees.map((emp) => (
                    <Badge key={emp.employee_id} variant="secondary">
                      {emp.first_name} {emp.last_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
          <DialogTitle>Add New Area</DialogTitle>
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
                Create Area
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
