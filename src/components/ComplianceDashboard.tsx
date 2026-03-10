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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, ShieldCheck, PencilSimple, Warning } from '@phosphor-icons/react'
import type { ComplianceItem, ComplianceCategory, ComplianceStatus } from '@/lib/types'

const ALL_CATEGORIES: ComplianceCategory[] = ['Environmental', 'Safety', 'Labor', 'Financial', 'Quality', 'Security', 'Other']
const ALL_STATUSES: ComplianceStatus[] = ['Compliant', 'Non-Compliant', 'Under Review', 'Expired', 'Upcoming']

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#ef4444', '#3b82f6']

function generateSampleCompliance(): ComplianceItem[] {
  const now = new Date().toISOString()
  return [
    {
      item_id: uuidv4(), title: 'EPA Air Permit Title V', category: 'Environmental', status: 'Compliant',
      regulation: '40 CFR Part 70', description: 'Operating permit for major source air emissions',
      responsible_party: 'EHS Manager', due_date: '2025-06-30', last_review_date: '2024-10-01',
      next_review_date: '2025-01-01', documents: ['permit-titlev-2024.pdf'], notes: 'Annual compliance certification submitted',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'OSHA Process Safety Management', category: 'Safety', status: 'Compliant',
      regulation: '29 CFR 1910.119', description: 'PSM program for HHC above threshold quantities',
      responsible_party: 'Safety Director', due_date: '2025-03-31', last_review_date: '2024-09-15',
      next_review_date: '2025-02-01', documents: ['psm-program-2024.pdf', 'pha-report.pdf'], notes: 'PHA revalidation due Q1 2025',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'DOT Hazmat Registration', category: 'Safety', status: 'Upcoming',
      regulation: '49 CFR Part 107', description: 'Annual DOT registration for hazmat transporter',
      responsible_party: 'Logistics Manager', due_date: '2024-12-01', last_review_date: '2023-12-01',
      next_review_date: '2024-11-15', documents: [], notes: 'Registration renewal due Dec 1',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'SPCC Plan Review', category: 'Environmental', status: 'Compliant',
      regulation: '40 CFR Part 112', description: 'Spill Prevention, Control, and Countermeasure Plan',
      responsible_party: 'EHS Manager', due_date: '2027-04-15', last_review_date: '2024-04-15',
      next_review_date: '2025-04-15', documents: ['spcc-plan-2024.pdf'], notes: 'Amended following tank farm expansion',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'LDAR Monitoring Program', category: 'Environmental', status: 'Under Review',
      regulation: '40 CFR Part 60', description: 'Leak Detection and Repair for VOC components',
      responsible_party: 'EHS Technician', due_date: '2024-11-30', last_review_date: '2024-08-01',
      next_review_date: '2024-11-01', documents: ['ldar-q3-2024.pdf'], notes: 'Q4 inspection scheduled – findings under review',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'OSHA Hazard Communication', category: 'Safety', status: 'Compliant',
      regulation: '29 CFR 1910.1200', description: 'SDS management and employee right-to-know',
      responsible_party: 'Safety Director', due_date: '2025-01-31', last_review_date: '2024-01-31',
      next_review_date: '2025-01-01', documents: ['sds-binder-current.pdf'], notes: '47 SDSs current; annual training complete',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'ISO 9001:2015 Quality Cert', category: 'Quality', status: 'Compliant',
      regulation: 'ISO 9001:2015', description: 'Quality Management System certification',
      responsible_party: 'Quality Manager', due_date: '2025-10-15', last_review_date: '2024-10-15',
      next_review_date: '2025-04-15', documents: ['iso9001-cert-2024.pdf'], notes: 'Surveillance audit passed Oct 2024',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'LA DEQ Discharge Permit', category: 'Environmental', status: 'Non-Compliant',
      regulation: 'LA RS 30:2075', description: 'LPDES permit for stormwater discharge',
      responsible_party: 'EHS Manager', due_date: '2024-11-15', last_review_date: '2024-09-20',
      next_review_date: '2024-11-01', documents: [], notes: 'Non-compliance notice received; corrective action plan in progress',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'FMCSA Operating Authority', category: 'Labor', status: 'Compliant',
      regulation: '49 CFR Part 365', description: 'Motor carrier operating authority for bulk liquid transport',
      responsible_party: 'Logistics Manager', due_date: '2026-03-01', last_review_date: '2024-03-01',
      next_review_date: '2025-12-01', documents: ['mc-authority.pdf'], notes: '',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'Workers Comp Insurance', category: 'Financial', status: 'Compliant',
      regulation: 'LA RS 23:1021', description: 'State-mandated workers compensation coverage',
      responsible_party: 'HR Director', due_date: '2025-07-01', last_review_date: '2024-07-01',
      next_review_date: '2025-06-01', documents: ['wc-policy-2024.pdf'], notes: 'Policy renews July 1',
      created_at: now, updated_at: now
    },
    {
      item_id: uuidv4(), title: 'DOT Drug & Alcohol Testing', category: 'Safety', status: 'Compliant',
      regulation: '49 CFR Part 382', description: 'Random drug testing program for CDL drivers',
      responsible_party: 'HR Director', due_date: '2025-01-31', last_review_date: '2024-01-31',
      next_review_date: '2025-01-01', documents: ['drug-test-log-2024.pdf'], notes: '100% compliance; MRO contract current',
      created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: ComplianceStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Compliant') return 'default'
  if (s === 'Non-Compliant' || s === 'Expired') return 'destructive'
  if (s === 'Under Review') return 'outline'
  return 'secondary'
}

const statusColorClass: Record<ComplianceStatus, string> = {
  Compliant: 'text-green-600',
  'Non-Compliant': 'text-red-600',
  'Under Review': 'text-amber-600',
  Expired: 'text-red-800',
  Upcoming: 'text-blue-600',
}

export function ComplianceDashboard() {
  const [items, setItems] = useKV<ComplianceItem[]>('compliance-items', generateSampleCompliance())
  const safeItems = items ?? []
  const [filterCategory, setFilterCategory] = useState<ComplianceCategory | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'All'>('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<ComplianceItem | null>(null)
  const [form, setForm] = useState({
    title: '', category: 'Safety' as ComplianceCategory, status: 'Compliant' as ComplianceStatus,
    regulation: '', description: '', responsible_party: '', due_date: '', next_review_date: '', notes: ''
  })

  const kpis = useMemo(() => {
    const today = new Date()
    const thirtyDaysOut = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]
    return {
      total: safeItems.length,
      compliant: safeItems.filter(i => i.status === 'Compliant').length,
      nonCompliant: safeItems.filter(i => i.status === 'Non-Compliant' || i.status === 'Expired').length,
      upcoming: safeItems.filter(i => i.due_date <= thirtyDaysOut && i.due_date >= today.toISOString().split('T')[0] && i.status !== 'Compliant').length,
    }
  }, [safeItems])

  const pieData = useMemo(() => {
    const counts: Record<ComplianceStatus, number> = { Compliant: 0, 'Non-Compliant': 0, 'Under Review': 0, Expired: 0, Upcoming: 0 }
    safeItems.forEach(i => { counts[i.status]++ })
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [safeItems])

  const filtered = useMemo(() => {
    return safeItems.filter(i => {
      const matchCat = filterCategory === 'All' || i.category === filterCategory
      const matchStat = filterStatus === 'All' || i.status === filterStatus
      return matchCat && matchStat
    })
  }, [safeItems, filterCategory, filterStatus])

  const openAdd = () => {
    setEditItem(null)
    setForm({ title: '', category: 'Safety', status: 'Compliant', regulation: '', description: '', responsible_party: '', due_date: '', next_review_date: '', notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: ComplianceItem) => {
    setEditItem(item)
    setForm({ title: item.title, category: item.category, status: item.status, regulation: item.regulation, description: item.description, responsible_party: item.responsible_party, due_date: item.due_date, next_review_date: item.next_review_date, notes: item.notes })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.title || !form.due_date) {
      toast.error('Title and due date are required')
      return
    }
    const now = new Date().toISOString()
    if (editItem) {
      setItems(prev => (prev ?? []).map(i => i.item_id === editItem.item_id
        ? { ...i, ...form, updated_at: now } : i))
      toast.success('Compliance item updated')
    } else {
      const newItem: ComplianceItem = {
        item_id: uuidv4(), ...form,
        last_review_date: null, documents: [], created_at: now, updated_at: now
      }
      setItems(prev => [newItem, ...(prev ?? [])])
      toast.success('Compliance item added')
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compliance Dashboard</h2>
          <p className="text-muted-foreground">Regulatory compliance tracking and management</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ShieldCheck size={16} />Total Items</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpis.compliant}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{kpis.nonCompliant}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Warning size={16} />Due ≤30 Days</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{kpis.upcoming}</div></CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as ComplianceCategory | 'All')}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ComplianceStatus | 'All')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No items found</TableCell>
                    </TableRow>
                  )}
                  {filtered.map(item => (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.regulation}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.status)} className={`text-xs ${statusColorClass[item.status]}`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.due_date}</TableCell>
                      <TableCell className="text-sm">{item.responsible_party}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><PencilSimple size={14} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Compliance Item' : 'Add Compliance Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ComplianceCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ComplianceStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Regulation</Label>
              <Input value={form.regulation} onChange={e => setForm(f => ({ ...f, regulation: e.target.value }))} placeholder="e.g. 29 CFR 1910.119" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Responsible Party</Label>
              <Input value={form.responsible_party} onChange={e => setForm(f => ({ ...f, responsible_party: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Next Review Date</Label>
                <Input type="date" value={form.next_review_date} onChange={e => setForm(f => ({ ...f, next_review_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editItem ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
