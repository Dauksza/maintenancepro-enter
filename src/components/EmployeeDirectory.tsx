import { useState } from 'react'
import type { Employee } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Phone, 
  EnvelopeSimple, 
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  UserCircle
} from '@phosphor-icons/react'
import { getEmployeeFullName } from '@/lib/employee-utils'

interface EmployeeDirectoryProps {
  employees: Employee[]
  onSelectEmployee: (employee: Employee) => void
  onAddEmployee: (employee: Employee) => void
}

export function EmployeeDirectory({
  employees,
  onSelectEmployee,
  onAddEmployee
}: EmployeeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const departments = Array.from(new Set(employees.map(e => e.department)))
  const statuses = Array.from(new Set(employees.map(e => e.status)))

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      getEmployeeFullName(employee).toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

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

  const getInitials = (employee: Employee) => {
    return `${employee.first_name[0]}${employee.last_name[0]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <Card 
            key={employee.employee_id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectEmployee(employee)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 bg-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(employee)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {getEmployeeFullName(employee)}
                  </CardTitle>
                  <CardDescription className="text-sm truncate">
                    {employee.position}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {employee.shift}
                </Badge>
              </div>
              
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EnvelopeSimple size={16} />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={16} />
                  <span>{employee.phone}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium">Department</div>
                  <div>{employee.department}</div>
                </div>
              </div>

              {employee.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {employee.certifications.slice(0, 2).map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                  {employee.certifications.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.certifications.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-card border rounded-lg p-12 text-center">
          <UserCircle size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Employees Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  )
}
