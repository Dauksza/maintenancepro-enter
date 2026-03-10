import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { ProductionBatch, ProductionBatchStatus, AsphaltProduct, SalesOrder, PurchaseOrder } from '@/lib/types'
import { generateSampleProductionBatches } from '@/lib/sample-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Factory,
  Plus,
  Trash,
  CheckCircle,
  Clock,
  Warning,
  TrendUp,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const ASPHALT_PRODUCTS: AsphaltProduct[] = [
  'PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other'
]
const BATCH_STATUSES: ProductionBatchStatus[] = ['Planned', 'In Progress', 'Complete', 'Cancelled']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_YEAR = new Date().getFullYear()

/** Description keywords and part-number prefixes that identify raw-material PO lines */
const RAW_MATERIAL_DESC_PATTERNS = ['asphalt'] as const
const RAW_MATERIAL_PART_PREFIXES = ['ac-', 'pg'] as const

const isRawMaterialLine = (l: { description?: string; part_number?: string }) =>
  RAW_MATERIAL_DESC_PATTERNS.some(p => l.description?.toLowerCase().includes(p)) ||
  RAW_MATERIAL_PART_PREFIXES.some(p => l.part_number?.toLowerCase().startsWith(p))

const STATUS_COLORS: Record<ProductionBatchStatus, string> = {
  Planned: 'oklch(0.60 0.15 240)',
  'In Progress': 'oklch(0.72 0.18 55)',
  Complete: 'oklch(0.62 0.17 145)',
  Cancelled: 'oklch(0.88 0.01 255)',
}

const PRODUCT_COLORS = [
  'oklch(0.60 0.15 240)',
  'oklch(0.65 0.14 145)',
  'oklch(0.72 0.18 55)',
  'oklch(0.58 0.20 25)',
  'oklch(0.75 0.10 300)',
  'oklch(0.55 0.18 200)',
  'oklch(0.68 0.16 170)',
  'oklch(0.80 0.12 40)',
  'oklch(0.50 0.10 260)',
]

function statusBadge(status: ProductionBatchStatus) {
  if (status === 'Complete')
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{status}</Badge>
  if (status === 'In Progress')
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{status}</Badge>
  if (status === 'Cancelled')
    return <Badge variant="secondary" className="text-xs">{status}</Badge>
  return <Badge variant="outline" className="text-xs">{status}</Badge>
}

// ─── Sample data generator ────────────────────────────────────────────────────

// ─── Add/Edit Batch Dialog ────────────────────────────────────────────────────

interface BatchDialogProps {
  open: boolean
  onClose: () => void
  onSave: (batch: ProductionBatch) => void
  existing?: ProductionBatch | null
}

function BatchDialog({ open, onClose, onSave, existing }: BatchDialogProps) {
  const [form, setForm] = useState(() => ({
    batch_number: existing?.batch_number ?? '',
    date: existing?.date ?? new Date().toISOString().split('T')[0],
    product: existing?.product ?? 'PG 64-22' as AsphaltProduct,
    target_tons: existing?.target_tons?.toString() ?? '',
    actual_tons: existing?.actual_tons?.toString() ?? '0',
    status: existing?.status ?? 'Planned' as ProductionBatchStatus,
    operator: existing?.operator ?? '',
    downtime_minutes: existing?.downtime_minutes?.toString() ?? '0',
    notes: existing?.notes ?? '',
  }))

  const handleSave = () => {
    if (!form.batch_number.trim()) { toast.error('Batch number is required'); return }
    const target = parseFloat(form.target_tons)
    if (isNaN(target) || target <= 0) { toast.error('Enter a valid target quantity'); return }
    onSave({
      batch_id: existing?.batch_id ?? uuidv4(),
      batch_number: form.batch_number.trim(),
      date: form.date,
      product: form.product,
      target_tons: target,
      actual_tons: parseFloat(form.actual_tons) || 0,
      start_time: existing?.start_time ?? null,
      end_time: existing?.end_time ?? null,
      status: form.status,
      operator: form.operator.trim(),
      equipment_id: existing?.equipment_id ?? null,
      linked_order_id: existing?.linked_order_id ?? null,
      downtime_minutes: parseInt(form.downtime_minutes) || 0,
      notes: form.notes.trim(),
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit' : 'New'} Production Batch</DialogTitle>
          <DialogDescription>Record a production batch run</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Batch Number</Label>
              <Input placeholder="BATCH-2025-0001" value={form.batch_number} onChange={e => setForm(p => ({ ...p, batch_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={form.product} onValueChange={v => setForm(p => ({ ...p, product: v as AsphaltProduct }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPHALT_PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as ProductionBatchStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BATCH_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Target (tons)</Label>
              <Input type="number" min="0" step="1" placeholder="300" value={form.target_tons} onChange={e => setForm(p => ({ ...p, target_tons: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Actual (tons)</Label>
              <Input type="number" min="0" step="1" placeholder="0" value={form.actual_tons} onChange={e => setForm(p => ({ ...p, actual_tons: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Operator</Label>
              <Input placeholder="Operator name" value={form.operator} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Downtime (minutes)</Label>
              <Input type="number" min="0" step="1" placeholder="0" value={form.downtime_minutes} onChange={e => setForm(p => ({ ...p, downtime_minutes: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Batch</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductionTracking() {
  const [batches, setBatches] = useKV<ProductionBatch[]>('production-batches', generateSampleProductionBatches())
  const [salesOrders] = useKV<SalesOrder[]>('sales-orders', [])
  const [purchaseOrders] = useKV<PurchaseOrder[]>('purchase-orders', [])
  const [addOpen, setAddOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null)
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterStatus, setFilterStatus] = useState<ProductionBatchStatus | 'All'>('All')

  const safeBatches = batches || []
  const safeOrders = salesOrders || []
  const safePOs = purchaseOrders || []

  // Procurement alerts: open POs for raw materials that could affect production
  const openRawMaterialPOs = useMemo(() =>
    safePOs.filter(po => !['Received', 'Cancelled'].includes(po.status) &&
      po.lines.some(isRawMaterialLine)),
    [safePOs]
  )
  const pendingApprovalPOs = useMemo(() =>
    safePOs.filter(po => po.status === 'Pending Approval'),
    [safePOs]
  )

  const handleSaveBatch = (batch: ProductionBatch) => {
    setBatches(current => {
      const existing = (current || []).find(b => b.batch_id === batch.batch_id)
      if (existing) {
        return (current || []).map(b => b.batch_id === batch.batch_id ? batch : b)
      }
      return [...(current || []), batch]
    })
    toast.success(editBatch ? 'Batch updated' : 'Batch added')
    setEditBatch(null)
  }

  const handleDelete = (id: string) => {
    setBatches(c => (c || []).filter(b => b.batch_id !== id))
    toast.success('Batch deleted')
  }

  const handleLoadSample = () => {
    setBatches(generateSampleProductionBatches())
    toast.success('Sample production data loaded')
  }

  const yearBatches = useMemo(() =>
    safeBatches.filter(b => new Date(b.date).getFullYear() === filterYear),
    [safeBatches, filterYear])

  const completedBatches = useMemo(() => yearBatches.filter(b => b.status === 'Complete'), [yearBatches])

  const totalTarget = useMemo(() => yearBatches.reduce((s, b) => s + b.target_tons, 0), [yearBatches])
  const totalActual = useMemo(() => completedBatches.reduce((s, b) => s + b.actual_tons, 0), [completedBatches])
  const avgEfficiency = useMemo(() => {
    const eff = completedBatches.filter(b => b.target_tons > 0).map(b => b.actual_tons / b.target_tons)
    return eff.length > 0 ? eff.reduce((s, e) => s + e, 0) / eff.length : 0
  }, [completedBatches])
  const totalDowntime = useMemo(() => completedBatches.reduce((s, b) => s + b.downtime_minutes, 0), [completedBatches])

  const activeRuns = useMemo(() =>
    yearBatches
      .filter(batch => ['Planned', 'In Progress'].includes(batch.status))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6),
    [yearBatches])

  const operatorScorecard = useMemo(() => {
    const operatorMap = new Map<string, { operator: string; tons: number; batches: number; efficiency: number }>()

    completedBatches.forEach(batch => {
      const operatorName = batch.operator || 'Unassigned'
      const current = operatorMap.get(operatorName) || { operator: operatorName, tons: 0, batches: 0, efficiency: 0 }
      current.tons += batch.actual_tons
      current.batches += 1
      current.efficiency += batch.target_tons > 0 ? batch.actual_tons / batch.target_tons : 0
      operatorMap.set(operatorName, current)
    })

    return [...operatorMap.values()]
      .map(entry => ({
        ...entry,
        avgEfficiency: entry.batches > 0 ? Math.round((entry.efficiency / entry.batches) * 100) : 0
      }))
      .sort((a, b) => b.tons - a.tons)
      .slice(0, 5)
  }, [completedBatches])

  const demandAlignment = useMemo(() => {
    const openDemand = new Map<string, number>()
    const scheduledSupply = new Map<string, number>()

    safeOrders
      .filter(order => new Date(order.order_date).getFullYear() === filterYear)
      .filter(order => !['Paid', 'Cancelled'].includes(order.status))
      .forEach(order => {
        openDemand.set(order.product, (openDemand.get(order.product) || 0) + order.quantity_tons)
      })

    yearBatches
      .filter(batch => batch.status !== 'Cancelled')
      .forEach(batch => {
        const supplyTons = batch.status === 'Complete' ? batch.actual_tons : batch.target_tons
        scheduledSupply.set(batch.product, (scheduledSupply.get(batch.product) || 0) + supplyTons)
      })

    return [...new Set([...openDemand.keys(), ...scheduledSupply.keys()])]
      .map(product => {
        const demand = Math.round(openDemand.get(product) || 0)
        const supply = Math.round(scheduledSupply.get(product) || 0)

        return {
          product,
          demand,
          supply,
          gap: supply - demand
        }
      })
      .filter(item => item.demand > 0 || item.supply > 0)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 6)
  }, [filterYear, safeOrders, yearBatches])

  // Monthly production chart
  const monthlyData = useMemo(() => MONTHS.map((m, i) => {
    const month = i + 1
    const mBatches = yearBatches.filter(b => new Date(b.date).getMonth() + 1 === month)
    return {
      month: m,
      target: Math.round(mBatches.reduce((s, b) => s + b.target_tons, 0)),
      actual: Math.round(mBatches.filter(b => b.status === 'Complete').reduce((s, b) => s + b.actual_tons, 0)),
    }
  }), [yearBatches])

  // Product mix pie
  const productMix = useMemo(() => {
    const byProduct: Record<string, number> = {}
    completedBatches.forEach(b => {
      byProduct[b.product] = (byProduct[b.product] || 0) + b.actual_tons
    })
    return Object.entries(byProduct).map(([product, tons], i) => ({
      name: product, value: Math.round(tons), fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length]
    }))
  }, [completedBatches])

  // Filtered table
  const filteredBatches = useMemo(() =>
    yearBatches
      .filter(b => filterStatus === 'All' || b.status === filterStatus)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [yearBatches, filterStatus])

  if (safeBatches.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Production Tracking</h2>
          <p className="text-muted-foreground">Record and monitor asphalt production batches</p>
        </div>
        <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
            <Factory size={32} className="text-primary" weight="duotone" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Production Data</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Load sample data or log your first production batch
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleLoadSample}>Load Sample Data</Button>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus size={16} className="mr-2" />New Batch
            </Button>
          </div>
        </div>
        <BatchDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleSaveBatch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Production Tracking</h2>
          <p className="text-muted-foreground">Batch production logs, volume targets, and efficiency</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(filterYear)} onValueChange={v => setFilterYear(parseInt(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} className="mr-2" />New Batch
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Factory size={14} />Total Produced</CardDescription>
            <CardTitle className="text-2xl">{totalActual.toLocaleString()} t</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Target: {totalTarget.toLocaleString()} t</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendUp size={14} />Avg Efficiency</CardDescription>
            <CardTitle className="text-2xl">{(avgEfficiency * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{completedBatches.length} completed batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock size={14} />Total Downtime</CardDescription>
            <CardTitle className="text-2xl">{Math.round(totalDowntime / 60)} hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{totalDowntime} min total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CheckCircle size={14} />Batches YTD</CardDescription>
            <CardTitle className="text-2xl">{yearBatches.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {yearBatches.filter(b => b.status === 'In Progress').length} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Production Chart</TabsTrigger>
          <TabsTrigger value="mix">Product Mix</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="batches">Batch Log</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production – {filterYear}</CardTitle>
              <CardDescription>Target vs actual production by month (tons)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}t`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} tons`} />
                  <Legend />
                  <Bar dataKey="target" name="Target" fill="oklch(0.88 0.01 255)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="oklch(0.62 0.17 145)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mix" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Mix – {filterYear}</CardTitle>
                <CardDescription>Tons produced by product grade</CardDescription>
              </CardHeader>
              <CardContent>
                {productMix.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No completed batches for {filterYear}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={productMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {productMix.map(d => <Cell key={d.name} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} tons`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Product Grade</CardTitle>
                <CardDescription>Volume breakdown per product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productMix.map(p => (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">{p.value.toLocaleString()} t</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" role="progressbar" aria-valuenow={totalActual > 0 ? Math.round((p.value / totalActual) * 100) : 0} aria-valuemin={0} aria-valuemax={100} style={{ width: `${totalActual > 0 ? Math.round((p.value / totalActual) * 100) : 0}%`, background: p.fill }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Runs</CardTitle>
                <CardDescription>Planned and in-progress batches scheduled next</CardDescription>
              </CardHeader>
              <CardContent>
                {activeRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No planned or active batches for {filterYear}</p>
                ) : (
                  <div className="space-y-3">
                    {activeRuns.map(batch => (
                      <div key={batch.batch_id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{batch.batch_number}</p>
                            <p className="text-xs text-muted-foreground">{batch.product} · {batch.operator || 'No operator assigned'}</p>
                          </div>
                          {statusBadge(batch.status)}
                        </div>
                        <p className="text-sm mt-3">
                          {new Date(batch.date).toLocaleDateString()} · Target {batch.target_tons.toLocaleString()} tons
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operator Scorecard</CardTitle>
                <CardDescription>Top completed production contributors this year</CardDescription>
              </CardHeader>
              <CardContent>
                {operatorScorecard.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Complete batches to unlock operator rankings</p>
                ) : (
                  <div className="space-y-3">
                    {operatorScorecard.map(operator => (
                      <div key={operator.operator} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{operator.operator}</p>
                            <p className="text-xs text-muted-foreground">{operator.batches} completed batches</p>
                          </div>
                          <Badge variant={operator.avgEfficiency >= 90 ? 'default' : 'secondary'}>
                            {operator.avgEfficiency}% eff.
                          </Badge>
                        </div>
                        <p className="text-sm mt-3">{operator.tons.toLocaleString()} tons produced</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demand Alignment</CardTitle>
                <CardDescription>Open sales demand compared with scheduled production supply</CardDescription>
              </CardHeader>
              <CardContent>
                {demandAlignment.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No production or sales demand to compare yet</p>
                ) : (
                  <div className="space-y-4">
                    {demandAlignment.map(item => {
                      const coverage = item.demand > 0 ? Math.min(100, Math.round((item.supply / item.demand) * 100)) : 100
                      return (
                        <div key={item.product}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">{item.product}</span>
                            <span className={item.gap < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                              Demand {item.demand.toLocaleString()} t · Supply {item.supply.toLocaleString()} t
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.gap < 0 ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {(openRawMaterialPOs.length > 0 || pendingApprovalPOs.length > 0) && (
                  <div className="mt-4 rounded-xl border bg-muted/20 p-4 space-y-2">
                    <p className="text-sm font-medium">Procurement alerts</p>
                    {openRawMaterialPOs.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {openRawMaterialPOs.length} open raw material PO{openRawMaterialPOs.length > 1 ? 's' : ''} in progress — verify supply timing before scheduling new batches.
                      </p>
                    )}
                    {pendingApprovalPOs.length > 0 && (
                      <p className="text-xs text-amber-600">
                        {pendingApprovalPOs.length} PO{pendingApprovalPOs.length > 1 ? 's' : ''} awaiting approval may delay material delivery.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ProductionBatchStatus | 'All')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {BATCH_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filteredBatches.length} batches</span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[450px] overflow-y-auto">
                {filteredBatches.length === 0 && (
                  <p className="text-muted-foreground text-sm py-8 text-center">No batches found</p>
                )}
                {filteredBatches.map(batch => (
                  <div key={batch.batch_id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{batch.batch_number}</span>
                        <Badge variant="outline" className="text-xs">{batch.product}</Badge>
                        {statusBadge(batch.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {batch.date} · {batch.operator || 'No operator'}
                        {batch.status === 'Complete' && ` · Actual: ${batch.actual_tons.toLocaleString()} / ${batch.target_tons.toLocaleString()} t`}
                        {batch.status !== 'Complete' && ` · Target: ${batch.target_tons.toLocaleString()} t`}
                        {batch.downtime_minutes > 0 && ` · Downtime: ${batch.downtime_minutes} min`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {batch.status === 'Complete' && batch.target_tons > 0 && (
                        <span className={`text-xs font-medium ${batch.actual_tons / batch.target_tons >= 0.9 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {Math.round((batch.actual_tons / batch.target_tons) * 100)}%
                        </span>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditBatch(batch); setAddOpen(true) }}>
                        <Factory size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(batch.batch_id)}>
                        <Trash size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BatchDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditBatch(null) }}
        onSave={handleSaveBatch}
        existing={editBatch}
      />
    </div>
  )
}
