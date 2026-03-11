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
import { Truck, MapPin, Clock, CheckCircle, Warning } from '@phosphor-icons/react'
import type { Delivery, DeliveryStatus, SalesOrder } from '@/lib/types'

const ALL_STATUSES: DeliveryStatus[] = ['Scheduled', 'Loading', 'In Transit', 'Delivered', 'Cancelled', 'Delayed']

function generateSampleDeliveries(): Delivery[] {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const now = new Date().toISOString()

  return [
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0412', sales_order_id: 'SO-1023',
      customer_name: 'Baton Rouge Parish Roads', delivery_address: '1800 S Airport Ave, Baton Rouge, LA 70807',
      vehicle_id: 'T-101', driver_name: 'Carlos Rivera', status: 'In Transit',
      scheduled_date: today, scheduled_time: '07:00', actual_departure: today + 'T07:05:00',
      actual_arrival: null, product: 'PG 64-22', quantity_tons: 22.5, temperature_f: 315,
      notes: 'Gate code #4821', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0411', sales_order_id: 'SO-1022',
      customer_name: 'Acadiana Paving Co.', delivery_address: '450 Hwy 182, Morgan City, LA 70380',
      vehicle_id: 'T-102', driver_name: 'Tom Bergeron', status: 'Delivered',
      scheduled_date: today, scheduled_time: '06:00', actual_departure: today + 'T06:00:00',
      actual_arrival: today + 'T08:15:00', product: 'PG 70-22', quantity_tons: 25.0, temperature_f: 320,
      notes: '', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0413', sales_order_id: 'SO-1024',
      customer_name: 'I-10 DOTD Project', delivery_address: 'Mile Marker 120, I-10 East, LA',
      vehicle_id: null, driver_name: null, status: 'Scheduled',
      scheduled_date: today, scheduled_time: '11:30', actual_departure: null,
      actual_arrival: null, product: 'RSBC-1', quantity_tons: 18.0, temperature_f: null,
      notes: 'Staging area access from service road', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0410', sales_order_id: 'SO-1021',
      customer_name: 'Thibodaux City Works', delivery_address: '310 Green St, Thibodaux, LA 70301',
      vehicle_id: 'T-103', driver_name: 'Kyle Boudreaux', status: 'Delayed',
      scheduled_date: today, scheduled_time: '08:00', actual_departure: null,
      actual_arrival: null, product: 'PG 64-22', quantity_tons: 20.0, temperature_f: null,
      notes: 'Delayed – vehicle T-103 in maintenance', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0414', sales_order_id: null,
      customer_name: 'Lamar Advertising', delivery_address: '8800 Airline Hwy, Baton Rouge, LA 70815',
      vehicle_id: null, driver_name: null, status: 'Scheduled',
      scheduled_date: tomorrow, scheduled_time: '09:00', actual_departure: null,
      actual_arrival: null, product: 'AC-20', quantity_tons: 15.0, temperature_f: null,
      notes: '', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0409', sales_order_id: 'SO-1020',
      customer_name: 'Gulf Coast Construction', delivery_address: '2200 Port Allen Hwy, Port Allen, LA 70767',
      vehicle_id: 'T-102', driver_name: 'Tom Bergeron', status: 'Delivered',
      scheduled_date: yesterday, scheduled_time: '07:30', actual_departure: yesterday + 'T07:30:00',
      actual_arrival: yesterday + 'T09:00:00', product: 'PG 70-22', quantity_tons: 24.0, temperature_f: 325,
      notes: '', created_at: now, updated_at: now
    },
    {
      delivery_id: uuidv4(), delivery_number: 'DEL-2024-0415', sales_order_id: 'SO-1025',
      customer_name: 'Slidell Road Dept.', delivery_address: '1000 Industrial Blvd, Slidell, LA 70460',
      vehicle_id: null, driver_name: null, status: 'Loading',
      scheduled_date: today, scheduled_time: '10:00', actual_departure: null,
      actual_arrival: null, product: 'PG 64-22', quantity_tons: 23.5, temperature_f: null,
      notes: 'Call 30 min before arrival', created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: DeliveryStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Delivered') return 'default'
  if (s === 'Cancelled') return 'destructive'
  if (s === 'Delayed') return 'destructive'
  if (s === 'In Transit') return 'outline'
  return 'secondary'
}

const PIPELINE_STEPS: DeliveryStatus[] = ['Scheduled', 'Loading', 'In Transit', 'Delivered']

export function DeliveryTracking() {
  const [deliveries, setDeliveries] = useKV<Delivery[]>('deliveries', generateSampleDeliveries())
  const [salesOrders] = useKV<SalesOrder[]>('sales-orders', [])
  const safeDeliveries = deliveries ?? []
  const safeSalesOrders = salesOrders ?? []
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | 'All'>('All')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    sales_order_id: '',
    customer_name: '', delivery_address: '', driver_name: '', product: 'PG 64-22',
    quantity_tons: 20, scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00', notes: ''
  })

  // Sales orders that are ready or delivered (eligible for delivery scheduling)
  const eligibleSalesOrders = useMemo(() =>
    safeSalesOrders.filter(o => ['Confirmed', 'In Production', 'Ready'].includes(o.status))
      .sort((a, b) => a.order_number.localeCompare(b.order_number)),
    [safeSalesOrders]
  )

  // Map sales_order_id → SalesOrder for display
  const salesOrdersById = useMemo(() => {
    const map = new Map<string, SalesOrder>()
    safeSalesOrders.forEach(o => map.set(o.order_id, o))
    return map
  }, [safeSalesOrders])

  function handleSalesOrderSelect(orderId: string) {
    const order = safeSalesOrders.find(o => o.order_id === orderId)
    if (order) {
      setForm(f => ({
        ...f,
        sales_order_id: orderId,
        customer_name: order.customer_name,
        product: order.product,
        quantity_tons: order.quantity_tons,
        scheduled_date: order.delivery_date || f.scheduled_date,
      }))
    } else {
      setForm(f => ({ ...f, sales_order_id: '' }))
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const kpis = useMemo(() => {
    const todayDeliveries = safeDeliveries.filter(d => d.scheduled_date === today)
    return {
      todayTotal: todayDeliveries.length,
      inTransit: safeDeliveries.filter(d => d.status === 'In Transit').length,
      deliveredToday: todayDeliveries.filter(d => d.status === 'Delivered').length,
      delayed: safeDeliveries.filter(d => d.status === 'Delayed').length,
    }
  }, [safeDeliveries, today])

  const filtered = useMemo(() => {
    return safeDeliveries.filter(d => {
      const matchDate = !filterDate || d.scheduled_date === filterDate
      const matchStatus = filterStatus === 'All' || d.status === filterStatus
      return matchDate && matchStatus
    }).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
  }, [safeDeliveries, filterDate, filterStatus])

  const updateStatus = (id: string, status: DeliveryStatus) => {
    const now = new Date().toISOString()
    setDeliveries(prev => (prev ?? []).map(d => d.delivery_id === id ? {
      ...d, status, updated_at: now,
      actual_departure: status === 'In Transit' && !d.actual_departure ? now : d.actual_departure,
      actual_arrival: status === 'Delivered' && !d.actual_arrival ? now : d.actual_arrival,
    } : d))
    if (detailDelivery?.delivery_id === id) setDetailDelivery(prev => prev ? { ...prev, status } : null)
    toast.success(`Status updated to ${status}`)
  }

  const handleAdd = () => {
    if (!form.customer_name || !form.delivery_address) {
      toast.error('Customer name and delivery address are required')
      return
    }
    const now = new Date().toISOString()
    const newDel: Delivery = {
      delivery_id: uuidv4(),
      delivery_number: `DEL-${new Date().getFullYear()}-${String(safeDeliveries.length + 416).padStart(4, '0')}`,
      sales_order_id: form.sales_order_id || null,
      customer_name: form.customer_name,
      delivery_address: form.delivery_address,
      vehicle_id: null,
      driver_name: form.driver_name || null,
      status: 'Scheduled',
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time,
      actual_departure: null,
      actual_arrival: null,
      product: form.product,
      quantity_tons: form.quantity_tons,
      temperature_f: null,
      notes: form.notes,
      created_at: now,
      updated_at: now,
    }
    setDeliveries(prev => [newDel, ...(prev ?? [])])
    toast.success(`Delivery ${newDel.delivery_number} scheduled`)
    setAddOpen(false)
    setForm({ sales_order_id: '', customer_name: '', delivery_address: '', driver_name: '', product: 'PG 64-22', quantity_tons: 20, scheduled_date: today, scheduled_time: '08:00', notes: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery Tracking</h2>
          <p className="text-muted-foreground">Monitor outbound deliveries and fleet dispatch</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Truck size={16} className="mr-2" /> Schedule Delivery
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock size={16} />Today's Deliveries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.todayTotal}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Truck size={16} />In Transit</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{kpis.inTransit}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle size={16} />Delivered Today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpis.deliveredToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Warning size={16} />Delayed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{kpis.delayed}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-44" />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as DeliveryStatus | 'All')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setFilterDate('')}>Clear Date</Button>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Tons</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No deliveries found</TableCell>
                </TableRow>
              )}
              {filtered.map(d => {
                const linkedOrder = d.sales_order_id ? salesOrdersById.get(d.sales_order_id) : null
                const orderLabel = linkedOrder?.order_number ?? (d.sales_order_id && !linkedOrder ? d.sales_order_id : null)
                return (
                <TableRow key={d.delivery_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailDelivery(d)}>
                  <TableCell className="font-mono text-sm">{d.delivery_number}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{d.customer_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> {d.delivery_address.split(',')[1]?.trim() || d.delivery_address.slice(0, 30)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {orderLabel
                      ? <Badge className="text-[11px] bg-blue-50 text-blue-700 border-blue-200">{orderLabel}</Badge>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{d.product}</TableCell>
                  <TableCell className="text-right font-medium">{d.quantity_tons}</TableCell>
                  <TableCell className="text-sm">{d.driver_name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell className="text-sm">{d.scheduled_date} {d.scheduled_time}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailDelivery} onOpenChange={open => !open && setDetailDelivery(null)}>
        <DialogContent className="max-w-2xl">
          {detailDelivery && (
            <>
              <DialogHeader>
                <DialogTitle>{detailDelivery.delivery_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium ml-1">{detailDelivery.customer_name}</span></div>
                  <div><span className="text-muted-foreground">Product:</span> <span className="font-medium ml-1">{detailDelivery.product}</span></div>
                  <div><span className="text-muted-foreground">Quantity:</span> <span className="font-medium ml-1">{detailDelivery.quantity_tons} tons</span></div>
                  <div><span className="text-muted-foreground">Temperature:</span> <span className="font-medium ml-1">{detailDelivery.temperature_f ? `${detailDelivery.temperature_f}°F` : '—'}</span></div>
                  <div><span className="text-muted-foreground">Driver:</span> <span className="font-medium ml-1">{detailDelivery.driver_name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium ml-1">{detailDelivery.vehicle_id || '—'}</span></div>
                  {detailDelivery.sales_order_id && (
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-muted-foreground">Sales Order:</span>
                      <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {salesOrdersById.get(detailDelivery.sales_order_id)?.order_number ?? detailDelivery.sales_order_id}
                      </Badge>
                      {salesOrdersById.get(detailDelivery.sales_order_id) && (
                        <span className="text-xs text-muted-foreground">
                          ({salesOrdersById.get(detailDelivery.sales_order_id)!.customer_name} — {salesOrdersById.get(detailDelivery.sales_order_id)!.status})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium ml-1">{detailDelivery.delivery_address}</span></div>
                  <div><span className="text-muted-foreground">Scheduled:</span> <span className="font-medium ml-1">{detailDelivery.scheduled_date} {detailDelivery.scheduled_time}</span></div>
                  <div><span className="text-muted-foreground">Departed:</span> <span className="font-medium ml-1">{detailDelivery.actual_departure ? new Date(detailDelivery.actual_departure).toLocaleTimeString() : '—'}</span></div>
                  <div><span className="text-muted-foreground">Arrived:</span> <span className="font-medium ml-1">{detailDelivery.actual_arrival ? new Date(detailDelivery.actual_arrival).toLocaleTimeString() : '—'}</span></div>
                </div>

                {/* Pipeline */}
                <div>
                  <p className="text-sm font-medium mb-2">Delivery Pipeline</p>
                  <div className="flex items-center gap-2">
                    {PIPELINE_STEPS.map((step, i) => {
                      const currentIdx = PIPELINE_STEPS.indexOf(detailDelivery.status as DeliveryStatus)
                      const isDone = i <= currentIdx
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <button
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                            onClick={() => updateStatus(detailDelivery.delivery_id, step)}
                          >
                            {step}
                          </button>
                          {i < PIPELINE_STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Status Update */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Update Status:</span>
                  <Select value={detailDelivery.status} onValueChange={v => updateStatus(detailDelivery.delivery_id, v as DeliveryStatus)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {detailDelivery.notes && (
                  <div className="text-sm"><span className="text-muted-foreground">Notes:</span> <span>{detailDelivery.notes}</span></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDelivery(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Delivery Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {eligibleSalesOrders.length > 0 && (
              <div className="space-y-1">
                <Label>Link to Sales Order <span className="text-muted-foreground text-xs">(optional — auto-fills fields)</span></Label>
                <Select value={form.sales_order_id || ''} onValueChange={handleSalesOrderSelect}>
                  <SelectTrigger><SelectValue placeholder="Select a sales order" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No linked order</SelectItem>
                    {eligibleSalesOrders.map(o => (
                      <SelectItem key={o.order_id} value={o.order_id}>
                        {o.order_number} — {o.customer_name} ({o.quantity_tons}t {o.product})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Customer Name *</Label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Delivery Address *</Label>
              <Input value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Product</Label>
                <Select value={form.product} onValueChange={v => setForm(f => ({ ...f, product: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['PG 64-22', 'PG 70-22', 'PG 76-22', 'AC-20', 'RSBC-1', 'SS-1h'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantity (tons)</Label>
                <Input type="number" value={form.quantity_tons} min={1} onChange={e => setForm(f => ({ ...f, quantity_tons: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Scheduled Date</Label>
                <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Scheduled Time</Label>
                <Input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Driver (optional)</Label>
              <Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="Assign driver" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Schedule Delivery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
