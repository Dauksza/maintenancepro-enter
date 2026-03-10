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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, GraduationCap, CheckCircle, Warning, Clock } from '@phosphor-icons/react'
import type { TrainingRecord, TrainingStatus, TrainingCategory } from '@/lib/types'

const ALL_CATEGORIES: TrainingCategory[] = ['Safety', 'Technical', 'Compliance', 'Leadership', 'Operations', 'Other']
const ALL_STATUSES: TrainingStatus[] = ['Not Started', 'In Progress', 'Completed', 'Overdue', 'Waived']

function generateSampleTraining(): TrainingRecord[] {
  const now = new Date().toISOString()
  return [
    {
      record_id: uuidv4(), employee_id: 'e1', employee_name: 'Carlos Rivera',
      course_name: 'HAZWOPER 40-Hour', category: 'Safety', status: 'Completed',
      assigned_date: '2024-09-01', due_date: '2024-10-15', completed_date: '2024-10-10',
      score: 92, instructor: 'Safety Solutions LLC', hours: 40,
      certificate_url: 'hazwoper-2024.pdf', notes: '', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e2', employee_name: 'Marcus Williams',
      course_name: 'Confined Space Entry', category: 'Safety', status: 'Completed',
      assigned_date: '2024-09-15', due_date: '2024-10-31', completed_date: '2024-10-22',
      score: 88, instructor: 'OSHA Outreach', hours: 8,
      certificate_url: 'cse-2024.pdf', notes: '', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e3', employee_name: 'Angela Fontenot',
      course_name: 'CDL Tanker Endorsement Refresh', category: 'Compliance', status: 'Completed',
      assigned_date: '2024-08-01', due_date: '2024-09-30', completed_date: '2024-09-25',
      score: 95, instructor: 'LA DMV', hours: 4,
      certificate_url: null, notes: 'CDL updated', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e4', employee_name: 'Kyle Boudreaux',
      course_name: 'Asphalt Plant Operations', category: 'Technical', status: 'In Progress',
      assigned_date: '2024-10-01', due_date: '2024-11-30', completed_date: null,
      score: null, instructor: 'NAPA Online', hours: 16,
      certificate_url: null, notes: 'Module 3 of 5 complete', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e5', employee_name: 'Tom Bergeron',
      course_name: 'Defensive Driving', category: 'Operations', status: 'Overdue',
      assigned_date: '2024-07-01', due_date: '2024-09-30', completed_date: null,
      score: null, instructor: 'NSC Online', hours: 2,
      certificate_url: null, notes: 'Missed deadline', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e6', employee_name: 'Sandra Landry',
      course_name: 'Supervisory Leadership', category: 'Leadership', status: 'Not Started',
      assigned_date: '2024-10-15', due_date: '2024-12-31', completed_date: null,
      score: null, instructor: 'Corporate L&D', hours: 20,
      certificate_url: null, notes: '', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e7', employee_name: 'Brian Thibodaux',
      course_name: 'HAZWOPER 40-Hour', category: 'Safety', status: 'Overdue',
      assigned_date: '2024-06-01', due_date: '2024-08-31', completed_date: null,
      score: null, instructor: 'Safety Solutions LLC', hours: 40,
      certificate_url: null, notes: 'Reschedule required', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e1', employee_name: 'Carlos Rivera',
      course_name: 'Quality Sampling Procedures', category: 'Technical', status: 'Completed',
      assigned_date: '2024-10-01', due_date: '2024-10-31', completed_date: '2024-10-28',
      score: 100, instructor: 'Lab Manager', hours: 4,
      certificate_url: null, notes: '', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e2', employee_name: 'Marcus Williams',
      course_name: 'Lockout/Tagout Annual', category: 'Safety', status: 'Completed',
      assigned_date: '2024-09-01', due_date: '2024-10-01', completed_date: '2024-09-30',
      score: 85, instructor: 'Safety Director', hours: 2,
      certificate_url: null, notes: '', created_at: now
    },
    {
      record_id: uuidv4(), employee_id: 'e8', employee_name: 'Rachel Kim',
      course_name: 'DOT Supervisor Reasonable Suspicion', category: 'Compliance', status: 'In Progress',
      assigned_date: '2024-10-15', due_date: '2024-11-15', completed_date: null,
      score: null, instructor: 'DOT Compliance Pros', hours: 2,
      certificate_url: null, notes: '', created_at: now
    },
  ]
}

function statusVariant(s: TrainingStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Completed' || s === 'Waived') return 'default'
  if (s === 'Overdue') return 'destructive'
  if (s === 'In Progress') return 'outline'
  return 'secondary'
}

function categoryVariant(c: TrainingCategory): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (c === 'Safety') return 'destructive'
  if (c === 'Compliance') return 'outline'
  if (c === 'Technical') return 'default'
  return 'secondary'
}

export function TrainingManagement() {
  const [records, setRecords] = useKV<TrainingRecord[]>('training-records', generateSampleTraining())
  const safeRecords = records ?? []
  const [filterStatus, setFilterStatus] = useState<TrainingStatus | 'All'>('All')
  const [filterCategory, setFilterCategory] = useState<TrainingCategory | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    employee_name: '', course_name: '', category: 'Safety' as TrainingCategory,
    assigned_date: '', due_date: '', instructor: '', hours: 1, notes: ''
  })

  const kpis = useMemo(() => ({
    total: safeRecords.length,
    completed: safeRecords.filter(r => r.status === 'Completed').length,
    inProgress: safeRecords.filter(r => r.status === 'In Progress').length,
    overdue: safeRecords.filter(r => r.status === 'Overdue').length,
  }), [safeRecords])

  const chartData = useMemo(() => {
    const catMap: Record<TrainingCategory, { completed: number; total: number }> = {
      Safety: { completed: 0, total: 0 }, Technical: { completed: 0, total: 0 },
      Compliance: { completed: 0, total: 0 }, Leadership: { completed: 0, total: 0 },
      Operations: { completed: 0, total: 0 }, Other: { completed: 0, total: 0 }
    }
    safeRecords.forEach(r => {
      catMap[r.category].total++
      if (r.status === 'Completed') catMap[r.category].completed++
    })
    return Object.entries(catMap).filter(([, v]) => v.total > 0).map(([name, v]) => ({
      name, completed: v.completed, total: v.total,
      rate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0
    }))
  }, [safeRecords])

  const filtered = useMemo(() => {
    return safeRecords.filter(r => {
      const matchStatus = filterStatus === 'All' || r.status === filterStatus
      const matchCat = filterCategory === 'All' || r.category === filterCategory
      return matchStatus && matchCat
    })
  }, [safeRecords, filterStatus, filterCategory])

  const handleAdd = () => {
    if (!form.employee_name || !form.course_name || !form.due_date) {
      toast.error('Employee, course name, and due date are required')
      return
    }
    const now = new Date().toISOString()
    const newRecord: TrainingRecord = {
      record_id: uuidv4(),
      employee_id: uuidv4(),
      employee_name: form.employee_name,
      course_name: form.course_name,
      category: form.category,
      status: 'Not Started',
      assigned_date: form.assigned_date || now.split('T')[0],
      due_date: form.due_date,
      completed_date: null,
      score: null,
      instructor: form.instructor,
      hours: form.hours,
      certificate_url: null,
      notes: form.notes,
      created_at: now,
    }
    setRecords(prev => [newRecord, ...(prev ?? [])])
    toast.success('Training record added')
    setAddOpen(false)
    setForm({ employee_name: '', course_name: '', category: 'Safety', assigned_date: '', due_date: '', instructor: '', hours: 1, notes: '' })
  }

  const markComplete = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    setRecords(prev => (prev ?? []).map(r => r.record_id === id
      ? { ...r, status: 'Completed' as TrainingStatus, completed_date: today }
      : r))
    toast.success('Marked as completed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Training Management</h2>
          <p className="text-muted-foreground">Track employee training assignments and completion</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-2" /> Add Record
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><GraduationCap size={16} />Total Courses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle size={16} />Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpis.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock size={16} />In Progress</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{kpis.inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Warning size={16} />Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{kpis.overdue}</div></CardContent>
        </Card>
      </div>

      {/* Completion Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion Rate by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Completion Rate']} />
              <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as TrainingStatus | 'All')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={v => setFilterCategory(v as TrainingCategory | 'All')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No training records found</TableCell>
                </TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.record_id}>
                  <TableCell className="font-medium text-sm">{r.employee_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{r.course_name}</div>
                    <div className="text-xs text-muted-foreground">{r.instructor}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={categoryVariant(r.category)} className="text-xs">{r.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.due_date}</TableCell>
                  <TableCell className="text-sm">{r.completed_date || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    {r.score !== null ? <span className="font-medium">{r.score}%</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{r.hours}h</TableCell>
                  <TableCell>
                    {(r.status === 'In Progress' || r.status === 'Not Started') && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => markComplete(r.record_id)}>
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Training Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Employee Name *</Label>
              <Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Course Name *</Label>
              <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as TrainingCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Hours</Label>
                <Input type="number" value={form.hours} min={0.5} step={0.5} onChange={e => setForm(f => ({ ...f, hours: parseFloat(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Instructor</Label>
              <Input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Assigned Date</Label>
                <Input type="date" value={form.assigned_date} onChange={e => setForm(f => ({ ...f, assigned_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
