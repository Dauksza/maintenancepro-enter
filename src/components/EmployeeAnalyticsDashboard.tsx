import type { Employee, SkillMatrixEntry, WorkOrder } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Certificate, Briefcase, TrendUp } from '@phosphor-icons/react'
import { calculateEmployeeAnalytics } from '@/lib/employee-utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface EmployeeAnalyticsDashboardProps {
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  workOrders: WorkOrder[]
}

export function EmployeeAnalyticsDashboard({
  employees,
  skillMatrix,
  workOrders
}: EmployeeAnalyticsDashboardProps) {
  const analytics = calculateEmployeeAnalytics(employees, skillMatrix, workOrders)

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users size={18} weight="fill" className="text-primary" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {analytics.total_employees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.active_employees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Certificate size={18} weight="fill" className="text-green-600" />
              Skills Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.skill_coverage.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique competencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase size={18} weight="fill" className="text-blue-600" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.by_department.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendUp size={18} weight="fill" className="text-purple-600" />
              Avg Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.work_order_completion_by_tech.length > 0
                ? (analytics.work_order_completion_by_tech.reduce((sum, t) => sum + t.avg_time, 0) / 
                   analytics.work_order_completion_by_tech.length).toFixed(1)
                : '0.0'}d
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Days per work order
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Team distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.by_department}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="department" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees by Shift</CardTitle>
            <CardDescription>Shift distribution across workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.by_shift}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ shift, count, percent }) => `${shift}: ${count} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.by_shift.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Coverage</CardTitle>
          <CardDescription>
            Number of employees and average skill level across all tracked competencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.skill_coverage.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="skill" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="employee_count" fill="#3b82f6" name="Employee Count" radius={[8, 8, 0, 0]} />
              <Bar dataKey="avg_level" fill="#8b5cf6" name="Avg Level (1-4)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Order Performance by Technician</CardTitle>
          <CardDescription>
            Completed work orders and average completion time per technician
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.work_order_completion_by_tech.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.work_order_completion_by_tech.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="technician" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No completed work orders to display
            </div>
          )}
        </CardContent>
      </Card>

      {analytics.certification_expiring_soon.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Certificate size={20} weight="fill" />
              Certifications Expiring Soon
            </CardTitle>
            <CardDescription>
              Certifications expiring in the next 90 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.certification_expiring_soon.map((cert, idx) => {
                const employee = employees.find(e => e.employee_id === cert.employee_id)
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-medium">
                        {employee ? `${employee.first_name} ${employee.last_name}` : cert.employee_id}
                      </div>
                      <div className="text-sm text-muted-foreground">{cert.skill}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-800">
                        Expires {new Date(cert.expiry_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(cert.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
