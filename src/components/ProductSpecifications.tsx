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
import { Plus, ClipboardText, PencilSimple } from '@phosphor-icons/react'
import type { ProductSpec, SpecStatus } from '@/lib/types'

const ALL_STATUSES: SpecStatus[] = ['Draft', 'In Review', 'Approved', 'Obsolete']

function generateSampleSpecs(): ProductSpec[] {
  const now = new Date().toISOString()
  return [
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0001', product_name: 'PG 64-22', version: '3.2',
      status: 'Approved', category: 'Asphalt Binder',
      description: 'Performance graded asphalt cement for moderate climate applications',
      min_penetration: null, max_penetration: null,
      min_viscosity: null, max_viscosity: null,
      min_softening_point: 46, max_softening_point: null,
      test_methods: ['AASHTO M320', 'ASTM D36', 'ASTM D5', 'ASTM D2872'],
      approved_by: 'Rachel Kim', approved_date: '2024-01-15', effective_date: '2024-02-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0002', product_name: 'PG 70-22', version: '2.5',
      status: 'Approved', category: 'Asphalt Binder',
      description: 'Performance graded asphalt for high-temperature climate applications',
      min_penetration: null, max_penetration: null,
      min_viscosity: null, max_viscosity: null,
      min_softening_point: 58, max_softening_point: null,
      test_methods: ['AASHTO M320', 'ASTM D36', 'ASTM D5', 'ASTM D2872', 'ASTM D7175'],
      approved_by: 'Rachel Kim', approved_date: '2024-01-15', effective_date: '2024-02-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0003', product_name: 'AC-20', version: '1.8',
      status: 'Approved', category: 'Asphalt Cement',
      description: 'Penetration graded asphalt cement – AC-20 viscosity grade',
      min_penetration: 60, max_penetration: 80,
      min_viscosity: 2000, max_viscosity: null,
      min_softening_point: 48, max_softening_point: null,
      test_methods: ['ASTM D36', 'ASTM D5', 'ASTM D92', 'ASTM D113'],
      approved_by: 'Quality Manager', approved_date: '2023-11-01', effective_date: '2024-01-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0004', product_name: 'RSBC-1', version: '2.1',
      status: 'Approved', category: 'Rubberized Asphalt',
      description: 'Rubberized slow set bituminous chip seal emulsion',
      min_penetration: null, max_penetration: null,
      min_viscosity: 100, max_viscosity: 400,
      min_softening_point: null, max_softening_point: null,
      test_methods: ['ASTM D2397', 'ASTM D6931', 'ISSA TB-109'],
      approved_by: 'Rachel Kim', approved_date: '2024-03-01', effective_date: '2024-04-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0005', product_name: 'SS-1h', version: '1.4',
      status: 'Approved', category: 'Emulsion',
      description: 'Slow-setting anionic asphalt emulsion for tack and prime coat',
      min_penetration: null, max_penetration: null,
      min_viscosity: 20, max_viscosity: 100,
      min_softening_point: null, max_softening_point: null,
      test_methods: ['ASTM D977', 'ASTM D244', 'AASHTO M140'],
      approved_by: 'Quality Manager', approved_date: '2023-06-01', effective_date: '2023-07-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0006', product_name: 'PG 76-22', version: '1.0',
      status: 'In Review', category: 'Asphalt Binder',
      description: 'High-performance grade binder for heavy traffic and extreme temperatures',
      min_penetration: null, max_penetration: null,
      min_viscosity: null, max_viscosity: null,
      min_softening_point: 64, max_softening_point: null,
      test_methods: ['AASHTO M320', 'ASTM D7175', 'ASTM D2872'],
      approved_by: null, approved_date: null, effective_date: '2025-01-01',
      created_at: now, updated_at: now
    },
    {
      spec_id: uuidv4(), spec_number: 'SPEC-0007', product_name: 'AC-10', version: '1.0',
      status: 'Obsolete', category: 'Asphalt Cement',
      description: 'Legacy viscosity graded AC-10 – superseded by performance grade',
      min_penetration: 80, max_penetration: 100,
      min_viscosity: 1000, max_viscosity: null,
      min_softening_point: 44, max_softening_point: null,
      test_methods: ['ASTM D36', 'ASTM D5'],
      approved_by: 'Quality Manager', approved_date: '2015-01-01', effective_date: '2015-01-01',
      created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: SpecStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Approved') return 'default'
  if (s === 'Obsolete') return 'destructive'
  if (s === 'In Review') return 'outline'
  return 'secondary'
}

const emptyForm = {
  spec_number: '', product_name: '', version: '1.0', status: 'Draft' as SpecStatus,
  category: '', description: '',
  min_penetration: '', max_penetration: '',
  min_viscosity: '', max_viscosity: '',
  min_softening_point: '', max_softening_point: '',
  test_methods_str: '',
  effective_date: '', notes: ''
}

export function ProductSpecifications() {
  const [specs, setSpecs] = useKV<ProductSpec[]>('product-specs', generateSampleSpecs())
  const safeSpecs = specs ?? []
  const [filterStatus, setFilterStatus] = useState<SpecStatus | 'All'>('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSpec, setEditSpec] = useState<ProductSpec | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() =>
    safeSpecs.filter(s => filterStatus === 'All' || s.status === filterStatus),
    [safeSpecs, filterStatus]
  )

  const openAdd = () => {
    setEditSpec(null)
    setForm({ ...emptyForm, spec_number: `SPEC-${String(safeSpecs.length + 1).padStart(4, '0')}` })
    setDialogOpen(true)
  }

  const openEdit = (spec: ProductSpec) => {
    setEditSpec(spec)
    setForm({
      spec_number: spec.spec_number,
      product_name: spec.product_name,
      version: spec.version,
      status: spec.status,
      category: spec.category,
      description: spec.description,
      min_penetration: spec.min_penetration !== null ? String(spec.min_penetration) : '',
      max_penetration: spec.max_penetration !== null ? String(spec.max_penetration) : '',
      min_viscosity: spec.min_viscosity !== null ? String(spec.min_viscosity) : '',
      max_viscosity: spec.max_viscosity !== null ? String(spec.max_viscosity) : '',
      min_softening_point: spec.min_softening_point !== null ? String(spec.min_softening_point) : '',
      max_softening_point: spec.max_softening_point !== null ? String(spec.max_softening_point) : '',
      test_methods_str: spec.test_methods.join(', '),
      effective_date: spec.effective_date,
      notes: ''
    })
    setDialogOpen(true)
  }

  const parseOptionalNumber = (val: string): number | null => {
    const n = parseFloat(val)
    return isNaN(n) ? null : n
  }

  const handleSave = () => {
    if (!form.product_name || !form.spec_number) {
      toast.error('Product name and spec number are required')
      return
    }
    const now = new Date().toISOString()
    const specData: Omit<ProductSpec, 'spec_id' | 'created_at'> & { spec_id?: string; created_at?: string } = {
      spec_number: form.spec_number,
      product_name: form.product_name,
      version: form.version,
      status: form.status,
      category: form.category,
      description: form.description,
      min_penetration: parseOptionalNumber(form.min_penetration),
      max_penetration: parseOptionalNumber(form.max_penetration),
      min_viscosity: parseOptionalNumber(form.min_viscosity),
      max_viscosity: parseOptionalNumber(form.max_viscosity),
      min_softening_point: parseOptionalNumber(form.min_softening_point),
      max_softening_point: parseOptionalNumber(form.max_softening_point),
      test_methods: form.test_methods_str.split(',').map(s => s.trim()).filter(Boolean),
      approved_by: editSpec?.approved_by ?? null,
      approved_date: editSpec?.approved_date ?? null,
      effective_date: form.effective_date,
      updated_at: now,
    }
    if (editSpec) {
      setSpecs(prev => (prev ?? []).map(s => s.spec_id === editSpec.spec_id
        ? { ...s, ...specData, updated_at: now } : s))
      toast.success(`${form.product_name} updated`)
    } else {
      const newSpec: ProductSpec = { ...specData, spec_id: uuidv4(), created_at: now, updated_at: now } as ProductSpec
      setSpecs(prev => [newSpec, ...(prev ?? [])])
      toast.success(`${form.product_name} spec created`)
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Specifications</h2>
          <p className="text-muted-foreground">Manage asphalt product specs and test requirements</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> New Spec
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as SpecStatus | 'All')}>
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
                <TableHead>Spec #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Test Methods</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No specs found</TableCell>
                </TableRow>
              )}
              {filtered.map(spec => (
                <TableRow key={spec.spec_id}>
                  <TableCell className="font-mono text-sm">{spec.spec_number}</TableCell>
                  <TableCell className="font-semibold">{spec.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{spec.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{spec.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(spec.status)}>{spec.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{spec.effective_date}</TableCell>
                  <TableCell className="text-sm">{spec.approved_by || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {spec.test_methods.slice(0, 2).map(tm => (
                        <Badge key={tm} variant="secondary" className="text-xs font-mono">{tm}</Badge>
                      ))}
                      {spec.test_methods.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{spec.test_methods.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(spec)}><PencilSimple size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardText size={18} /> {editSpec ? 'Edit Specification' : 'New Product Specification'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Spec Number *</Label>
              <Input value={form.spec_number} onChange={e => setForm(f => ({ ...f, spec_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Product Name *</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="e.g. PG 64-22" />
            </div>
            <div className="space-y-1">
              <Label>Version</Label>
              <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as SpecStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Asphalt Binder" />
            </div>
            <div className="space-y-1">
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold mb-2">Physical Properties</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Min Penetration</Label>
                  <Input value={form.min_penetration} onChange={e => setForm(f => ({ ...f, min_penetration: e.target.value }))} placeholder="dmm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Penetration</Label>
                  <Input value={form.max_penetration} onChange={e => setForm(f => ({ ...f, max_penetration: e.target.value }))} placeholder="dmm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Viscosity</Label>
                  <Input value={form.min_viscosity} onChange={e => setForm(f => ({ ...f, min_viscosity: e.target.value }))} placeholder="P or cSt" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Viscosity</Label>
                  <Input value={form.max_viscosity} onChange={e => setForm(f => ({ ...f, max_viscosity: e.target.value }))} placeholder="P or cSt" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Softening Pt (°C)</Label>
                  <Input value={form.min_softening_point} onChange={e => setForm(f => ({ ...f, min_softening_point: e.target.value }))} placeholder="°C" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Softening Pt (°C)</Label>
                  <Input value={form.max_softening_point} onChange={e => setForm(f => ({ ...f, max_softening_point: e.target.value }))} placeholder="°C" />
                </div>
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Test Methods (comma-separated)</Label>
              <Input value={form.test_methods_str} onChange={e => setForm(f => ({ ...f, test_methods_str: e.target.value }))} placeholder="AASHTO M320, ASTM D36, ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editSpec ? 'Save Changes' : 'Create Spec'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
