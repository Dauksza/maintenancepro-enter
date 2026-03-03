import { useMemo } from 'react'
import type { WorkOrder } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChartBar, 
  CheckCircle, 
  Warning, 
  Clock,
  Wrench,
  Factory
} from '@phosphor-icons/react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { ProductionSalesAnalytics } from '@/components/ProductionSalesAnalytics'

interface AnalyticsDashboardProps {
  workOrders: WorkOrder[]
}

const STATUS_COLORS = {
  'Scheduled (Not Started)': 'oklch(0.60 0.15 240)',
  'In Progress': 'oklch(0.65 0.14 145)',
  'Completed': 'oklch(0.62 0.17 145)',
  'Overdue': 'oklch(0.58 0.20 25)',
  'Cancelled': 'oklch(0.88 0.01 255)'
}

const PRIORITY_COLORS = {
  'Low': 'oklch(0.88 0.01 255)',
  'Medium': 'oklch(0.60 0.15 240)',
  'High': 'oklch(0.72 0.18 55)',
  'Critical': 'oklch(0.45 0.21 15)'
}

export function AnalyticsDashboard({ workOrders }: AnalyticsDashboardProps) {
  const statusData = useMemo(() => {
    return Object.entries(
      workOrders.reduce((acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: status,
      value: count,
      fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#888'
    }))
  }, [workOrders])

  const priorityData = useMemo(() => {
    return Object.entries(
      workOrders.reduce((acc, wo) => {
        acc[wo.priority_level] = (acc[wo.priority_level] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([priority, count]) => ({
      name: priority,
      value: count,
      fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#888'
    }))
  }, [workOrders])

  const equipmentData = useMemo(() => {
    return Object.entries(
      workOrders.reduce((acc, wo) => {
        acc[wo.equipment_area] = (acc[wo.equipment_area] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, count]) => ({
        area,
        count
      }))
  }, [workOrders])

  const downtimeByMonth = useMemo(() => {
    const monthData: Record<string, number> = {}
    workOrders.forEach(wo => {
      const date = new Date(wo.scheduled_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthData[monthKey] = (monthData[monthKey] || 0) + wo.estimated_downtime_hours
    })
    return Object.entries(monthData)
      .sort()
      .map(([month, hours]) => ({
        month,
        hours: Math.round(hours * 10) / 10
      }))
  }, [workOrders])

  const stats = useMemo(() => {
    const completedCount = workOrders.filter(wo => wo.status === 'Completed').length
    const overdueCount = workOrders.filter(wo => wo.is_overdue).length
    const inProgressCount = workOrders.filter(wo => wo.status === 'In Progress').length
    const totalDowntime = workOrders.reduce((sum, wo) => sum + wo.estimated_downtime_hours, 0)
    
    return {
      completedCount,
      overdueCount,
      inProgressCount,
      totalDowntime
    }
  }, [workOrders])

  const { completedCount, overdueCount, inProgressCount, totalDowntime } = stats
  const completionRate = workOrders.length > 0 
    ? Math.round((completedCount / workOrders.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <Tabs defaultValue="maintenance">
        <TabsList>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench size={15} />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="production-sales" className="flex items-center gap-2">
            <Factory size={15} />
            Production & Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production-sales" className="pt-4">
          <ProductionSalesAnalytics />
        </TabsContent>

        <TabsContent value="maintenance" className="pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Work Orders</CardDescription>
            <CardTitle className="text-3xl">{workOrders.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench size={16} />
              <span>Active maintenance tasks</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={16} />
              <span>{completedCount} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue Tasks</CardDescription>
            <CardTitle className="text-3xl text-destructive">{overdueCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Warning size={16} />
              <span>Require immediate attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Downtime</CardDescription>
            <CardTitle className="text-3xl">{Math.round(totalDowntime)}h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={16} />
              <span>Estimated total hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar size={20} />
              Work Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar size={20} />
              Work Orders by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="oklch(0.35 0.12 255)">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance by Equipment Area</CardTitle>
            <CardDescription>Top 8 areas by work order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={equipmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="area" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.35 0.12 255)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downtime by Month</CardTitle>
            <CardDescription>Estimated downtime hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={downtimeByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="oklch(0.72 0.18 55)" 
                  strokeWidth={2}
                  name="Downtime (hours)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="status-badge-in-progress">In Progress</Badge>
              <span className="text-2xl font-bold">{inProgressCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="status-badge-scheduled">Scheduled</Badge>
              <span className="text-2xl font-bold">
                {workOrders.filter(wo => wo.status === 'Scheduled (Not Started)').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="status-badge-completed">Completed</Badge>
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="status-badge-overdue">Overdue</Badge>
              <span className="text-2xl font-bold">{overdueCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
