import { useState } from 'react'
import type { WorkOrder, WorkOrderStatus, PriorityLevel } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  CheckCircle, 
  Wrench, 
  Calendar,
  User,
  Warning,
  Funnel
} from '@phosphor-icons/react'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/maintenance-utils'
import { cn } from '@/lib/utils'

interface WorkOrderGridProps {
  workOrders: WorkOrder[]
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  onSelectWorkOrder: (wo: WorkOrder) => void
}

export function WorkOrderGrid({ 
  workOrders, 
  onUpdateWorkOrder,
  onSelectWorkOrder 
}: WorkOrderGridProps) {
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'equipment' | 'terminal'>('none')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrders = workOrders.filter(wo => {
    if (filterStatus !== 'all' && wo.status !== filterStatus) return false
    if (filterPriority !== 'all' && wo.priority_level !== filterPriority) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        wo.work_order_id.toLowerCase().includes(search) ||
        wo.equipment_area.toLowerCase().includes(search) ||
        wo.task.toLowerCase().includes(search) ||
        (wo.assigned_technician || '').toLowerCase().includes(search)
      )
    }
    return true
  })

  const groupedOrders = groupBy === 'none' 
    ? { 'All': filteredOrders }
    : filteredOrders.reduce((acc, wo) => {
        const key = groupBy === 'status' 
          ? wo.status 
          : groupBy === 'equipment' 
          ? wo.equipment_area 
          : wo.terminal
        if (!acc[key]) acc[key] = []
        acc[key].push(wo)
        return acc
      }, {} as Record<string, WorkOrder[]>)

  const handleQuickComplete = (wo: WorkOrder) => {
    onUpdateWorkOrder(wo.work_order_id, {
      status: 'Completed',
      completed_at: new Date().toISOString()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border">
        <Funnel size={20} className="text-muted-foreground" />
        
        <Input
          placeholder="Search work orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Scheduled (Not Started)">Scheduled</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
            <SelectItem value="equipment">By Equipment</SelectItem>
            <SelectItem value="terminal">By Terminal</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredOrders.length} work order{filteredOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {Object.entries(groupedOrders).map(([group, orders]) => (
        <div key={group} className="space-y-2">
          {groupBy !== 'none' && (
            <h3 className="text-lg font-semibold text-foreground px-2">
              {group} ({orders.length})
            </h3>
          )}
          
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">ID</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Equipment/Area</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Task</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Priority</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Scheduled</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Technician</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Downtime</th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((wo, idx) => (
                    <tr
                      key={wo.work_order_id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors',
                        wo.is_overdue && 'bg-destructive/5'
                      )}
                      onClick={() => onSelectWorkOrder(wo)}
                    >
                      <td className="p-3">
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {wo.work_order_id}
                        </code>
                      </td>
                      <td className="p-3 text-sm">{wo.equipment_area}</td>
                      <td className="p-3 text-sm max-w-xs truncate">{wo.task}</td>
                      <td className="p-3">
                        <Badge className={getPriorityColor(wo.priority_level)}>
                          {wo.priority_level}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(wo.status)}>
                          {wo.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-muted-foreground" />
                          {formatDate(wo.scheduled_date)}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-muted-foreground" />
                          {wo.assigned_technician || <span className="text-muted-foreground italic">Unassigned</span>}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {wo.estimated_downtime_hours}h
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {wo.status !== 'Completed' && wo.status !== 'Cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickComplete(wo)}
                              className="h-8"
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Warning size={48} className="mx-auto mb-4 opacity-50" />
          <p>No work orders found matching your filters</p>
        </div>
      )}
    </div>
  )
}
