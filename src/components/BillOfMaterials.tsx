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
import { Plus, Trash, TreeStructure } from '@phosphor-icons/react'
import type { BillOfMaterials as BOMItem, BOMLine, SpecStatus } from '@/lib/types'

const ALL_STATUSES: SpecStatus[] = ['Draft', 'In Review', 'Approved', 'Obsolete']

function generateSampleBOMs(): BOMItem[] {
  const now = new Date().toISOString()
  return [
    {
      bom_id: uuidv4(), bom_number: 'BOM-0001', product_name: 'PG 64-22 Blend',
      version: '2.1', status: 'Approved',
      description: 'Standard production formulation for PG 64-22 performance grade binder',
      lines: [
        { line_id: uuidv4(), item_number: 'AC-VACUUM', description: 'Vacuum Tower Bottoms', quantity: 88.5, unit: '%wt', unit_cost: 320, total_cost: 28320, supplier: 'Gulf States Refinery', lead_time_days: 5, notes: 'Base stock – consistency grade 150/200' },
        { line_id: uuidv4(), item_number: 'FLUX-AR', description: 'Aromatic Flux Oil', quantity: 8.0, unit: '%wt', unit_cost: 280, total_cost: 2240, supplier: 'Petrolia Supply', lead_time_days: 7, notes: '' },
        { line_id: uuidv4(), item_number: 'WAX-SASOBIT', description: 'Sasobit Warm Mix Additive', quantity: 1.5, unit: '%wt', unit_cost: 1800, total_cost: 2700, supplier: 'Sasol', lead_time_days: 14, notes: 'Optional WMA additive' },
        { line_id: uuidv4(), item_number: 'ANTI-STRIP', description: 'Liquid Anti-Strip Agent', quantity: 0.5, unit: '%wt', unit_cost: 3200, total_cost: 1600, supplier: 'Chemtek Inc.', lead_time_days: 10, notes: 'Amine-based' },
        { line_id: uuidv4(), item_number: 'POLYPHOSPHORIC', description: 'Polyphosphoric Acid', quantity: 0.25, unit: '%wt', unit_cost: 2400, total_cost: 600, supplier: 'ICL Group', lead_time_days: 21, notes: 'Stiffening agent' },
        { line_id: uuidv4(), item_number: 'NITROGEN', description: 'Nitrogen Gas (blanketing)', quantity: 2, unit: 'scf/ton', unit_cost: 4.5, total_cost: 9, supplier: 'Air Products', lead_time_days: 1, notes: '' },
      ],
      total_material_cost: 35469,
      created_by: 'Quality Manager',
      approved_by: 'Rachel Kim',
      created_at: now, updated_at: now
    },
    {
      bom_id: uuidv4(), bom_number: 'BOM-0002', product_name: 'PG 70-22 Polymer Modified',
      version: '1.8', status: 'Approved',
      description: 'SBS polymer modified binder for high traffic applications',
      lines: [
        { line_id: uuidv4(), item_number: 'AC-VACUUM', description: 'Vacuum Tower Bottoms', quantity: 82.0, unit: '%wt', unit_cost: 320, total_cost: 26240, supplier: 'Gulf States Refinery', lead_time_days: 5, notes: '' },
        { line_id: uuidv4(), item_number: 'SBS-POLYMER', description: 'SBS Polymer (linear)', quantity: 4.5, unit: '%wt', unit_cost: 2200, total_cost: 9900, supplier: 'Kraton Corp.', lead_time_days: 14, notes: 'Kraton D1101 or equivalent' },
        { line_id: uuidv4(), item_number: 'FLUX-AR', description: 'Aromatic Flux Oil', quantity: 12.0, unit: '%wt', unit_cost: 280, total_cost: 3360, supplier: 'Petrolia Supply', lead_time_days: 7, notes: '' },
        { line_id: uuidv4(), item_number: 'SULFUR-CROSS', description: 'Sulfur Crosslinker', quantity: 0.3, unit: '%wt', unit_cost: 800, total_cost: 240, supplier: 'IMC Global', lead_time_days: 5, notes: '' },
        { line_id: uuidv4(), item_number: 'ANTI-STRIP', description: 'Liquid Anti-Strip Agent', quantity: 0.5, unit: '%wt', unit_cost: 3200, total_cost: 1600, supplier: 'Chemtek Inc.', lead_time_days: 10, notes: '' },
      ],
      total_material_cost: 41340,
      created_by: 'Quality Manager',
      approved_by: 'Rachel Kim',
      created_at: now, updated_at: now
    },
    {
      bom_id: uuidv4(), bom_number: 'BOM-0003', product_name: 'RSBC-1 Emulsion',
      version: '1.2', status: 'In Review',
      description: 'Rubberized slow set chip seal emulsion formulation',
      lines: [
        { line_id: uuidv4(), item_number: 'AC-BASE', description: 'Asphalt Base (150/200 pen)', quantity: 60.0, unit: '%vol', unit_cost: 290, total_cost: 17400, supplier: 'Gulf States Refinery', lead_time_days: 5, notes: '' },
        { line_id: uuidv4(), item_number: 'CRUMB-RUBBER', description: 'Crumb Rubber Modifier', quantity: 8.0, unit: '%wt', unit_cost: 120, total_cost: 960, supplier: 'Recycled Rubber Co.', lead_time_days: 10, notes: '40-mesh tire rubber' },
        { line_id: uuidv4(), item_number: 'EMULSIFIER', description: 'Anionic Emulsifier', quantity: 1.2, unit: '%vol', unit_cost: 1400, total_cost: 1680, supplier: 'Akzo Nobel', lead_time_days: 14, notes: '' },
        { line_id: uuidv4(), item_number: 'WATER', description: 'Process Water', quantity: 30.0, unit: '%vol', unit_cost: 0.5, total_cost: 15, supplier: 'Utility', lead_time_days: 0, notes: '' },
      ],
      total_material_cost: 20055,
      created_by: 'Quality Manager',
      approved_by: null,
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

interface BOMLineForm {
  item_number: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  supplier: string
  lead_time_days: number
  notes: string
}

export function BillOfMaterials() {
  const [boms, setBoms] = useKV<BOMItem[]>('bills-of-materials', generateSampleBOMs())
  const safeBoms = boms ?? []
  const [filterStatus, setFilterStatus] = useState<SpecStatus | 'All'>('All')
  const [detailBOM, setDetailBOM] = useState<BOMItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ bom_number: '', product_name: '', version: '1.0', status: 'Draft' as SpecStatus, description: '', created_by: '' })
  const [lineItems, setLineItems] = useState<BOMLineForm[]>([
    { item_number: '', description: '', quantity: 1, unit: '%wt', unit_cost: 0, supplier: '', lead_time_days: 7, notes: '' }
  ])

  const filtered = useMemo(() =>
    safeBoms.filter(b => filterStatus === 'All' || b.status === filterStatus),
    [safeBoms, filterStatus]
  )

  const addLine = () => setLineItems(prev => [...prev, { item_number: '', description: '', quantity: 1, unit: '%wt', unit_cost: 0, supplier: '', lead_time_days: 7, notes: '' }])
  const removeLine = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx))
  const updateLine = (idx: number, field: keyof BOMLineForm, value: string | number) => {
    setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const handleCreate = () => {
    if (!form.product_name || !form.bom_number) {
      toast.error('BOM number and product name are required')
      return
    }
    const now = new Date().toISOString()
    const lines: BOMLine[] = lineItems.map(l => ({
      line_id: uuidv4(),
      item_number: l.item_number,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_cost: l.unit_cost,
      total_cost: l.quantity * l.unit_cost,
      supplier: l.supplier,
      lead_time_days: l.lead_time_days,
      notes: l.notes,
    }))
    const totalCost = lines.reduce((s, l) => s + l.total_cost, 0)
    const newBOM: BOMItem = {
      bom_id: uuidv4(),
      bom_number: form.bom_number,
      product_name: form.product_name,
      version: form.version,
      status: form.status,
      description: form.description,
      lines,
      total_material_cost: totalCost,
      created_by: form.created_by,
      approved_by: null,
      created_at: now,
      updated_at: now,
    }
    setBoms(prev => [newBOM, ...(prev ?? [])])
    toast.success(`BOM ${form.bom_number} created`)
    setAddOpen(false)
    setForm({ bom_number: '', product_name: '', version: '1.0', status: 'Draft', description: '', created_by: '' })
    setLineItems([{ item_number: '', description: '', quantity: 1, unit: '%wt', unit_cost: 0, supplier: '', lead_time_days: 7, notes: '' }])
  }

  const updateBOMStatus = (bomId: string, status: SpecStatus) => {
    const now = new Date().toISOString()
    setBoms(prev => (prev ?? []).map(b => b.bom_id === bomId ? { ...b, status, updated_at: now } : b))
    if (detailBOM?.bom_id === bomId) setDetailBOM(prev => prev ? { ...prev, status } : null)
    toast.success(`BOM status updated to ${status}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bill of Materials</h2>
          <p className="text-muted-foreground">Product formulation and ingredient management</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-2" /> New BOM
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
                <TableHead>BOM #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Cost/ton</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Lines</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No BOMs found</TableCell>
                </TableRow>
              )}
              {filtered.map(bom => (
                <TableRow key={bom.bom_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailBOM(bom)}>
                  <TableCell className="font-mono font-bold text-sm">{bom.bom_number}</TableCell>
                  <TableCell className="font-medium">{bom.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{bom.version}</TableCell>
                  <TableCell><Badge variant={statusVariant(bom.status)}>{bom.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">${bom.total_material_cost.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{bom.created_by}</TableCell>
                  <TableCell className="text-sm">{bom.approved_by || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">{bom.lines.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BOM Detail Dialog */}
      <Dialog open={!!detailBOM} onOpenChange={open => !open && setDetailBOM(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailBOM && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TreeStructure size={18} /> {detailBOM.bom_number} – {detailBOM.product_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Version:</span> <span className="font-medium ml-1">v{detailBOM.version}</span></div>
                  <div><span className="text-muted-foreground">Created By:</span> <span className="font-medium ml-1">{detailBOM.created_by}</span></div>
                  <div><span className="text-muted-foreground">Approved By:</span> <span className="font-medium ml-1">{detailBOM.approved_by || '—'}</span></div>
                  {detailBOM.description && (
                    <div className="col-span-3"><span className="text-muted-foreground">Description:</span> <span className="ml-1">{detailBOM.description}</span></div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Update Status:</span>
                  <Select value={detailBOM.status} onValueChange={v => updateBOMStatus(detailBOM.bom_id, v as SpecStatus)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Ingredient Lines</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Lead (days)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailBOM.lines.map(line => (
                        <TableRow key={line.line_id}>
                          <TableCell className="font-mono text-xs">{line.item_number}</TableCell>
                          <TableCell className="text-sm">{line.description}</TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-sm">{line.unit}</TableCell>
                          <TableCell className="text-right">${line.unit_cost.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">${line.total_cost.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{line.supplier}</TableCell>
                          <TableCell className="text-right text-sm">{line.lead_time_days}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right mt-2 text-sm font-bold">
                    Total Material Cost: ${detailBOM.total_material_cost.toLocaleString()}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailBOM(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add BOM Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Bill of Materials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>BOM Number *</Label>
                <Input value={form.bom_number} onChange={e => setForm(f => ({ ...f, bom_number: e.target.value }))} placeholder="BOM-0004" />
              </div>
              <div className="space-y-1">
                <Label>Product Name *</Label>
                <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="PG 64-22 Blend" />
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
                <Label>Created By</Label>
                <Input value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Ingredient Lines</Label>
                <Button size="sm" variant="outline" onClick={addLine}><Plus size={14} className="mr-1" /> Add Line</Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-2">
                    <div className="col-span-2"><Input placeholder="Item #" value={li.item_number} onChange={e => updateLine(idx, 'item_number', e.target.value)} /></div>
                    <div className="col-span-3"><Input placeholder="Description" value={li.description} onChange={e => updateLine(idx, 'description', e.target.value)} /></div>
                    <div className="col-span-1"><Input type="number" placeholder="Qty" value={li.quantity} min={0} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-1"><Input placeholder="Unit" value={li.unit} onChange={e => updateLine(idx, 'unit', e.target.value)} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Unit $" value={li.unit_cost} min={0} onChange={e => updateLine(idx, 'unit_cost', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Input placeholder="Supplier" value={li.supplier} onChange={e => updateLine(idx, 'supplier', e.target.value)} /></div>
                    <div className="col-span-1 flex justify-center">
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeLine(idx)} disabled={lineItems.length === 1}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-semibold mt-2">
                Total: ${lineItems.reduce((s, l) => s + l.quantity * l.unit_cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create BOM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
