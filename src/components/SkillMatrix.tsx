import { useState } from 'react'
import type { Employee, SkillMatrixEntry, SkillLevel } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Certificate, MagnifyingGlass, Warning, CheckCircle } from '@phosphor-icons/react'
import { getEmployeeFullName } from '@/lib/employee-utils'

interface SkillMatrixProps {
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  onUpdateSkill: (employeeId: string, skill: SkillMatrixEntry) => void
  onSelectEmployee: (employee: Employee) => void
}

export function SkillMatrix({
  employees,
  skillMatrix,
  onUpdateSkill,
  onSelectEmployee
}: SkillMatrixProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = Array.from(new Set(skillMatrix.map(s => s.skill_category)))
  const skills = Array.from(new Set(skillMatrix.map(s => s.skill_name)))

  const filteredSkills = skills.filter(skill => 
    categoryFilter === 'all' || 
    skillMatrix.find(s => s.skill_name === skill)?.skill_category === categoryFilter
  ).filter(skill =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSkillLevel = (employeeId: string, skillName: string): SkillMatrixEntry | undefined => {
    return skillMatrix.find(s => s.employee_id === employeeId && s.skill_name === skillName)
  }

  const getLevelColor = (level: SkillLevel) => {
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
        return 'bg-gray-50 text-gray-400 border-gray-100'
    }
  }

  const getCertificationStatus = () => {
    const now = new Date()
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    
    const expiringSoon = skillMatrix.filter(s => {
      if (!s.expiry_date) return false
      const expiryDate = new Date(s.expiry_date)
      return expiryDate > now && expiryDate <= threeMonthsFromNow
    })

    const expired = skillMatrix.filter(s => {
      if (!s.expiry_date) return false
      const expiryDate = new Date(s.expiry_date)
      return expiryDate <= now
    })

    return { expiringSoon, expired }
  }

  const { expiringSoon, expired } = getCertificationStatus()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Skills Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{skills.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warning size={18} className="text-yellow-600" weight="fill" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Certifications in next 90 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" weight="fill" />
              Certified Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {skillMatrix.filter(s => s.certified).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active certifications
            </p>
          </CardContent>
        </Card>
      </div>

      {expired.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <Warning size={18} weight="fill" />
              Expired Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expired.slice(0, 5).map((skill, idx) => {
                const employee = employees.find(e => e.employee_id === skill.employee_id)
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">
                        {employee ? getEmployeeFullName(employee) : skill.employee_id}
                      </span>
                      {' - '}
                      <span className="text-muted-foreground">{skill.skill_name}</span>
                    </div>
                    <span className="text-xs text-destructive">
                      Expired {new Date(skill.expiry_date!).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
              {expired.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{expired.length - 5} more expired
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills Matrix</CardTitle>
          <CardDescription>
            Employee skill levels and certifications across all tracked competencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 sticky left-0 bg-card z-10">Employee</TableHead>
                  {filteredSkills.map(skill => (
                    <TableHead key={skill} className="min-w-32 text-center">
                      <div className="text-xs">{skill}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => e.status === 'Active').map(employee => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">
                      <button
                        onClick={() => onSelectEmployee(employee)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        {getEmployeeFullName(employee)}
                        <div className="text-xs text-muted-foreground">{employee.position}</div>
                      </button>
                    </TableCell>
                    {filteredSkills.map(skill => {
                      const skillEntry = getSkillLevel(employee.employee_id, skill)
                      return (
                        <TableCell key={skill} className="text-center">
                          {skillEntry ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className={`${getLevelColor(skillEntry.level)} text-xs`}
                              >
                                {skillEntry.level}
                              </Badge>
                              {skillEntry.certified && (
                                <Certificate size={14} className="text-green-600" weight="fill" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
