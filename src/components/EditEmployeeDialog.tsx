import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FloppyDisk, X, UserCircleGear } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface EditEmployeeDialogProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<Employee>) => void
  existingDepartments: string[]
  existingPositions: string[]
}

export function EditEmployeeDialog({
  employee,
  open,
  onClose,
  onSave,
  existingDepartments,
  existingPositions
}: EditEmployeeDialogProps) {
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
  const [hireDate, setHireDate] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCertification, setNewCertification] = useState('')

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name)
      setLastName(employee.last_name)
      setEmail(employee.email)
      setPhone(employee.phone)
      
      if (existingPositions.includes(employee.position)) {
        setPosition(employee.position)
        setCustomPosition('')
      } else {
        setPosition('custom')
        setCustomPosition(employee.position)
      }
      
      if (existingDepartments.includes(employee.department)) {
        setDepartment(employee.department)
        setCustomDepartment('')
      } else {
        setDepartment('custom')
        setCustomDepartment(employee.department)
      }
      
      setStatus(employee.status)
      setShift(employee.shift)
      setHireDate(employee.hire_date)
      setEmergencyContactName(employee.emergency_contact_name)
      setEmergencyContactPhone(employee.emergency_contact_phone)
      setCertifications(employee.certifications || [])
    }
  }, [employee, existingDepartments, existingPositions])

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()])
      setNewCertification('')
    }
  }

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!employee) return

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const finalPosition = position === 'custom' ? customPosition : position
    const finalDepartment = department === 'custom' ? customDepartment : department

    if (!finalPosition || !finalDepartment) {
      toast.error('Please select or enter a position and department')
      return
    }

    const updates: Partial<Employee> = {
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
      updated_at: new Date().toISOString()
    }

    onSave(employee.employee_id, updates)
    onClose()
  }

  if (!employee) return null

  const getInitials = (emp: Employee) => {
    return `${emp.first_name[0]}${emp.last_name[0]}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {getInitials(employee)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <UserCircleGear size={28} weight="duotone" />
                Edit Employee
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Update employee information and details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Employment Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger id="edit-position">
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
                <Label htmlFor="edit-department">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="edit-department">
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
                  <Label htmlFor="edit-status">Employment Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as EmployeeStatus)}>
                    <SelectTrigger id="edit-status">
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
                  <Label htmlFor="edit-shift">Shift</Label>
                  <Select value={shift} onValueChange={(val) => setShift(val as ShiftType)}>
                    <SelectTrigger id="edit-shift">
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
                <Label htmlFor="edit-hireDate">Hire Date</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyName">Emergency Contact Name *</Label>
                <Input
                  id="edit-emergencyName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyPhone">Emergency Contact Phone *</Label>
                <Input
                  id="edit-emergencyPhone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Certifications (Optional)</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="e.g., Forklift Operator"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                />
                <Button onClick={handleAddCertification} type="button">
                  Add
                </Button>
              </div>

              {certifications.length > 0 && (
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
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <FloppyDisk size={18} />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
