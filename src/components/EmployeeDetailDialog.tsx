import { useState } from 'react'
import type { Employee, SkillMatrixEntry, EmployeeSchedule } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Phone, 
  EnvelopeSimple, 
  Calendar, 
  Certificate,
  User,
  Briefcase,
  Clock,
  PencilSimple
} from '@phosphor-icons/react'
import { getEmployeeFullName } from '@/lib/employee-utils'
import { EditEmployeeDialog } from './EditEmployeeDialog'

interface EmployeeDetailDialogProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Employee>) => void
  skillMatrix: SkillMatrixEntry[]
  schedules: EmployeeSchedule[]
  existingDepartments?: string[]
  existingPositions?: string[]
}

export function EmployeeDetailDialog({
  employee,
  open,
  onClose,
  onUpdate,
  skillMatrix,
  schedules,
  existingDepartments = [],
  existingPositions = []
}: EmployeeDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false)
  
  if (!employee) return null

  const getInitials = (emp: Employee) => {
    return `${emp.first_name[0]}${emp.last_name[0]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Advanced':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Intermediate':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Beginner':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const recentSchedules = schedules
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)

  const totalHoursThisWeek = recentSchedules.reduce((sum, s) => sum + s.hours, 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                  {getInitials(employee)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl">{getEmployeeFullName(employee)}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {employee.position} • {employee.department}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                  <Badge variant="secondary">{employee.shift}</Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setEditOpen(true)}
              >
                <PencilSimple size={16} />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Contact Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <EnvelopeSimple size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium">{employee.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{employee.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Department</div>
                    <div className="font-medium">{employee.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Employee ID</div>
                    <div className="font-medium font-mono">{employee.employee_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Hire Date</div>
                    <div className="font-medium">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{employee.emergency_contact_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="font-medium">{employee.emergency_contact_phone}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Certificate size={18} />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      {cert}
                    </Badge>
                  ))}
                  {employee.certifications.length === 0 && (
                    <div className="text-sm text-muted-foreground">No certifications on file</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skill Competencies</CardTitle>
                <CardDescription>
                  Current skill levels and certification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillMatrix.length > 0 ? (
                  <div className="space-y-3">
                    {skillMatrix.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{skill.skill_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {skill.skill_category}
                          </div>
                          {skill.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {skill.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                          {skill.certified && (
                            <Certificate size={18} className="text-green-600" weight="fill" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No skills recorded for this employee
                  </div>
                )}
              </CardContent>
            </Card>

            {skillMatrix.some(s => s.certified && s.expiry_date) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certification Expiry Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {skillMatrix
                      .filter(s => s.certified && s.expiry_date)
                      .map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="font-medium">{skill.skill_name}</div>
                          <div className="text-muted-foreground">
                            Expires {new Date(skill.expiry_date!).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{totalHoursThisWeek}h</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Default Shift</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{employee.shift}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Schedule</CardTitle>
                <CardDescription>Last 7 scheduled days</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {recentSchedules.map((schedule, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(schedule.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            {schedule.notes && (
                              <div className="text-xs text-muted-foreground">{schedule.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{schedule.shift_start} - {schedule.shift_end}</div>
                          <div className="text-xs text-muted-foreground">{schedule.hours} hours</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No schedule information available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <EditEmployeeDialog
      employee={employee}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onSave={onUpdate}
      existingDepartments={existingDepartments}
      existingPositions={existingPositions}
    />
  </>
  )
}
