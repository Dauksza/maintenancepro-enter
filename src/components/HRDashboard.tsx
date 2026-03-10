import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts'
import { UsersThree, TrendUp, UserMinus, Briefcase } from '@phosphor-icons/react'

interface HRData {
  employees: number
  onLeave: number
  openPositions: number
}

const departmentData = [
  { dept: 'Operations', headcount: 15 },
  { dept: 'Maintenance', headcount: 8 },
  { dept: 'Lab/Quality', headcount: 5 },
  { dept: 'Sales', headcount: 6 },
  { dept: 'Admin/Finance', headcount: 7 },
  { dept: 'Safety/HR', headcount: 4 },
  { dept: 'IT', headcount: 2 },
]

const turnoverData = [
  { month: 'Jun', hired: 2, separated: 1 },
  { month: 'Jul', hired: 1, separated: 0 },
  { month: 'Aug', hired: 3, separated: 1 },
  { month: 'Sep', hired: 0, separated: 2 },
  { month: 'Oct', hired: 2, separated: 1 },
  { month: 'Nov', hired: 1, separated: 0 },
]

const recentActivity = [
  { date: '2024-11-01', type: 'New Hire', description: 'Angela Fontenot – Driver hired', tag: 'success' },
  { date: '2024-10-28', type: 'Leave Approved', description: 'Carlos Rivera – 5 days vacation', tag: 'info' },
  { date: '2024-10-25', type: 'Promotion', description: 'Marcus Williams – Sr. Operator', tag: 'success' },
  { date: '2024-10-22', type: 'Separation', description: 'Gary Thibodaux – resigned', tag: 'warning' },
  { date: '2024-10-18', type: 'Training Completed', description: 'HAZWOPER 40-hr – 6 employees', tag: 'info' },
  { date: '2024-10-10', type: 'Open Position', description: 'Plant Operator posted to LinkedIn', tag: 'warning' },
]

export function HRDashboard() {
  const [hrData] = useKV<HRData>('hr-dashboard-data', { employees: 47, onLeave: 3, openPositions: 2 })
  const safeHRData = hrData ?? { employees: 47, onLeave: 3, openPositions: 2 }

  const kpis = useMemo(() => ({
    total: safeHRData.employees,
    active: safeHRData.employees - safeHRData.onLeave,
    onLeave: safeHRData.onLeave,
    openPositions: safeHRData.openPositions,
  }), [safeHRData])

  const tagVariant = (tag: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (tag === 'success') return 'default'
    if (tag === 'warning') return 'outline'
    if (tag === 'info') return 'secondary'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">HR Dashboard</h2>
        <p className="text-muted-foreground">Workforce overview and HR metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><UsersThree size={16} />Total Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Full & part-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><TrendUp size={16} />Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><UserMinus size={16} />On Leave Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{kpis.onLeave}</div>
            <p className="text-xs text-muted-foreground mt-1">Absent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Briefcase size={16} />Open Positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.openPositions}</div>
            <p className="text-xs text-muted-foreground mt-1">Actively recruiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Headcount</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentData} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="headcount" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Turnover Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={turnoverData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Hired" />
                <Line type="monotone" dataKey="separated" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Separated" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent HR Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent HR Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{item.date}</div>
                <Badge variant={tagVariant(item.tag)} className="text-xs shrink-0">{item.type}</Badge>
                <div className="text-sm">{item.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
