import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Employee, EmployeeStatus, ShiftType } from '@/lib/types'
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
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AddEmployeeWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (employee: Employee) => void
  existingDepartments: string[]
  existingPositions: string[]
}

type WizardStep = 'basic' | 'contact' | 'employment' | 'emergency' | 'certifications' | 'review'

export function AddEmployeeWizard({
  open,
  onClose,
  onComplete,
  existingDepartments,
  existingPositions
}: AddEmployeeWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [customPosition, setCustomPosition] = useState('')
  const [department, setDepartment] = useState('')
  const [customDepartment, setCustomDepartment] = useState('')
  const [status, setStatus] = useState<EmployeeStatus>('Active')
  const [shift, setShift] = useState<ShiftType>('Day Shift')
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0])
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCertification, setNewCertification] = useState('')

  const steps: WizardStep[] = ['basic', 'contact', 'employment', 'emergency', 'certifications', 'review']
  const stepIndex = steps.indexOf(currentStep)
  const progress = ((stepIndex + 1) / steps.length) * 100

  const stepTitles: Record<WizardStep, string> = {
    basic: 'Basic Information',
    contact: 'Contact Details',
    employment: 'Employment Information',
    emergency: 'Emergency Contact',
    certifications: 'Certifications',
    review: 'Review & Confirm'
  }

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        return firstName.trim() !== '' && lastName.trim() !== ''
      case 'contact':
        return email.trim() !== '' && phone.trim() !== ''
      case 'employment':
        return (position !== '' || customPosition.trim() !== '') && 
               (department !== '' || customDepartment.trim() !== '')
      case 'emergency':
        return emergencyContactName.trim() !== '' && emergencyContactPhone.trim() !== ''
      case 'certifications':
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

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()])
      setNewCertification('')
    }
  }

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    if (!validateStep('basic') || !validateStep('contact') || !validateStep('employment') || !validateStep('emergency')) {
      toast.error('Please complete all required fields')
      return
    }

    const finalPosition = position === 'custom' ? customPosition : position
    const finalDepartment = department === 'custom' ? customDepartment : department

    const newEmployee: Employee = {
      employee_id: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: finalPosition,
      department: finalDepartment,
      status,
      shift,
      hire_date: hireDate,
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_phone: emergencyContactPhone.trim(),
      certifications,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onComplete(newEmployee)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setCurrentStep('basic')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setPosition('')
    setCustomPosition('')
    setDepartment('')
    setCustomDepartment('')
    setStatus('Active')
    setShift('Day Shift')
    setHireDate(new Date().toISOString().split('T')[0])
    setEmergencyContactName('')
    setEmergencyContactPhone('')
    setCertifications([])
    setNewCertification('')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        )

      case 'employment':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {existingPositions.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add New Position</SelectItem>
                </SelectContent>
              </Select>
              {position === 'custom' && (
                <Input
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  placeholder="Enter new position"
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {existingDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add New Department</SelectItem>
                </SelectContent>
              </Select>
              {department === 'custom' && (
                <Input
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="Enter new department"
                  className="mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Employment Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as EmployeeStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select value={shift} onValueChange={(val) => setShift(val as ShiftType)}>
                  <SelectTrigger id="shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day Shift">Day Shift</SelectItem>
                    <SelectItem value="Night Shift">Night Shift</SelectItem>
                    <SelectItem value="Rotating">Rotating</SelectItem>
                    <SelectItem value="On Call">On Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
            </div>
          </div>
        )

      case 'emergency':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
              <Input
                id="emergencyName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="(555) 987-6543"
              />
            </div>
          </div>
        )

      case 'certifications':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCertification">Add Certifications (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="newCertification"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="e.g., Forklift Operator"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                />
                <Button onClick={handleAddCertification} type="button">
                  Add
                </Button>
              </div>
            </div>

            {certifications.length > 0 && (
              <div className="space-y-2">
                <Label>Current Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="gap-2">
                      {cert}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveCertification(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-semibold">{firstName} {lastName}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{phone}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Position</Label>
                  <p className="font-medium">{position === 'custom' ? customPosition : position}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{department === 'custom' ? customDepartment : department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Shift</Label>
                  <p className="font-medium">{shift}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Emergency Contact</Label>
                <p className="font-medium">{emergencyContactName} - {emergencyContactPhone}</p>
              </div>
              {certifications.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary">{cert}</Badge>
                      ))}
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
            <UserPlus size={24} weight="duotone" />
            Add New Employee
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
