import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { SalesOrder, SalesOrderStatus, AsphaltProduct, ProductionBatch, TankerLoadingTicket } from '@/lib/types'
import { generateSampleSalesOrders } from '@/lib/sample-data'
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
} from 'recharts'
import {
  ShoppingCart,
  Plus,
  Trash,
  Pencil,
  TrendUp,
  CurrencyDollar,
  CheckCircle,
  Clock,
  Truck,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const ASPHALT_PRODUCTS: AsphaltProduct[] = [
  'PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other'
]
const SALES_STATUSES: SalesOrderStatus[] = ['Quote', 'Confirmed', 'In Production', 'Ready', 'Delivered', 'Invoiced', 'Paid', 'Cancelled']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_YEAR = new Date().getFullYear()

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/**
 * Computes the production fulfillment status for a sales order given the
 * production batches that reference it via linked_order_id.
 */
function getFulfillmentStatus(
  order: SalesOrder,
  linkedBatches: ProductionBatch[]
): { inProgress: boolean; pct: number; fullyProduced: boolean } {
  if (order.quantity_tons <= 0) return { inProgress: false, pct: 0, fullyProduced: false }
  const inProgress = linkedBatches.some(b => b.status === 'In Progress')
  const producedTons = linkedBatches
    .filter(b => b.status === 'Complete')
    .reduce((s, b) => s + b.actual_tons, 0)
  const pct = Math.min(100, Math.round((producedTons / order.quantity_tons) * 100))
  return { inProgress, pct, fullyProduced: !inProgress && producedTons >= order.quantity_tons }
}

const STATUS_STYLES: Record<SalesOrderStatus, string> = {
  Quote: 'bg-slate-100 text-slate-700 border-slate-200',
  Confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Production': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Ready: 'bg-purple-100 text-purple-700 border-purple-200',
  Delivered: 'bg-green-100 text-green-700 border-green-200',
  Invoiced: 'bg-orange-100 text-orange-700 border-orange-200',
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

function statusBadge(status: SalesOrderStatus) {
  return <Badge className={`text-xs ${STATUS_STYLES[status]}`}>{status}</Badge>
}

// ─── Sample data generator ─────────────────────────────────────────────────────

// ─── Order Dialog ─────────────────────────────────────────────────────────────

interface OrderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (order: SalesOrder) => void
  existing?: SalesOrder | null
}

function OrderDialog({ open, onClose, onSave, existing }: OrderDialogProps) {
  const [form, setForm] = useState(() => ({
    order_number: existing?.order_number ?? '',
    customer_name: existing?.customer_name ?? '',
    customer_contact: existing?.customer_contact ?? '',
    order_date: existing?.order_date ?? new Date().toISOString().split('T')[0],
    delivery_date: existing?.delivery_date ?? '',
    product: existing?.product ?? 'PG 64-22' as AsphaltProduct,
    quantity_tons: existing?.quantity_tons?.toString() ?? '',
    unit_price: existing?.unit_price_per_ton?.toString() ?? '',
    status: existing?.status ?? 'Quote' as SalesOrderStatus,
    invoice_number: existing?.invoice_number ?? '',
    notes: existing?.notes ?? '',
  }))

  const totalPrice = useMemo(() => {
    const qty = parseFloat(form.quantity_tons) || 0
    const price = parseFloat(form.unit_price) || 0
    return qty * price
  }, [form.quantity_tons, form.unit_price])

  const handleSave = () => {
    if (!form.customer_name.trim()) { toast.error('Customer name is required'); return }
    if (!form.order_number.trim()) { toast.error('Order number is required'); return }
    const qty = parseFloat(form.quantity_tons)
    const price = parseFloat(form.unit_price)
    if (isNaN(qty) || qty <= 0) { toast.error('Enter a valid quantity'); return }
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid unit price'); return }
    onSave({
      order_id: existing?.order_id ?? uuidv4(),
      order_number: form.order_number.trim(),
      customer_name: form.customer_name.trim(),
      customer_contact: form.customer_contact.trim() || null,
      order_date: form.order_date,
      delivery_date: form.delivery_date || form.order_date,
      product: form.product,
      quantity_tons: qty,
      unit_price_per_ton: price,
      total_price: qty * price,
      status: form.status,
      invoice_number: form.invoice_number.trim() || null,
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
          <DialogTitle>{existing ? 'Edit' : 'New'} Sales Order</DialogTitle>
          <DialogDescription>Record a customer sales order</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Order Number</Label>
              <Input placeholder="SO-2025-0001" value={form.order_number} onChange={e => setForm(p => ({ ...p, order_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as SalesOrderStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALES_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Customer Name</Label>
            <Input placeholder="Customer or organization" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Order Date</Label>
              <Input type="date" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Delivery Date</Label>
              <Input type="date" value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={form.product} onValueChange={v => setForm(p => ({ ...p, product: v as AsphaltProduct }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPHALT_PRODUCTS.map(pr => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantity (tons)</Label>
              <Input type="number" min="0" step="1" placeholder="100" value={form.quantity_tons} onChange={e => setForm(p => ({ ...p, quantity_tons: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Unit Price ($/ton)</Label>
              <Input type="number" min="0" step="0.01" placeholder="650.00" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Total Price</Label>
              <Input disabled value={fmt(totalPrice)} className="bg-muted" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Invoice # (optional)</Label>
            <Input placeholder="INV-2025-00001" value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Order</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SalesOrders() {
  const [orders, setOrders] = useKV<SalesOrder[]>('sales-orders', generateSampleSalesOrders())
  const [productionBatches] = useKV<ProductionBatch[]>('production-batches', [])
  const [loadingTickets, setLoadingTickets] = useKV<TankerLoadingTicket[]>('tanker-loading-tickets', [])
  const [addOpen, setAddOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<SalesOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<SalesOrderStatus | 'All'>('All')
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)

  const safeOrders = orders || []
  const safeBatches = productionBatches || []

  // Map order_id → linked production batches for fulfillment status display
  const batchesByOrderId = useMemo(() => {
    const map = new Map<string, ProductionBatch[]>()
    safeBatches.forEach(batch => {
      if (batch.linked_order_id) {
        const existing = map.get(batch.linked_order_id) || []
        map.set(batch.linked_order_id, [...existing, batch])
      }
    })
    return map
  }, [safeBatches])

  const handleSave = (order: SalesOrder) => {
    setOrders(current => {
      const existing = (current || []).find(o => o.order_id === order.order_id)
      if (existing) return (current || []).map(o => o.order_id === order.order_id ? order : o)
      return [...(current || []), order]
    })
    toast.success(editOrder ? 'Order updated' : 'Order created')
    setEditOrder(null)
  }

  const handleDelete = (id: string) => {
    setOrders(c => (c || []).filter(o => o.order_id !== id))
    toast.success('Order deleted')
  }

  const handleLoadSample = () => {
    setOrders(generateSampleSalesOrders())
    toast.success('Sample sales data loaded')
  }

  const handleDispatchToLoading = (order: SalesOrder) => {
    const existing = (loadingTickets || [])
    const today = new Date()
    const prefix = `LT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const todayTickets = existing.filter(t => t.ticket_number.startsWith(prefix))
    const seq = todayTickets.length + 1
    const ticketNumber = `${prefix}-${String(seq).padStart(3, '0')}`
    const now = new Date().toISOString()
    const newTicket: TankerLoadingTicket = {
      ticket_id: uuidv4(),
      ticket_number: ticketNumber,
      customer: order.customer_name,
      destination: '',
      truck_id: '',
      driver_name: '',
      product: order.product,
      tare_weight_lbs: 52000,
      gross_weight_lbs: null,
      net_weight_lbs: null,
      volume_gallons: null,
      load_from_tank_id: '',
      temperature_f: null,
      status: 'Pending',
      scheduled_load_time: order.delivery_date ? `${order.delivery_date}T08:00` : now.slice(0, 16),
      actual_load_start: null,
      actual_load_end: null,
      operator: '',
      notes: `Dispatched from sales order ${order.order_number}`,
      linked_order_id: order.order_id,
      created_at: now,
      updated_at: now,
    }
    setLoadingTickets(cur => [...(cur || []), newTicket])
    setOrders(cur => (cur || []).map(o =>
      o.order_id === order.order_id ? { ...o, status: 'Delivered' as SalesOrderStatus, updated_at: now } : o
    ))
    toast.success(`Loading ticket ${ticketNumber} created — order marked Delivered`)
  }

  const yearOrders = useMemo(() =>
    safeOrders.filter(o => new Date(o.order_date).getFullYear() === filterYear),
    [safeOrders, filterYear])

  const totalRevenue = useMemo(() =>
    yearOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total_price, 0),
    [yearOrders])

  const totalPaid = useMemo(() =>
    yearOrders.filter(o => o.status === 'Paid').reduce((s, o) => s + o.total_price, 0),
    [yearOrders])

  const totalPending = useMemo(() =>
    yearOrders.filter(o => ['Confirmed', 'In Production', 'Ready', 'Delivered', 'Invoiced'].includes(o.status)).reduce((s, o) => s + o.total_price, 0),
    [yearOrders])

  const openOrders = useMemo(() =>
    yearOrders.filter(o => !['Paid', 'Cancelled'].includes(o.status)).length,
    [yearOrders])

  const pipelineSummary = useMemo(() =>
    SALES_STATUSES
      .filter(status => !['Paid', 'Cancelled'].includes(status))
      .map(status => {
        const stageOrders = yearOrders.filter(order => order.status === status)
        return {
          status,
          count: stageOrders.length,
          value: stageOrders.reduce((sum, order) => sum + order.total_price, 0)
        }
      })
      .filter(stage => stage.count > 0),
    [yearOrders])

  const upcomingDeliveries = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return yearOrders
      .filter(order => !['Paid', 'Cancelled'].includes(order.status))
      .filter(order => new Date(order.delivery_date) >= today)
      .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
      .slice(0, 6)
  }, [yearOrders])

  const topCustomers = useMemo(() => {
    const totals = new Map<string, number>()

    yearOrders
      .filter(order => order.status !== 'Cancelled')
      .forEach(order => {
        totals.set(order.customer_name, (totals.get(order.customer_name) || 0) + order.total_price)
      })

    return [...totals.entries()]
      .map(([customer, revenue]) => ({ customer, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [yearOrders])

  const monthlyRevenue = useMemo(() => MONTHS.map((m, i) => {
    const month = i + 1
    const mOrders = yearOrders.filter(o => new Date(o.order_date).getMonth() + 1 === month && o.status !== 'Cancelled')
    return {
      month: m,
      revenue: Math.round(mOrders.reduce((s, o) => s + o.total_price, 0)),
      paid: Math.round(mOrders.filter(o => o.status === 'Paid').reduce((s, o) => s + o.total_price, 0)),
    }
  }), [yearOrders])

  const filteredOrders = useMemo(() =>
    yearOrders
      .filter(o => filterStatus === 'All' || o.status === filterStatus)
      .sort((a, b) => b.order_date.localeCompare(a.order_date)),
    [yearOrders, filterStatus])

  if (safeOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Sales Orders</h2>
          <p className="text-muted-foreground">Track customer orders, invoices, and revenue</p>
        </div>
        <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
            <ShoppingCart size={32} className="text-primary" weight="duotone" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Sales Data</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Load sample data or create your first sales order
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleLoadSample}>Load Sample Data</Button>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus size={16} className="mr-2" />New Order
            </Button>
          </div>
        </div>
        <OrderDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleSave} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Sales Orders</h2>
          <p className="text-muted-foreground">Customer orders, invoicing, and revenue tracking</p>
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
            <Plus size={16} className="mr-2" />New Order
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendUp size={14} />Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{yearOrders.filter(o => o.status !== 'Cancelled').length} active orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CheckCircle size={14} />Collected</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalPaid)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}% of revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock size={14} />Pending Collection</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalPending)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{openOrders} open orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CurrencyDollar size={14} />Avg Order Value</CardDescription>
            <CardTitle className="text-2xl">{(() => { const active = yearOrders.filter(o => o.status !== 'Cancelled'); return active.length > 0 ? fmt(totalRevenue / active.length) : '$0' })()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{yearOrders.length} orders total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Revenue Chart</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="orders">Order List</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue – {filterYear}</CardTitle>
              <CardDescription>Total invoiced vs collected by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyRevenue} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Invoiced" fill="oklch(0.60 0.15 240)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="paid" name="Paid" fill="oklch(0.62 0.17 145)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Stages</CardTitle>
                <CardDescription>Open demand from quote through invoice</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No active pipeline stages for {filterYear}</p>
                ) : (
                  <div className="space-y-3">
                    {pipelineSummary.map(stage => (
                      <div key={stage.status} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{stage.status}</p>
                            <p className="text-xs text-muted-foreground">{stage.count} orders</p>
                          </div>
                          <p className="font-semibold">{fmt(stage.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Accounts driving the most revenue this year</CardDescription>
              </CardHeader>
              <CardContent>
                {topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No customer mix available yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.customer} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{customer.customer}</p>
                            <p className="text-xs text-muted-foreground">#{index + 1} revenue account</p>
                          </div>
                          <p className="font-semibold">{fmt(customer.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deliveries</CardTitle>
                <CardDescription>Orders that still need production, loading, or final dispatch</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No upcoming deliveries on the active schedule</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeliveries.map(order => (
                      <div key={order.order_id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                          </div>
                          {statusBadge(order.status)}
                        </div>
                        <p className="text-sm mt-3">
                          {new Date(order.delivery_date).toLocaleDateString()} · {order.quantity_tons.toLocaleString()} tons of {order.product}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as SalesOrderStatus | 'All')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {SALES_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filteredOrders.length} orders</span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[480px] overflow-y-auto">
                {filteredOrders.length === 0 && (
                  <p className="text-muted-foreground text-sm py-8 text-center">No orders found</p>
                )}
                {filteredOrders.map(order => {
                  const linkedBatches = batchesByOrderId.get(order.order_id) || []
                  const { inProgress, pct, fullyProduced } = getFulfillmentStatus(order, linkedBatches)
                  return (
                  <div key={order.order_id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{order.order_number}</span>
                        <span className="text-sm text-muted-foreground truncate">{order.customer_name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{order.product}</Badge>
                        {statusBadge(order.status)}
                        {inProgress && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">In Production</Badge>
                        )}
                        {!inProgress && pct > 0 && pct < 100 && (
                          <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            {pct}% produced
                          </Badge>
                        )}
                        {fullyProduced && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Fully produced</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.order_date} → {order.delivery_date}
                        {' · '}{order.quantity_tons.toLocaleString()} tons @ {fmt(order.unit_price_per_ton)}/t
                        {order.invoice_number && ` · ${order.invoice_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-sm">{fmt(order.total_price)}</span>
                      {order.status === 'Ready' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={() => handleDispatchToLoading(order)}>
                          <Truck size={12} />Dispatch
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditOrder(order); setAddOpen(true) }}>
                        <Pencil size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(order.order_id)}>
                        <Trash size={13} />
                      </Button>
                    </div>
                  </div>
                )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrderDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditOrder(null) }}
        onSave={handleSave}
        existing={editOrder}
      />
    </div>
  )
}
