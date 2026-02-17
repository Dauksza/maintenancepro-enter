import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { DashboardWidget, WorkOrder, Employee, PartInventoryItem, CertificationReminder, AuditLogEntry } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  WarningCircle, 
  Certificate,
  Toolbox,
  Calendar as CalendarIcon,
  ChartBar,
  GearSix,
  Eye,
  EyeSlash,
  ClockCounterClockwise,
  Sparkle,
  UploadSimple,
  Plus
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { getActionIcon, getResourceTypeLabel } from '@/lib/activity-log'

// Animation constants
const STAGGER_DELAY_MS = 50

interface CustomizableDashboardProps {
  workOrders: WorkOrder[]
  employees: Employee[]
  parts: PartInventoryItem[]
  certifications: CertificationReminder[]
  onSelectWorkOrder?: (wo: WorkOrder) => void
  userEmployeeId?: string
  onLoadSampleData?: () => void
  onOpenImport?: () => void
  onCreateWorkOrder?: () => void
}

export function CustomizableDashboard({
  workOrders,
  employees,
  parts,
  certifications,
  onSelectWorkOrder,
  userEmployeeId,
  onLoadSampleData,
  onOpenImport,
  onCreateWorkOrder
}: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useKV<DashboardWidget[]>('dashboard-widgets', [
    {
      widget_id: 'quick-stats',
      type: 'quick-stats',
      title: 'Quick Statistics',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      visible: true
    },
    {
      widget_id: 'my-assignments',
      type: 'my-assignments',
      title: 'My Assignments',
      position: { x: 0, y: 2 },
      size: { width: 6, height: 4 },
      visible: true
    },
    {
      widget_id: 'overdue-tasks',
      type: 'overdue-tasks',
      title: 'Overdue Tasks',
      position: { x: 6, y: 2 },
      size: { width: 6, height: 4 },
      visible: true
    },
    {
      widget_id: 'certifications',
      type: 'certifications',
      title: 'Certification Status',
      position: { x: 0, y: 6 },
      size: { width: 6, height: 3 },
      visible: true
    },
    {
      widget_id: 'parts-inventory',
      type: 'parts-inventory',
      title: 'Parts Inventory Alerts',
      position: { x: 6, y: 6 },
      size: { width: 6, height: 3 },
      visible: true
    },
    {
      widget_id: 'recent-activity',
      type: 'recent-activity',
      title: 'Recent Activity',
      position: { x: 0, y: 9 },
      size: { width: 12, height: 3 },
      visible: true
    }
  ])

  const [editMode, setEditMode] = useState(false)
  const [activityLog] = useKV<AuditLogEntry[]>('activity-log', [])

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets((current) =>
      (current || []).map(w =>
        w.widget_id === widgetId ? { ...w, visible: !w.visible } : w
      )
    )
  }

  const userEmployee = employees.find(e => e.employee_id === userEmployeeId)
  const myAssignments = workOrders.filter(wo => 
    wo.assigned_technician === `${userEmployee?.first_name} ${userEmployee?.last_name}` &&
    wo.status !== 'Completed' && wo.status !== 'Cancelled'
  )
  const overdueTasks = workOrders.filter(wo => wo.is_overdue)
  const lowStockParts = parts.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
  const expiringCerts = certifications.filter(c => c.days_until_expiry <= 30 && !c.dismissed)

  const stats = {
    total: workOrders.length,
    inProgress: workOrders.filter(wo => wo.status === 'In Progress').length,
    completed: workOrders.filter(wo => wo.status === 'Completed').length,
    overdue: overdueTasks.length,
    myTasks: myAssignments.length
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Your personalized maintenance overview</p>
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          onClick={() => setEditMode(!editMode)}
          className="gap-2 shadow-sm"
        >
          <GearSix size={18} />
          {editMode ? 'Done Customizing' : 'Customize'}
        </Button>
      </div>

      {editMode && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Visible Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(widgets || []).map(widget => (
                <Button
                  key={widget.widget_id}
                  variant={widget.visible ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.widget_id)}
                  className="gap-2"
                >
                  {widget.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
                  {widget.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total === 0 && employees.length === 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in shadow-md">
          <CardContent className="pt-12 pb-12">
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 shadow-sm">
                <Sparkle size={36} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Welcome to MaintenancePro</h3>
              <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                Get started by loading sample data to explore the full CMMS experience, or create your first work order.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {onLoadSampleData && (
                  <Button onClick={onLoadSampleData} className="gap-2 shadow-md">
                    <Sparkle size={16} weight="fill" />
                    Load Sample Data
                  </Button>
                )}
                {onCreateWorkOrder && (
                  <Button variant="outline" onClick={onCreateWorkOrder} className="gap-2 shadow-sm">
                    <Plus size={16} weight="bold" />
                    Create Work Order
                  </Button>
                )}
                {onOpenImport && (
                  <Button variant="outline" onClick={onOpenImport} className="gap-2 shadow-sm">
                    <UploadSimple size={16} />
                    Import Excel/CSV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {(widgets || []).filter(w => w.visible).map(widget => (
          <div
            key={widget.widget_id}
            className={cn(
              'col-span-12',
              widget.size.width === 6 && 'lg:col-span-6',
              widget.size.width === 4 && 'lg:col-span-4',
              widget.size.width === 3 && 'lg:col-span-3'
            )}
          >
            {widget.type === 'quick-stats' && (
              <div className="grid grid-cols-5 gap-5">
                <StatCard
                  icon={Wrench}
                  label="Total Work Orders"
                  value={stats.total}
                  color="text-blue-600"
                />
                <StatCard
                  icon={Clock}
                  label="In Progress"
                  value={stats.inProgress}
                  color="text-yellow-600"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Completed"
                  value={stats.completed}
                  color="text-green-600"
                />
                <StatCard
                  icon={WarningCircle}
                  label="Overdue"
                  value={stats.overdue}
                  color="text-red-600"
                />
                <StatCard
                  icon={Wrench}
                  label="My Tasks"
                  value={stats.myTasks}
                  color="text-purple-600"
                />
              </div>
            )}

            {widget.type === 'my-assignments' && (
              <Card className="hover-lift transition-all duration-200 shadow-sm hover:shadow-md border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <Wrench size={22} weight="duotone" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myAssignments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground animate-fade-in">
                      <CheckCircle size={52} className="mx-auto mb-3 opacity-40" weight="duotone" />
                      <p className="font-medium">No active assignments</p>
                      <p className="text-sm mt-1">Your assigned tasks will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {myAssignments.slice(0, 10).map(wo => (
                        <button
                          key={wo.work_order_id}
                          onClick={() => onSelectWorkOrder?.(wo)}
                          className="w-full p-4 rounded-xl border border-border/60 hover:border-primary/60 hover:bg-accent/50 text-left transition-all hover:shadow-md hover:-translate-y-0.5 bg-card"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-sm">{wo.work_order_id}</span>
                            <Badge className={cn(
                              'shadow-sm',
                              wo.priority_level === 'Critical' && 'bg-red-600',
                              wo.priority_level === 'High' && 'bg-orange-600',
                              wo.priority_level === 'Medium' && 'bg-yellow-600',
                              wo.priority_level === 'Low' && 'bg-blue-600'
                            )}>
                              {wo.priority_level}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">{wo.equipment_area}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{wo.task}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon size={14} />
                            {new Date(wo.scheduled_date).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {widget.type === 'overdue-tasks' && (
              <Card className="border-red-200 dark:border-red-900/50 hover-lift transition-all duration-200 shadow-sm hover:shadow-md bg-gradient-to-br from-red-50/50 to-card dark:from-red-950/10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-lg">
                    <WarningCircle size={22} weight="fill" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overdueTasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground animate-fade-in">
                      <CheckCircle size={52} className="mx-auto mb-3 opacity-40" weight="duotone" />
                      <p className="font-medium">No overdue tasks</p>
                      <p className="text-sm mt-1">All work orders are on schedule</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {overdueTasks.slice(0, 10).map(wo => (
                        <button
                          key={wo.work_order_id}
                          onClick={() => onSelectWorkOrder?.(wo)}
                          className="w-full p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-card hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-sm">{wo.work_order_id}</span>
                            <Badge className="shadow-sm" variant="destructive">{wo.priority_level}</Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">{wo.equipment_area}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{wo.task}</p>
                          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                            <CalendarIcon size={14} />
                            Due: {new Date(wo.scheduled_date).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {widget.type === 'certifications' && (
              <Card className={cn(
                "hover-lift transition-all duration-200 shadow-sm hover:shadow-md border-border/50",
                expiringCerts.length > 0 && 'border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/30 to-card dark:from-amber-950/10'
              )}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <Certificate size={22} weight="duotone" className={expiringCerts.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringCerts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground animate-fade-in">
                      <Certificate size={52} className="mx-auto mb-3 opacity-40" weight="duotone" />
                      <p className="font-medium">All certifications current</p>
                      <p className="text-sm mt-1">No expiring certifications</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {expiringCerts.slice(0, 5).map(cert => {
                        const employee = employees.find(e => e.employee_id === cert.employee_id)
                        return (
                          <div
                            key={cert.reminder_id}
                            className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-semibold text-sm">{cert.skill_name}</span>
                              <Badge className="shadow-sm" variant={cert.days_until_expiry <= 7 ? 'destructive' : 'secondary'}>
                                {cert.days_until_expiry} days
                              </Badge>
                            </div>
                            {employee && (
                              <p className="text-sm text-muted-foreground font-medium">
                                {employee.first_name} {employee.last_name}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {widget.type === 'parts-inventory' && (
              <Card className={cn(
                "hover-lift transition-all duration-200 shadow-sm hover:shadow-md border-border/50",
                lowStockParts.length > 0 && 'border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/30 to-card dark:from-orange-950/10'
              )}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <Toolbox size={22} weight="duotone" className={lowStockParts.length > 0 ? 'text-orange-600 dark:text-orange-400' : ''} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockParts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground animate-fade-in">
                      <Toolbox size={52} className="mx-auto mb-3 opacity-40" weight="duotone" />
                      <p className="font-medium">All parts in stock</p>
                      <p className="text-sm mt-1">Inventory levels are healthy</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {lowStockParts.slice(0, 8).map((part, index) => (
                        <div
                          key={part.part_id}
                          className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 transition-all hover:shadow-md animate-slide-in-right shadow-sm"
                          style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-sm">{part.part_name}</span>
                            <Badge className="shadow-sm" variant={part.status === 'Out of Stock' ? 'destructive' : 'secondary'}>
                              {part.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">{part.part_number}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Quantity: <span className="font-semibold">{part.quantity_on_hand}</span> / Min: <span className="font-semibold">{part.minimum_stock_level}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {widget.type === 'recent-activity' && (
              <Card className="hover-lift transition-all duration-200 shadow-sm hover:shadow-md border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <ClockCounterClockwise size={22} weight="duotone" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(activityLog || []).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground animate-fade-in">
                      <ClockCounterClockwise size={52} className="mx-auto mb-3 opacity-40" weight="duotone" />
                      <p className="font-medium">No recent activity</p>
                      <p className="text-sm mt-1">Actions you take will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {(activityLog || [])
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 10)
                        .map(entry => (
                        <div
                          key={entry.log_id}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-all hover:shadow-sm border border-transparent hover:border-border/50"
                        >
                          <span className="text-xl mt-0.5" role="img" aria-label={entry.action}>
                            {getActionIcon(entry.action)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight">
                              {entry.action}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {getResourceTypeLabel(entry.resource_type)} · {entry.resource_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: any
  label: string
  value: number
  color: string
}) {
  return (
    <Card className="hover-lift transition-all duration-200 cursor-default shadow-sm hover:shadow-md border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", color.includes('blue') && 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', color.includes('yellow') && 'from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900', color.includes('green') && 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900', color.includes('red') && 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900', color.includes('purple') && 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900')}>
            <Icon size={26} className={color} weight="duotone" />
          </div>
          <span className="text-4xl font-bold tracking-tight">{value}</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  )
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
