import { useState } from 'react'
import type { Employee, EmployeeSchedule } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CaretLeft, CaretRight, Clock } from '@phosphor-icons/react'
import { getEmployeeFullName } from '@/lib/employee-utils'

interface EmployeeScheduleViewProps {
  employees: Employee[]
  schedules: EmployeeSchedule[]
  onUpdateSchedule: (scheduleId: string, updates: Partial<EmployeeSchedule>) => void
  onSelectEmployee: (employee: Employee) => void
}

export function EmployeeScheduleView({
  employees,
  schedules,
  onUpdateSchedule,
  onSelectEmployee
}: EmployeeScheduleViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const getWeekDates = (): Date[] => {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  const thisWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    setCurrentWeekStart(monday)
  }

  const getScheduleForDay = (employeeId: string, date: Date): EmployeeSchedule | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.find(s => s.employee_id === employeeId && s.date === dateStr)
  }

  const getShiftBadgeColor = (shiftStart: string) => {
    if (shiftStart.startsWith('08')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (shiftStart.startsWith('16')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (shiftStart.startsWith('00') || shiftStart === '00:00') return 'bg-gray-100 text-gray-800 border-gray-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTotalHours = (employeeId: string) => {
    const weekSchedules = weekDates.map(date => getScheduleForDay(employeeId, date))
    return weekSchedules.reduce((sum, schedule) => sum + (schedule?.hours || 0), 0)
  }

  const activeEmployees = employees.filter(e => e.status === 'Active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={previousWeek}>
            <CaretLeft size={18} />
          </Button>
          <div className="text-center min-w-64">
            <div className="font-semibold text-lg">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
              {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <CaretRight size={18} />
          </Button>
        </div>
        <Button onClick={thisWeek}>This Week</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Employee shift assignments and hours for the selected week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 bg-muted/50 sticky left-0 z-10 min-w-48">
                    Employee
                  </th>
                  {weekDates.map((date, idx) => {
                    const isToday = date.toDateString() === new Date().toDateString()
                    return (
                      <th 
                        key={idx} 
                        className={`text-center p-3 min-w-32 ${isToday ? 'bg-primary/10' : 'bg-muted/50'}`}
                      >
                        <div className="font-semibold">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    )
                  })}
                  <th className="text-center p-3 bg-muted/50 min-w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map(employee => {
                  const totalHours = getTotalHours(employee.employee_id)
                  return (
                    <tr key={employee.employee_id} className="border-b hover:bg-muted/30">
                      <td className="p-3 sticky left-0 bg-card z-10">
                        <button
                          onClick={() => onSelectEmployee(employee)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <div className="font-medium">
                            {getEmployeeFullName(employee)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {employee.position}
                          </div>
                        </button>
                      </td>
                      {weekDates.map((date, idx) => {
                        const schedule = getScheduleForDay(employee.employee_id, date)
                        const isToday = date.toDateString() === new Date().toDateString()
                        return (
                          <td 
                            key={idx} 
                            className={`p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
                          >
                            {schedule ? (
                              <div className="space-y-1">
                                <Badge 
                                  variant="outline" 
                                  className={`${getShiftBadgeColor(schedule.shift_start)} text-xs`}
                                >
                                  {schedule.shift_start} - {schedule.shift_end}
                                </Badge>
                                <div className="text-xs font-medium">
                                  {schedule.hours}h
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Off</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="p-3 text-center bg-muted/20">
                        <div className="font-bold text-primary">
                          {totalHours}h
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shift Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                08:00 - 16:00
              </Badge>
              <span className="text-xs">Day Shift</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                16:00 - 00:00
              </Badge>
              <span className="text-xs">Night Shift</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                On Call
              </Badge>
              <span className="text-xs">On-Call</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {schedules
                .filter(s => {
                  const scheduleDate = new Date(s.date)
                  return scheduleDate >= weekDates[0] && scheduleDate <= weekDates[6]
                })
                .reduce((sum, s) => sum + s.hours, 0)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total scheduled hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Hours/Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {(schedules
                .filter(s => {
                  const scheduleDate = new Date(s.date)
                  return scheduleDate >= weekDates[0] && scheduleDate <= weekDates[6]
                })
                .reduce((sum, s) => sum + s.hours, 0) / activeEmployees.length).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per employee this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {Math.round((schedules.filter(s => {
                const scheduleDate = new Date(s.date)
                return scheduleDate >= weekDates[0] && scheduleDate <= weekDates[6] && s.hours > 0
              }).length / (activeEmployees.length * 7)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Days covered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
