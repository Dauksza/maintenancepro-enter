import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { RailCarDelivery, AsphaltTank, AsphaltProduct, RailCarStatus } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Train, Plus, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

const PRODUCTS: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
const STATUSES: RailCarStatus[] = ['En Route', 'Arrived', 'Unloading', 'Unloaded', 'Returned', 'Cancelled']

const STATUS_COLORS: Record<RailCarStatus, string> = {
  'En Route': 'bg-blue-100 text-blue-700 border-blue-200',
  'Arrived': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Unloading': 'bg-orange-100 text-orange-700 border-orange-200',
  'Unloaded': 'bg-green-100 text-green-700 border-green-200',
  'Returned': 'bg-gray-100 text-gray-600 border-gray-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
}

interface DeliveryForm {
  car_number: string
  product: AsphaltProduct
  carrier: string
  expected_arrival: string
  actual_arrival: string
  estimated_volume_gallons: string
  actual_volume_gallons: string
  temperature_f: string
  status: RailCarStatus
  unload_to_tank_id: string
  operator: string
  notes: string
}

const DEFAULT_FORM: DeliveryForm = {
  car_number: '',
  product: 'PG 64-22',
  carrier: '',
  expected_arrival: new Date().toISOString().slice(0, 16),
  actual_arrival: '',
  estimated_volume_gallons: '28000',
  actual_volume_gallons: '',
  temperature_f: '',
  status: 'En Route',
  unload_to_tank_id: '',
  operator: '',
  notes: '',
}

export function RailOperations() {
  const [deliveries, setDeliveries] = useKV<RailCarDelivery[]>('rail-deliveries', [])
  const [tanks, setTanks] = useKV<AsphaltTank[]>('asphalt-tanks', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDelivery, setEditDelivery] = useState<RailCarDelivery | null>(null)
  const [form, setForm] = useState<DeliveryForm>(DEFAULT_FORM)
  const [statusFilter, setStatusFilter] = useState<RailCarStatus | 'All'>('All')

  const activeTanks = useMemo(() => (tanks || []).filter(t => t.status === 'Active'), [tanks])

  const filtered = useMemo(() => {
    const d = deliveries || []
    if (statusFilter === 'All') return [...d].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return [...d].filter(x => x.status === statusFilter).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [deliveries, statusFilter])

  const counts = useMemo(() => ({
    enRoute: (deliveries || []).filter(d => d.status === 'En Route').length,
    arrived: (deliveries || []).filter(d => d.status === 'Arrived').length,
    unloading: (deliveries || []).filter(d => d.status === 'Unloading').length,
  }), [deliveries])

  function openAdd() {
    setEditDelivery(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  function openEdit(d: RailCarDelivery) {
    setEditDelivery(d)
    setForm({
      car_number: d.car_number,
      product: d.product,
      carrier: d.carrier,
      expected_arrival: d.expected_arrival.slice(0, 16),
      actual_arrival: d.actual_arrival?.slice(0, 16) ?? '',
      estimated_volume_gallons: String(d.estimated_volume_gallons),
      actual_volume_gallons: d.actual_volume_gallons != null ? String(d.actual_volume_gallons) : '',
      temperature_f: d.temperature_f != null ? String(d.temperature_f) : '',
      status: d.status,
      unload_to_tank_id: d.unload_to_tank_id ?? '',
      operator: d.operator,
      notes: d.notes,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.car_number.trim()) { toast.error('Car number is required'); return }
    const now = new Date().toISOString()
    const base = {
      car_number: form.car_number.trim().toUpperCase(),
      product: form.product,
      carrier: form.carrier.trim(),
      expected_arrival: form.expected_arrival,
      actual_arrival: form.actual_arrival || null,
      estimated_volume_gallons: parseFloat(form.estimated_volume_gallons) || 0,
      actual_volume_gallons: form.actual_volume_gallons ? parseFloat(form.actual_volume_gallons) : null,
      temperature_f: form.temperature_f ? parseFloat(form.temperature_f) : null,
      status: form.status,
      unload_to_tank_id: form.unload_to_tank_id || null,
      unload_start: editDelivery?.unload_start ?? null,
      unload_end: editDelivery?.unload_end ?? null,
      operator: form.operator.trim(),
      notes: form.notes.trim(),
      updated_at: now,
    }

    if (editDelivery) {
      // Auto-update tank level when status transitions to Unloaded with known volume
      if (form.status === 'Unloaded' && editDelivery.status !== 'Unloaded' && form.unload_to_tank_id && form.actual_volume_gallons) {
        const vol = parseFloat(form.actual_volume_gallons)
        const tankId = form.unload_to_tank_id
        if (!isNaN(vol) && vol > 0 && tankId) {
          const now2 = new Date().toISOString()
          setTanks(cur => {
            if (!cur) return cur
            return cur.map(t => {
              if (t.tank_id !== tankId) return t
              const newVol = Math.min(t.capacity_gallons, t.current_volume_gallons + vol)
              return { ...t, current_volume_gallons: newVol, last_updated: now2 }
            })
          })
          toast.info('Tank level updated automatically with received volume')
        }
      }
      setDeliveries(cur => (cur || []).map(d => d.delivery_id === editDelivery.delivery_id
        ? {
            ...d, ...base,
            unload_start: form.status === 'Unloading' && !d.unload_start ? now : d.unload_start,
            unload_end: form.status === 'Unloaded' && !d.unload_end ? now : d.unload_end,
          }
        : d
      ))
      toast.success('Delivery updated')
    } else {
      const newDelivery: RailCarDelivery = {
        delivery_id: `rail-${Date.now()}`,
        ...base,
        created_at: now,
      }
      setDeliveries(cur => [...(cur || []), newDelivery])
      toast.success('Rail car delivery recorded')
    }
    setDialogOpen(false)
  }

  function quickStatus(d: RailCarDelivery, status: RailCarStatus) {
    const now = new Date().toISOString()
    setDeliveries(cur => (cur || []).map(r => r.delivery_id === d.delivery_id
      ? {
          ...r,
          status,
          actual_arrival: (status === 'Arrived' || status === 'Unloading' || status === 'Unloaded') && !r.actual_arrival ? now : r.actual_arrival,
          unload_start: status === 'Unloading' && !r.unload_start ? now : r.unload_start,
          unload_end: status === 'Unloaded' && !r.unload_end ? now : r.unload_end,
          updated_at: now,
        }
      : r
    ))

    // Auto-update tank level when marked Unloaded with known volume and target tank
    if (status === 'Unloaded' && d.unload_to_tank_id && d.actual_volume_gallons != null) {
      setTanks(cur => {
        if (!cur) return cur
        return cur.map(t => {
          if (t.tank_id !== d.unload_to_tank_id) return t
          const newVol = Math.min(t.capacity_gallons, t.current_volume_gallons + d.actual_volume_gallons!)
          return { ...t, current_volume_gallons: newVol, last_updated: now }
        })
      })
      toast.success(`Car ${d.car_number} unloaded — tank level updated`)
    } else {
      toast.success(`Car ${d.car_number} marked as ${status}`)
    }
  }

  function getTankName(id: string | null) {
    if (!id) return '—'
    return (tanks || []).find(t => t.tank_id === id)?.tank_name ?? id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Train size={28} className="text-slate-600" />
            Rail Operations
          </h2>
          <p className="text-muted-foreground mt-1">Track hot liquid asphalt receipts via rail car</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} />
          Add Rail Car
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">En Route</div>
            <div className="text-2xl font-bold text-blue-600">{counts.enRoute}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Warning size={10} />Arrived / Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{counts.arrived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Unloading Now</div>
            <div className="text-2xl font-bold text-orange-600">{counts.unloading}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Records</div>
            <div className="text-2xl font-bold">{(deliveries || []).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {(['All', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s as typeof statusFilter)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Train size={40} className="mx-auto mb-3 opacity-30" />
            <p>No rail car records found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Est. Volume</TableHead>
                  <TableHead>Unload To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.delivery_id}>
                    <TableCell className="font-mono font-medium">{d.car_number}</TableCell>
                    <TableCell>{d.product}</TableCell>
                    <TableCell className="text-muted-foreground">{d.carrier || '—'}</TableCell>
                    <TableCell className="text-xs">{new Date(d.expected_arrival).toLocaleDateString()}</TableCell>
                    <TableCell>{(d.actual_volume_gallons ?? d.estimated_volume_gallons).toLocaleString()} gal</TableCell>
                    <TableCell>{getTankName(d.unload_to_tank_id)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${STATUS_COLORS[d.status]}`}>{d.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {d.status === 'En Route' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => quickStatus(d, 'Arrived')}>Arrived</Button>
                        )}
                        {d.status === 'Arrived' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => quickStatus(d, 'Unloading')}>Start Unload</Button>
                        )}
                        {d.status === 'Unloading' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => quickStatus(d, 'Unloaded')}>Complete</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => openEdit(d)}>Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editDelivery ? 'Edit Rail Car Delivery' : 'New Rail Car Delivery'}</DialogTitle>
            <DialogDescription>Track hot liquid asphalt received via rail car</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Car Number *</Label>
              <Input value={form.car_number} onChange={e => setForm(f => ({...f, car_number: e.target.value}))} placeholder="UTLX 123456" />
            </div>
            <div className="space-y-1">
              <Label>Carrier / Railroad</Label>
              <Input value={form.carrier} onChange={e => setForm(f => ({...f, carrier: e.target.value}))} placeholder="BNSF" />
            </div>
            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={form.product} onValueChange={v => setForm(f => ({...f, product: v as AsphaltProduct}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v as RailCarStatus}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Expected Arrival</Label>
              <Input type="datetime-local" value={form.expected_arrival} onChange={e => setForm(f => ({...f, expected_arrival: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Actual Arrival</Label>
              <Input type="datetime-local" value={form.actual_arrival} onChange={e => setForm(f => ({...f, actual_arrival: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Estimated Volume (gal)</Label>
              <Input type="number" value={form.estimated_volume_gallons} onChange={e => setForm(f => ({...f, estimated_volume_gallons: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Actual Volume Received (gal)</Label>
              <Input type="number" value={form.actual_volume_gallons} onChange={e => setForm(f => ({...f, actual_volume_gallons: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Temperature (°F)</Label>
              <Input type="number" value={form.temperature_f} onChange={e => setForm(f => ({...f, temperature_f: e.target.value}))} placeholder="325" />
            </div>
            <div className="space-y-1">
              <Label>Unload To Tank</Label>
              <Select value={form.unload_to_tank_id} onValueChange={v => setForm(f => ({...f, unload_to_tank_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select tank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {activeTanks.map(t => <SelectItem key={t.tank_id} value={t.tank_id}>{t.tank_name} ({t.product})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Operator</Label>
              <Input value={form.operator} onChange={e => setForm(f => ({...f, operator: e.target.value}))} placeholder="Name" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editDelivery ? 'Save Changes' : 'Add Delivery'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
