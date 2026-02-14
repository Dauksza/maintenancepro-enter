import { useState, useMemo } from 'react'
import type { Employee, SkillMatrixEntry, EmployeeSchedule, Message, WorkOrder } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Phone, 
  Calendar, 
  Certificate,
  ChartBar,
  ChatCircle,
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  UserPlus
} from '@phosphor-icons/react'
import { EmployeeDirectory } from './EmployeeDirectory'
import { SkillMatrix } from './SkillMatrix'
import { EmployeeScheduleView } from './EmployeeScheduleView'
import { EmployeeAnalyticsDashboard } from './EmployeeAnalyticsDashboard'
import { MessagingSystem } from './MessagingSystem'
import { EmployeeDetailDialog } from './EmployeeDetailDialog'
import { AddEmployeeWizard } from './wizards/AddEmployeeWizard'

interface EmployeeManagementProps {
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  schedules: EmployeeSchedule[]
  messages: Message[]
  workOrders: WorkOrder[]
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => void
  onAddEmployee: (employee: Employee) => void
  onUpdateSkill: (employeeId: string, skill: SkillMatrixEntry) => void
  onUpdateSchedule: (scheduleId: string, updates: Partial<EmployeeSchedule>) => void
  onSendMessage: (message: Message) => void
}

export function EmployeeManagement({
  employees,
  skillMatrix,
  schedules,
  messages,
  workOrders,
  onUpdateEmployee,
  onAddEmployee,
  onUpdateSkill,
  onUpdateSchedule,
  onSendMessage
}: EmployeeManagementProps) {
  const [activeTab, setActiveTab] = useState('directory')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addWizardOpen, setAddWizardOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDetailOpen(true)
  }

  const handleAddEmployeeComplete = (employee: Employee) => {
    onAddEmployee(employee)
    setAddWizardOpen(false)
  }

  const activeEmployees = employees.filter(e => e.status === 'Active')
  const totalEmployees = employees.length

  const existingDepartments = useMemo(() => 
    Array.from(new Set(employees.map(e => e.department))).sort(),
    [employees]
  )

  const existingPositions = useMemo(() => 
    Array.from(new Set(employees.map(e => e.position))).sort(),
    [employees]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Employee Management</h2>
          <p className="text-muted-foreground">
            Manage team members, skills, schedules, and internal communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setAddWizardOpen(true)}
            className="gap-2"
          >
            <UserPlus size={18} weight="bold" />
            Add Employee
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            <Users size={20} className="text-primary" weight="fill" />
            <div className="text-sm">
              <div className="font-semibold">{totalEmployees}</div>
              <div className="text-muted-foreground text-xs">Total Team</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            <Users size={20} className="text-green-600" weight="fill" />
            <div className="text-sm">
              <div className="font-semibold">{activeEmployees.length}</div>
              <div className="text-muted-foreground text-xs">Active</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users size={18} />
            Directory
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Certificate size={18} />
            Skills Matrix
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar size={18} />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <ChartBar size={18} />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <ChatCircle size={18} />
            Messages
            {messages.filter(m => !m.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                {messages.filter(m => !m.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6 animate-fade-in">
          <EmployeeDirectory
            employees={employees}
            onSelectEmployee={handleSelectEmployee}
            onAddEmployee={onAddEmployee}
          />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6 animate-fade-in">
          <SkillMatrix
            employees={employees}
            skillMatrix={skillMatrix}
            onUpdateSkill={onUpdateSkill}
            onSelectEmployee={handleSelectEmployee}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 animate-fade-in">
          <EmployeeScheduleView
            employees={employees}
            schedules={schedules}
            onUpdateSchedule={onUpdateSchedule}
            onSelectEmployee={handleSelectEmployee}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 animate-fade-in">
          <EmployeeAnalyticsDashboard
            employees={employees}
            skillMatrix={skillMatrix}
            workOrders={workOrders}
          />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6 animate-fade-in">
          <MessagingSystem
            employees={employees}
            messages={messages}
            onSendMessage={onSendMessage}
          />
        </TabsContent>
      </Tabs>

      <EmployeeDetailDialog
        employee={selectedEmployee}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedEmployee(null)
        }}
        onUpdate={onUpdateEmployee}
        skillMatrix={skillMatrix.filter(s => s.employee_id === selectedEmployee?.employee_id)}
        schedules={schedules.filter(s => s.employee_id === selectedEmployee?.employee_id)}
        existingDepartments={existingDepartments}
        existingPositions={existingPositions}
      />

      <AddEmployeeWizard
        open={addWizardOpen}
        onClose={() => setAddWizardOpen(false)}
        onComplete={handleAddEmployeeComplete}
        existingDepartments={existingDepartments}
        existingPositions={existingPositions}
      />
    </div>
  )
}
