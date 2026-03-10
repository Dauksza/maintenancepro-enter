import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CalendarCheck, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/lib/types'

const ALL_LEAVE_TYPES: LeaveType[] = ['Vacation', 'Sick', 'Personal', 'FMLA', 'Bereavement', 'Jury Duty', 'Other']
const ALL_STATUSES: LeaveStatus[] = ['Pending', 'Approved', 'Denied', 'Cancelled']

function generateSampleLeaveRequests(): LeaveRequest[] {
  const now = new Date().toISOString()
  return [
    {
      request_id: uuidv4(), employee_id: 'e1', employee_name: 'Carlos Rivera',
      leave_type: 'Vacation', status: 'Approved',
      start_date: '2024-11-18', end_date: '2024-11-22', days_requested: 5,
      reason: 'Family trip to Florida', approved_by: 'Rachel Kim', approved_at: '2024-10-28T10:00:00Z',
      notes: '', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e2', employee_name: 'Marcus Williams',
      leave_type: 'Sick', status: 'Approved',
      start_date: '2024-11-04', end_date: '2024-11-05', days_requested: 2,
      reason: 'Flu symptoms', approved_by: 'Rachel Kim', approved_at: '2024-11-04T07:30:00Z',
      notes: 'Submitted doctor note', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e3', employee_name: 'Angela Fontenot',
      leave_type: 'Personal', status: 'Pending',
      start_date: '2024-11-15', end_date: '2024-11-15', days_requested: 1,
      reason: 'Personal appointment', approved_by: null, approved_at: null,
      notes: '', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e4', employee_name: 'Kyle Boudreaux',
      leave_type: 'Vacation', status: 'Pending',
      start_date: '2024-12-23', end_date: '2024-12-27', days_requested: 5,
      reason: 'Christmas vacation', approved_by: null, approved_at: null,
      notes: '', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e5', employee_name: 'Tom Bergeron',
      leave_type: 'Bereavement', status: 'Approved',
      start_date: '2024-10-14', end_date: '2024-10-16', days_requested: 3,
      reason: 'Family bereavement', approved_by: 'Rachel Kim', approved_at: '2024-10-14T08:00:00Z',
      notes: '', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e6', employee_name: 'Sandra Landry',
      leave_type: 'FMLA', status: 'Approved',
      start_date: '2024-11-01', end_date: '2024-11-30', days_requested: 22,
      reason: 'Medical leave', approved_by: 'HR Director', approved_at: '2024-10-30T09:00:00Z',
      notes: 'FMLA paperwork on file', created_at: now
    },
    {
      request_id: uuidv4(), employee_id: 'e7', employee_name: 'Brian Thibodaux',
      leave_type: 'Vacation', status: 'Denied',
      start_date: '2024-11-27', end_date: '2024-11-29', days_requested: 3,
      reason: 'Thanksgiving travel', approved_by: 'Rachel Kim', approved_at: '2024-11-01T14:00:00Z',
      notes: 'Insufficient coverage during holiday production push', created_at: now
    },
  ]
}

const leaveBalances = [
  { type: 'Vacation', available: 12, used: 5, total: 17 },
  { type: 'Sick', available: 7, used: 3, total: 10 },
  { type: 'Personal', available: 2, used: 1, total: 3 },
]

function statusVariant(s: LeaveStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Approved') return 'default'
  if (s === 'Denied') return 'destructive'
  if (s === 'Cancelled') return 'secondary'
  return 'outline'
}

function leaveTypeVariant(t: LeaveType): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (t === 'FMLA') return 'destructive'
  if (t === 'Sick') return 'secondary'
  if (t === 'Vacation') return 'default'
  return 'outline'
}

export function LeaveManagement() {
  const [requests, setRequests] = useKV<LeaveRequest[]>('leave-requests', generateSampleLeaveRequests())
  const safeRequests = requests ?? []
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'All'>('All')
  const [filterType, setFilterType] = useState<LeaveType | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    employee_name: '', leave_type: 'Vacation' as LeaveType,
    start_date: '', end_date: '', reason: ''
  })

  const filtered = useMemo(() => {
    return safeRequests.filter(r => {
      const matchStatus = filterStatus === 'All' || r.status === filterStatus
      const matchType = filterType === 'All' || r.leave_type === filterType
      return matchStatus && matchType
    }).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [safeRequests, filterStatus, filterType])

  const handleApprove = (id: string) => {
    const now = new Date().toISOString()
    setRequests(prev => (prev ?? []).map(r => r.request_id === id
      ? { ...r, status: 'Approved' as LeaveStatus, approved_by: 'Current User', approved_at: now }
      : r))
    toast.success('Leave request approved')
  }

  const handleDeny = (id: string) => {
    const now = new Date().toISOString()
    setRequests(prev => (prev ?? []).map(r => r.request_id === id
      ? { ...r, status: 'Denied' as LeaveStatus, approved_by: 'Current User', approved_at: now }
      : r))
    toast.error('Leave request denied')
  }

  const calcDays = (start: string, end: string): number => {
    if (!start || !end) return 0
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.round(diff / 86400000) + 1)
  }

  const handleAdd = () => {
    if (!form.employee_name || !form.start_date || !form.end_date) {
      toast.error('Employee name and dates are required')
      return
    }
    const now = new Date().toISOString()
    const newReq: LeaveRequest = {
      request_id: uuidv4(),
      employee_id: uuidv4(),
      employee_name: form.employee_name,
      leave_type: form.leave_type,
      status: 'Pending',
      start_date: form.start_date,
      end_date: form.end_date,
      days_requested: calcDays(form.start_date, form.end_date),
      reason: form.reason,
      approved_by: null,
      approved_at: null,
      notes: '',
      created_at: now,
    }
    setRequests(prev => [newReq, ...(prev ?? [])])
    toast.success('Leave request submitted')
    setAddOpen(false)
    setForm({ employee_name: '', leave_type: 'Vacation', start_date: '', end_date: '', reason: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Manage employee time-off requests and balances</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-2" /> New Request
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as LeaveStatus | 'All')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={v => setFilterType(v as LeaveType | 'All')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Leave Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {ALL_LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No leave requests found</TableCell>
                    </TableRow>
                  )}
                  {filtered.map(r => (
                    <TableRow key={r.request_id}>
                      <TableCell>
                        <div className="font-medium text-sm">{r.employee_name}</div>
                        {r.reason && <div className="text-xs text-muted-foreground truncate max-w-40">{r.reason}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={leaveTypeVariant(r.leave_type)} className="text-xs">{r.leave_type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{r.start_date}</div>
                        {r.start_date !== r.end_date && <div className="text-muted-foreground">to {r.end_date}</div>}
                      </TableCell>
                      <TableCell className="text-right font-medium">{r.days_requested}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'Pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 h-7 px-2" onClick={() => handleApprove(r.request_id)}>
                              <CheckCircle size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 h-7 px-2" onClick={() => handleDeny(r.request_id)}>
                              <XCircle size={14} />
                            </Button>
                          </div>
                        )}
                        {r.status !== 'Pending' && (
                          <span className="text-xs text-muted-foreground">{r.approved_by || '—'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Leave Balances Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck size={16} /> Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveBalances.map((lb, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{lb.type}</span>
                      <span className="text-muted-foreground">{lb.available} of {lb.total} days</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(lb.available / lb.total) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{lb.used} days used</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} /> Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safeRequests.filter(r => r.status === 'Pending').length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {safeRequests.filter(r => r.status === 'Pending').map(r => (
                    <div key={r.request_id} className="border rounded-lg p-2 text-sm">
                      <div className="font-medium">{r.employee_name}</div>
                      <div className="text-xs text-muted-foreground">{r.leave_type} · {r.days_requested} days</div>
                      <div className="text-xs">{r.start_date} – {r.end_date}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Employee Name *</Label>
              <Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v as LeaveType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date *</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            {form.start_date && form.end_date && (
              <p className="text-sm text-muted-foreground">Days requested: <strong>{calcDays(form.start_date, form.end_date)}</strong></p>
            )}
            <div className="space-y-1">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
