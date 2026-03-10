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
import { Plus, Trash, MagnifyingGlass, Receipt } from '@phosphor-icons/react'
import type { PurchaseOrder, POStatus, PurchaseOrderLine } from '@/lib/types'

function generateSamplePOs(): PurchaseOrder[] {
  const now = new Date().toISOString()
  return [
    {
      po_id: uuidv4(), po_number: 'PO-2024-0312', vendor_id: 'v1', vendor_name: 'Gulf States Asphalt Co.',
      status: 'Ordered', order_date: '2024-11-01', expected_delivery_date: '2024-11-08',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'AC-PG64-22', description: 'PG 64-22 Asphalt Cement', quantity_ordered: 250, quantity_received: 0, unit_cost: 420, total_cost: 105000, unit_of_measure: 'Ton', notes: '' }
      ],
      subtotal: 105000, tax: 0, shipping: 1500, total: 106500,
      requested_by: 'John Davis', approved_by: 'Rachel Kim', notes: 'Rush order',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0311', vendor_id: 'v2', vendor_name: 'Petrolia Supply Inc.',
      status: 'Pending Approval', order_date: '2024-10-30', expected_delivery_date: '2024-11-05',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'FLUX-10', description: 'Aromatic Flux Oil', quantity_ordered: 5000, quantity_received: 0, unit_cost: 2.10, total_cost: 10500, unit_of_measure: 'Gallon', notes: '' },
        { line_id: uuidv4(), part_number: 'MOD-SBS', description: 'SBS Polymer Modifier', quantity_ordered: 20, quantity_received: 0, unit_cost: 1850, total_cost: 37000, unit_of_measure: 'Drum', notes: '' }
      ],
      subtotal: 47500, tax: 0, shipping: 800, total: 48300,
      requested_by: 'Tom Hall', approved_by: null, notes: '',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0310', vendor_id: 'v3', vendor_name: 'Southern Safety Equipment',
      status: 'Received', order_date: '2024-10-20', expected_delivery_date: '2024-10-23',
      actual_delivery_date: '2024-10-23',
      lines: [
        { line_id: uuidv4(), part_number: 'PPE-HARD', description: 'Hard Hat Class E', quantity_ordered: 20, quantity_received: 20, unit_cost: 24.99, total_cost: 499.80, unit_of_measure: 'EA', notes: '' },
        { line_id: uuidv4(), part_number: 'PPE-GLOVE', description: 'Heat Resistant Gloves', quantity_ordered: 50, quantity_received: 50, unit_cost: 18.50, total_cost: 925.00, unit_of_measure: 'Pair', notes: '' }
      ],
      subtotal: 1424.80, tax: 117.55, shipping: 45, total: 1587.35,
      requested_by: 'Safety Dept', approved_by: 'Rachel Kim', notes: 'Annual safety stock',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0309', vendor_id: 'v4', vendor_name: 'Delta Mechanical Services',
      status: 'Approved', order_date: '2024-10-28', expected_delivery_date: '2024-11-04',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'SVC-PM01', description: 'Pump Overhaul Service', quantity_ordered: 1, quantity_received: 0, unit_cost: 8500, total_cost: 8500, unit_of_measure: 'Job', notes: 'Pump #3' }
      ],
      subtotal: 8500, tax: 0, shipping: 0, total: 8500,
      requested_by: 'Maintenance', approved_by: 'Tom Hall', notes: '',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0308', vendor_id: 'v1', vendor_name: 'Gulf States Asphalt Co.',
      status: 'Draft', order_date: '2024-10-31', expected_delivery_date: '2024-11-10',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'AC-PG70-22', description: 'PG 70-22 Asphalt Cement', quantity_ordered: 150, quantity_received: 0, unit_cost: 445, total_cost: 66750, unit_of_measure: 'Ton', notes: '' }
      ],
      subtotal: 66750, tax: 0, shipping: 1200, total: 67950,
      requested_by: 'John Davis', approved_by: null, notes: 'Pending board approval',
      created_at: now, updated_at: now
    },
  ]
}

const ALL_STATUSES: POStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Cancelled']

function statusVariant(s: POStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Received') return 'default'
  if (s === 'Cancelled') return 'destructive'
  if (s === 'Draft') return 'secondary'
  return 'outline'
}

interface LineFormItem {
  part_number: string
  description: string
  quantity_ordered: number
  unit_cost: number
  unit_of_measure: string
  notes: string
}

export function PurchaseOrders() {
  const [pos, setPos] = useKV<PurchaseOrder[]>('purchase-orders', generateSamplePOs())
  const safePOs = pos ?? []
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<POStatus | 'All'>('All')
  const [newOpen, setNewOpen] = useState(false)
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null)

  // New PO form state
  const [form, setForm] = useState({ vendor_name: '', expected_delivery_date: '', requested_by: '', notes: '' })
  const [lineItems, setLineItems] = useState<LineFormItem[]>([
    { part_number: '', description: '', quantity_ordered: 1, unit_cost: 0, unit_of_measure: 'EA', notes: '' }
  ])

  const filtered = useMemo(() => {
    return safePOs.filter(po => {
      const matchSearch = po.po_number.toLowerCase().includes(search.toLowerCase()) ||
        po.vendor_name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'All' || po.status === filterStatus
      return matchSearch && matchStatus
    }).sort((a, b) => b.order_date.localeCompare(a.order_date))
  }, [safePOs, search, filterStatus])

  const addLineItem = () => {
    setLineItems(prev => [...prev, { part_number: '', description: '', quantity_ordered: 1, unit_cost: 0, unit_of_measure: 'EA', notes: '' }])
  }

  const removeLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateLineItem = (idx: number, field: keyof LineFormItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleCreate = () => {
    if (!form.vendor_name || !form.expected_delivery_date) {
      toast.error('Vendor name and expected delivery date are required')
      return
    }
    const now = new Date().toISOString()
    const lines: PurchaseOrderLine[] = lineItems.map(li => ({
      line_id: uuidv4(),
      part_number: li.part_number,
      description: li.description,
      quantity_ordered: li.quantity_ordered,
      quantity_received: 0,
      unit_cost: li.unit_cost,
      total_cost: li.quantity_ordered * li.unit_cost,
      unit_of_measure: li.unit_of_measure,
      notes: li.notes,
    }))
    const subtotal = lines.reduce((s, l) => s + l.total_cost, 0)
    const newPO: PurchaseOrder = {
      po_id: uuidv4(),
      po_number: `PO-${new Date().getFullYear()}-${String(safePOs.length + 1).padStart(4, '0')}`,
      vendor_id: uuidv4(),
      vendor_name: form.vendor_name,
      status: 'Draft',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: form.expected_delivery_date,
      actual_delivery_date: null,
      lines,
      subtotal,
      tax: 0,
      shipping: 0,
      total: subtotal,
      requested_by: form.requested_by,
      approved_by: null,
      notes: form.notes,
      created_at: now,
      updated_at: now,
    }
    setPos(prev => [newPO, ...(prev ?? [])])
    toast.success(`PO ${newPO.po_number} created`)
    setNewOpen(false)
    setForm({ vendor_name: '', expected_delivery_date: '', requested_by: '', notes: '' })
    setLineItems([{ part_number: '', description: '', quantity_ordered: 1, unit_cost: 0, unit_of_measure: 'EA', notes: '' }])
  }

  const handleStatusUpdate = (poId: string, status: POStatus) => {
    const now = new Date().toISOString()
    setPos(prev => (prev ?? []).map(p => {
      if (p.po_id !== poId) return p
      // When marking Received, set all line items' quantity_received to their quantity_ordered
      const updatedLines = status === 'Received'
        ? p.lines.map(l => ({ ...l, quantity_received: l.quantity_ordered }))
        : p.lines
      return {
        ...p,
        status,
        lines: updatedLines,
        updated_at: now,
        actual_delivery_date: status === 'Received' ? new Date().toISOString().split('T')[0] : p.actual_delivery_date,
      }
    }))
    if (detailPO?.po_id === poId) {
      setDetailPO(prev => {
        if (!prev) return null
        const updatedLines = status === 'Received'
          ? prev.lines.map(l => ({ ...l, quantity_received: l.quantity_ordered }))
          : prev.lines
        return { ...prev, status, lines: updatedLines }
      })
    }
    toast.success(`PO status updated to ${status}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage and track all purchase orders</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} className="mr-2" /> New PO
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search PO# or vendor..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as POStatus | 'All')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
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
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No purchase orders found</TableCell>
                </TableRow>
              )}
              {filtered.map(po => (
                <TableRow key={po.po_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailPO(po)}>
                  <TableCell className="font-mono text-sm font-medium">{po.po_number}</TableCell>
                  <TableCell>{po.vendor_name}</TableCell>
                  <TableCell>{po.order_date}</TableCell>
                  <TableCell>{po.expected_delivery_date}</TableCell>
                  <TableCell className="text-right font-semibold">${po.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New PO Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt size={18} /> New Purchase Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Vendor Name *</Label>
                <Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Gulf States Asphalt Co." />
              </div>
              <div className="space-y-1">
                <Label>Expected Delivery *</Label>
                <Input type="date" value={form.expected_delivery_date} onChange={e => setForm(f => ({ ...f, expected_delivery_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Requested By</Label>
                <Input value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} placeholder="Your name" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button size="sm" variant="outline" onClick={addLineItem}>
                  <Plus size={14} className="mr-1" /> Add Line
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-2">
                    <div className="col-span-2">
                      <Input placeholder="Part #" value={li.part_number} onChange={e => updateLineItem(idx, 'part_number', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Input placeholder="Description" value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Qty" value={li.quantity_ordered} min={1}
                        onChange={e => updateLineItem(idx, 'quantity_ordered', parseFloat(e.target.value) || 1)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Unit cost" value={li.unit_cost} min={0}
                        onChange={e => updateLineItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="UOM" value={li.unit_of_measure} onChange={e => updateLineItem(idx, 'unit_of_measure', e.target.value)} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeLineItem(idx)} disabled={lineItems.length === 1}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-semibold mt-2">
                Subtotal: ${lineItems.reduce((s, li) => s + li.quantity_ordered * li.unit_cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Purchase Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Detail Dialog */}
      <Dialog open={!!detailPO} onOpenChange={open => !open && setDetailPO(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailPO && (
            <>
              <DialogHeader>
                <DialogTitle>{detailPO.po_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium ml-1">{detailPO.vendor_name}</span></div>
                  <div><span className="text-muted-foreground">Order Date:</span> <span className="font-medium ml-1">{detailPO.order_date}</span></div>
                  <div><span className="text-muted-foreground">Expected Delivery:</span> <span className="font-medium ml-1">{detailPO.expected_delivery_date}</span></div>
                  <div><span className="text-muted-foreground">Actual Delivery:</span> <span className="font-medium ml-1">{detailPO.actual_delivery_date || '—'}</span></div>
                  <div><span className="text-muted-foreground">Requested By:</span> <span className="font-medium ml-1">{detailPO.requested_by}</span></div>
                  <div><span className="text-muted-foreground">Approved By:</span> <span className="font-medium ml-1">{detailPO.approved_by || '—'}</span></div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Update Status:</span>
                  <Select value={detailPO.status} onValueChange={(v) => handleStatusUpdate(detailPO.po_id, v as POStatus)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty Ordered</TableHead>
                        <TableHead className="text-right">Qty Received</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailPO.lines.map(line => (
                        <TableRow key={line.line_id}>
                          <TableCell className="font-mono text-xs">{line.part_number}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">{line.quantity_ordered} {line.unit_of_measure}</TableCell>
                          <TableCell className="text-right">{line.quantity_received} {line.unit_of_measure}</TableCell>
                          <TableCell className="text-right">${line.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-medium">${line.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="border-t mt-2 pt-2 space-y-1 text-sm text-right">
                    <div>Subtotal: <span className="font-medium">${detailPO.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    {detailPO.tax > 0 && <div>Tax: <span className="font-medium">${detailPO.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    {detailPO.shipping > 0 && <div>Shipping: <span className="font-medium">${detailPO.shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    <div className="text-base font-bold">Total: ${detailPO.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
                {detailPO.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span> <span>{detailPO.notes}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailPO(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
