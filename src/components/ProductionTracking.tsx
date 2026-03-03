import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { ProductionBatch, ProductionBatchStatus, AsphaltProduct } from '@/lib/types'
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

function generateSampleBatches(): ProductionBatch[] {
  const batches: ProductionBatch[] = []
  const products: AsphaltProduct[] = ['PG 64-22', 'PG 70-22', 'PG 76-22', 'AC-20', 'Emulsion']
  const operators = ['John Smith', 'Maria Garcia', 'Bob Johnson', 'Sarah Lee']
  let batchNum = 1
  for (let month = 1; month <= 12; month++) {
    const count = 4 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(Math.random() * 28)
      const product = products[Math.floor(Math.random() * products.length)]
      const target = 200 + Math.floor(Math.random() * 300)
      const efficiency = 0.85 + Math.random() * 0.2
      const actual = Math.round(target * efficiency)
      const status: ProductionBatchStatus = month < new Date().getMonth() + 1 ? 'Complete' : month === new Date().getMonth() + 1 ? (Math.random() > 0.5 ? 'Complete' : 'In Progress') : 'Planned'
      batches.push({
        batch_id: uuidv4(),
        batch_number: `BATCH-${CURRENT_YEAR}-${String(batchNum++).padStart(4, '0')}`,
        date: `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        product,
        target_tons: target,
        actual_tons: status === 'Complete' ? actual : status === 'In Progress' ? Math.round(actual * 0.5) : 0,
        start_time: status !== 'Planned' ? `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T06:00:00Z` : null,
        end_time: status === 'Complete' ? `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T14:00:00Z` : null,
        status,
        operator: operators[Math.floor(Math.random() * operators.length)],
        equipment_id: null,
        linked_order_id: null,
        downtime_minutes: status === 'Complete' ? Math.floor(Math.random() * 45) : 0,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }
  return batches
}

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
  const [batches, setBatches] = useKV<ProductionBatch[]>('production-batches', [])
  const [addOpen, setAddOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null)
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterStatus, setFilterStatus] = useState<ProductionBatchStatus | 'All'>('All')

  const safeBatches = batches || []

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
    setBatches(generateSampleBatches())
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
