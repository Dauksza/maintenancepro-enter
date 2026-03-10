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
import { Plus, Gear, Warning } from '@phosphor-icons/react'
import type { EngineeringChange, ECOStatus, ECOPriority } from '@/lib/types'

const ALL_ECO_STATUSES: ECOStatus[] = ['Draft', 'Pending Review', 'Approved', 'Rejected', 'Implemented']
const ALL_PRIORITIES: ECOPriority[] = ['Low', 'Medium', 'High', 'Critical']

function generateSampleECOs(): EngineeringChange[] {
  const now = new Date().toISOString()
  return [
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0048', title: 'Update PG 70-22 SBS Dosage Rate',
      status: 'Approved', priority: 'High',
      description: 'Increase SBS polymer dosage from 4.5% to 5.0% wt to improve rutting resistance in summer months',
      reason: 'Performance test failures at +64°C in recent AASHTO T315 testing',
      affected_products: ['PG 70-22', 'BOM-0002'], affected_documents: ['SPEC-0002', 'BOM-0002', 'BLEND-SOP-004'],
      requested_by: 'Quality Manager', assigned_to: 'Lead Chemist',
      reviewed_by: 'Rachel Kim', review_date: '2024-10-25',
      implementation_date: '2024-11-01',
      estimated_cost: 18500, actual_cost: 17800, notes: 'Approved – implement on next production run',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0049', title: 'Add Anti-Stripping Agent to RSBC-1',
      status: 'Pending Review', priority: 'Medium',
      description: 'Incorporate 0.5% amine-based anti-strip additive into RSBC-1 formulation to address field adhesion issues',
      reason: 'Customer complaint – aggregate stripping observed on 3 projects (Q3 2024)',
      affected_products: ['RSBC-1'], affected_documents: ['SPEC-0004', 'BOM-0003'],
      requested_by: 'Field Engineer', assigned_to: 'Quality Manager',
      reviewed_by: null, review_date: null, implementation_date: null,
      estimated_cost: 4200, actual_cost: null, notes: 'Under technical review by lab team',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0050', title: 'New Product Line: PG 76-22 Binder',
      status: 'Pending Review', priority: 'High',
      description: 'Develop and qualify new PG 76-22 polymer modified binder to address heavy traffic and extreme heat market demand',
      reason: 'Customer RFQs for PG 76-22 increasing; currently referring business to competitors',
      affected_products: ['PG 76-22 (New)'], affected_documents: ['SPEC-0006 (Draft)'],
      requested_by: 'Sales Manager', assigned_to: 'Lead Chemist',
      reviewed_by: null, review_date: null, implementation_date: null,
      estimated_cost: 62000, actual_cost: null, notes: 'Lab trials scheduled Q4 2024; capex estimate includes new blending unit',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0047', title: 'Replace Sasobit with Evotherm WMA Additive',
      status: 'Implemented', priority: 'Medium',
      description: 'Substitute warm mix asphalt additive from Sasobit to Evotherm M1 based on cost and performance evaluation',
      reason: 'Evotherm 15% lower cost; equivalent performance in plant and field trials',
      affected_products: ['PG 64-22', 'PG 70-22'], affected_documents: ['BOM-0001', 'BOM-0002', 'PROC-WMA-001'],
      requested_by: 'Quality Manager', assigned_to: 'Procurement',
      reviewed_by: 'Rachel Kim', review_date: '2024-09-10',
      implementation_date: '2024-10-01',
      estimated_cost: 1500, actual_cost: 1200, notes: 'Successfully implemented; supplier approved',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0046', title: 'CRITICAL: Fix Safety Overpressure Interlock',
      status: 'Implemented', priority: 'Critical',
      description: 'Revise tank farm overpressure interlock setpoint from 15 PSI to 12 PSI on all 4 asphalt storage tanks per updated RAGAGEP standards',
      reason: 'PSM audit finding – RAGAGEP requires lower setpoint; non-compliance risk',
      affected_products: [], affected_documents: ['P&ID-001', 'P&ID-002', 'SAFETY-ILP-001'],
      requested_by: 'Safety Director', assigned_to: 'Controls Engineer',
      reviewed_by: 'Safety Director', review_date: '2024-08-15',
      implementation_date: '2024-08-22',
      estimated_cost: 8000, actual_cost: 7500, notes: 'Emergency implementation completed before next inspection',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0051', title: 'Optimize AC-20 Blending Temperature',
      status: 'Draft', priority: 'Low',
      description: 'Reduce AC-20 blending temperature from 380°F to 365°F to decrease energy consumption and thermal degradation',
      reason: 'Energy efficiency initiative – estimated $12K annual savings',
      affected_products: ['AC-20'], affected_documents: ['BLEND-SOP-002'],
      requested_by: 'Plant Engineer', assigned_to: null,
      reviewed_by: null, review_date: null, implementation_date: null,
      estimated_cost: 500, actual_cost: null, notes: 'Preliminary lab study shows equivalent product quality at lower temperature',
      created_at: now, updated_at: now
    },
    {
      eco_id: uuidv4(), eco_number: 'ECO-2024-0045', title: 'Discontinue AC-10 Grade',
      status: 'Implemented', priority: 'Low',
      description: 'Remove AC-10 viscosity grade from active product line; consolidate to performance grade binders',
      reason: 'Last AC-10 order was Q2 2022; spec is Obsolete; freeing up tank capacity',
      affected_products: ['AC-10'], affected_documents: ['SPEC-0007'],
      requested_by: 'Operations Manager', assigned_to: 'Quality Manager',
      reviewed_by: 'Rachel Kim', review_date: '2024-06-01',
      implementation_date: '2024-07-01',
      estimated_cost: 200, actual_cost: 200, notes: 'SPEC-0007 marked Obsolete',
      created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: ECOStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Approved' || s === 'Implemented') return 'default'
  if (s === 'Rejected') return 'destructive'
  if (s === 'Pending Review') return 'outline'
  return 'secondary'
}

function priorityVariant(p: ECOPriority): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (p === 'Critical') return 'destructive'
  if (p === 'High') return 'outline'
  if (p === 'Medium') return 'secondary'
  return 'secondary'
}

const priorityColorClass: Record<ECOPriority, string> = {
  Critical: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-yellow-600',
  Low: 'text-blue-600',
}

const WORKFLOW = ['Draft', 'Pending Review', 'Approved', 'Implemented'] as const

export function EngineeringChanges() {
  const [ecos, setEcos] = useKV<EngineeringChange[]>('engineering-changes', generateSampleECOs())
  const safeEcos = ecos ?? []
  const [filterStatus, setFilterStatus] = useState<ECOStatus | 'All'>('All')
  const [filterPriority, setFilterPriority] = useState<ECOPriority | 'All'>('All')
  const [detailECO, setDetailECO] = useState<EngineeringChange | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    eco_number: '', title: '', priority: 'Medium' as ECOPriority, description: '',
    reason: '', affected_products_str: '', affected_documents_str: '',
    requested_by: '', assigned_to: '', estimated_cost: 0, notes: ''
  })

  const filtered = useMemo(() => {
    return safeEcos.filter(e => {
      const matchStatus = filterStatus === 'All' || e.status === filterStatus
      const matchPriority = filterPriority === 'All' || e.priority === filterPriority
      return matchStatus && matchPriority
    }).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [safeEcos, filterStatus, filterPriority])

  const handleStatusUpdate = (ecoId: string, status: ECOStatus) => {
    const now = new Date().toISOString()
    setEcos(prev => (prev ?? []).map(e => e.eco_id === ecoId ? {
      ...e, status, updated_at: now,
      implementation_date: status === 'Implemented' ? now.split('T')[0] : e.implementation_date,
      review_date: (status === 'Approved' || status === 'Rejected') && !e.review_date ? now.split('T')[0] : e.review_date,
    } : e))
    if (detailECO?.eco_id === ecoId) setDetailECO(prev => prev ? { ...prev, status } : null)
    toast.success(`ECO status updated to ${status}`)
  }

  const handleCreate = () => {
    if (!form.title || !form.eco_number) {
      toast.error('ECO number and title are required')
      return
    }
    const now = new Date().toISOString()
    const newECO: EngineeringChange = {
      eco_id: uuidv4(),
      eco_number: form.eco_number,
      title: form.title,
      status: 'Draft',
      priority: form.priority,
      description: form.description,
      reason: form.reason,
      affected_products: form.affected_products_str.split(',').map(s => s.trim()).filter(Boolean),
      affected_documents: form.affected_documents_str.split(',').map(s => s.trim()).filter(Boolean),
      requested_by: form.requested_by,
      assigned_to: form.assigned_to || null,
      reviewed_by: null,
      review_date: null,
      implementation_date: null,
      estimated_cost: form.estimated_cost,
      actual_cost: null,
      notes: form.notes,
      created_at: now,
      updated_at: now,
    }
    setEcos(prev => [newECO, ...(prev ?? [])])
    toast.success(`ECO ${form.eco_number} created`)
    setAddOpen(false)
    setForm({ eco_number: '', title: '', priority: 'Medium', description: '', reason: '', affected_products_str: '', affected_documents_str: '', requested_by: '', assigned_to: '', estimated_cost: 0, notes: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Engineering Changes</h2>
          <p className="text-muted-foreground">Manage ECOs and product/process change requests</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-2" /> New ECO
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_ECO_STATUSES.slice(0, 4).map(s => (
          <Card key={s} className="cursor-pointer" onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${filterStatus === s ? 'text-primary' : ''}`}>
                {safeEcos.filter(e => e.status === s).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical alert */}
      {safeEcos.filter(e => e.priority === 'Critical' && !['Implemented', 'Rejected'].includes(e.status)).length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <Warning size={16} /> Critical ECOs Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeEcos.filter(e => e.priority === 'Critical' && !['Implemented', 'Rejected'].includes(e.status)).map(e => (
              <div key={e.eco_id} className="text-sm flex gap-2 items-center">
                <span className="font-mono">{e.eco_number}</span>
                <span>–</span>
                <span>{e.title}</span>
                <Badge variant="outline" className="ml-auto text-xs">{e.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ECOStatus | 'All')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ALL_ECO_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v as ECOPriority | 'All')}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priorities</SelectItem>
            {ALL_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ECO #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected Products</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No ECOs found</TableCell>
                </TableRow>
              )}
              {filtered.map(eco => (
                <TableRow key={eco.eco_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailECO(eco)}>
                  <TableCell className="font-mono text-sm font-medium">{eco.eco_number}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm max-w-56 truncate">{eco.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant(eco.priority)} className={`text-xs ${priorityColorClass[eco.priority]}`}>{eco.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(eco.status)}>{eco.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-40">
                      {eco.affected_products.slice(0, 2).map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                      {eco.affected_products.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{eco.affected_products.length - 2}</Badge>
                      )}
                      {eco.affected_products.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{eco.requested_by}</TableCell>
                  <TableCell className="text-right text-sm">${eco.estimated_cost.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{eco.created_at.split('T')[0]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ECO Detail Dialog */}
      <Dialog open={!!detailECO} onOpenChange={open => !open && setDetailECO(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailECO && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gear size={18} /> {detailECO.eco_number}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base">{detailECO.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={priorityVariant(detailECO.priority)} className={priorityColorClass[detailECO.priority]}>{detailECO.priority}</Badge>
                    <Badge variant={statusVariant(detailECO.status)}>{detailECO.status}</Badge>
                  </div>
                </div>

                {/* Workflow */}
                <div className="flex items-center gap-2 flex-wrap">
                  {WORKFLOW.map((step, i) => {
                    const currentIdx = WORKFLOW.indexOf(detailECO.status as typeof WORKFLOW[number])
                    const isDone = i <= currentIdx && detailECO.status !== 'Rejected'
                    return (
                      <div key={step} className="flex items-center gap-2">
                        <button
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                          onClick={() => handleStatusUpdate(detailECO.eco_id, step)}
                        >
                          {step}
                        </button>
                        {i < WORKFLOW.length - 1 && <div className="h-px w-3 bg-border" />}
                      </div>
                    )
                  })}
                  <button
                    className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${detailECO.status === 'Rejected' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => handleStatusUpdate(detailECO.eco_id, 'Rejected')}
                  >
                    Rejected
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Requested By:</span> <span className="font-medium ml-1">{detailECO.requested_by}</span></div>
                  <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium ml-1">{detailECO.assigned_to || '—'}</span></div>
                  <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium ml-1">{detailECO.reviewed_by || '—'}</span></div>
                  <div><span className="text-muted-foreground">Review Date:</span> <span className="font-medium ml-1">{detailECO.review_date || '—'}</span></div>
                  <div><span className="text-muted-foreground">Implementation Date:</span> <span className="font-medium ml-1">{detailECO.implementation_date || '—'}</span></div>
                  <div><span className="text-muted-foreground">Est. Cost:</span> <span className="font-medium ml-1">${detailECO.estimated_cost.toLocaleString()}</span></div>
                  {detailECO.actual_cost !== null && (
                    <div><span className="text-muted-foreground">Actual Cost:</span> <span className="font-medium ml-1">${detailECO.actual_cost.toLocaleString()}</span></div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Description: </span>
                    <span className="text-muted-foreground">{detailECO.description}</span>
                  </div>
                  <div>
                    <span className="font-medium">Reason: </span>
                    <span className="text-muted-foreground">{detailECO.reason}</span>
                  </div>
                  {detailECO.affected_products.length > 0 && (
                    <div>
                      <span className="font-medium">Affected Products: </span>
                      <span className="text-muted-foreground">{detailECO.affected_products.join(', ')}</span>
                    </div>
                  )}
                  {detailECO.affected_documents.length > 0 && (
                    <div>
                      <span className="font-medium">Affected Documents: </span>
                      <span className="text-muted-foreground">{detailECO.affected_documents.join(', ')}</span>
                    </div>
                  )}
                  {detailECO.notes && (
                    <div>
                      <span className="font-medium">Notes: </span>
                      <span className="text-muted-foreground">{detailECO.notes}</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailECO(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add ECO Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Engineering Change Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ECO Number *</Label>
                <Input value={form.eco_number} onChange={e => setForm(f => ({ ...f, eco_number: e.target.value }))} placeholder="ECO-2024-0052" />
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as ECOPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of change" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What is being changed?" />
            </div>
            <div className="space-y-1">
              <Label>Reason / Justification</Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="Why is this change needed?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Requested By</Label>
                <Input value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Assigned To</Label>
                <Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Affected Products (comma-separated)</Label>
              <Input value={form.affected_products_str} onChange={e => setForm(f => ({ ...f, affected_products_str: e.target.value }))} placeholder="PG 64-22, PG 70-22" />
            </div>
            <div className="space-y-1">
              <Label>Affected Documents (comma-separated)</Label>
              <Input value={form.affected_documents_str} onChange={e => setForm(f => ({ ...f, affected_documents_str: e.target.value }))} placeholder="SPEC-0001, BOM-0001" />
            </div>
            <div className="space-y-1">
              <Label>Estimated Cost ($)</Label>
              <Input type="number" value={form.estimated_cost} min={0} onChange={e => setForm(f => ({ ...f, estimated_cost: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create ECO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
