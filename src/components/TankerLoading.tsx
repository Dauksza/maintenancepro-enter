import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { TankerLoadingTicket, AsphaltTank, AsphaltProduct, TankerLoadingStatus } from '@/lib/types'
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
import { Truck, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ASPHALT_DENSITY_LBS_GAL } from '@/lib/asphalt-constants'

const PRODUCTS: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
const LOAD_STATUSES: TankerLoadingStatus[] = ['Pending', 'Loading', 'Complete', 'Cancelled']

const STATUS_COLORS: Record<TankerLoadingStatus, string> = {
  'Pending': 'bg-blue-100 text-blue-700 border-blue-200',
  'Loading': 'bg-orange-100 text-orange-700 border-orange-200',
  'Complete': 'bg-green-100 text-green-700 border-green-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
}

const ASPHALT_LBS_PER_GAL = ASPHALT_DENSITY_LBS_GAL

interface TicketForm {
  ticket_number: string
  customer: string
  destination: string
  truck_id: string
  driver_name: string
  product: AsphaltProduct
  tare_weight_lbs: string
  gross_weight_lbs: string
  load_from_tank_id: string
  temperature_f: string
  status: TankerLoadingStatus
  scheduled_load_time: string
  operator: string
  notes: string
}

const DEFAULT_FORM: TicketForm = {
  ticket_number: '',
  customer: '',
  destination: '',
  truck_id: '',
  driver_name: '',
  product: 'PG 76-22',
  tare_weight_lbs: '52000',
  gross_weight_lbs: '',
  load_from_tank_id: '',
  temperature_f: '325',
  status: 'Pending',
  scheduled_load_time: new Date().toISOString().slice(0, 16),
  operator: '',
  notes: '',
}

function nextTicketNumber(tickets: TankerLoadingTicket[]): string {
  const today = new Date()
  const prefix = `LT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const todayTickets = tickets.filter(t => t.ticket_number.startsWith(prefix))
  const seq = todayTickets.length + 1
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

export function TankerLoading() {
  const [tickets, setTickets] = useKV<TankerLoadingTicket[]>('tanker-loading-tickets', [])
  const [tanks, setTanks] = useKV<AsphaltTank[]>('asphalt-tanks', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTicket, setEditTicket] = useState<TankerLoadingTicket | null>(null)
  const [form, setForm] = useState<TicketForm>(DEFAULT_FORM)
  const [statusFilter, setStatusFilter] = useState<TankerLoadingStatus | 'All'>('All')

  const activeTanks = useMemo(() => (tanks || []).filter(t => t.status === 'Active'), [tanks])

  const filtered = useMemo(() => {
    const t = tickets || []
    if (statusFilter === 'All') return [...t].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return [...t].filter(x => x.status === statusFilter).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [tickets, statusFilter])

  const stats = useMemo(() => {
    const t = tickets || []
    const complete = t.filter(x => x.status === 'Complete')
    const totalLbs = complete.reduce((s, x) => s + (x.net_weight_lbs ?? 0), 0)
    const totalTons = totalLbs / 2000
    return {
      pending: t.filter(x => x.status === 'Pending').length,
      loading: t.filter(x => x.status === 'Loading').length,
      complete: complete.length,
      totalTons,
    }
  }, [tickets])

  function openAdd() {
    setEditTicket(null)
    setForm({ ...DEFAULT_FORM, ticket_number: nextTicketNumber(tickets || []) })
    setDialogOpen(true)
  }

  function openEdit(t: TankerLoadingTicket) {
    setEditTicket(t)
    setForm({
      ticket_number: t.ticket_number,
      customer: t.customer,
      destination: t.destination,
      truck_id: t.truck_id,
      driver_name: t.driver_name,
      product: t.product,
      tare_weight_lbs: String(t.tare_weight_lbs),
      gross_weight_lbs: t.gross_weight_lbs != null ? String(t.gross_weight_lbs) : '',
      load_from_tank_id: t.load_from_tank_id,
      temperature_f: t.temperature_f != null ? String(t.temperature_f) : '',
      status: t.status,
      scheduled_load_time: t.scheduled_load_time.slice(0, 16),
      operator: t.operator,
      notes: t.notes,
    })
    setDialogOpen(true)
  }

  /** Deducts loaded volume from the source tank, clamping to 0. No-op if tankId is empty or volume is zero. */
  function deductTankVolume(tankId: string, volumeGallons: number, timestamp: string) {
    if (!tankId || !(volumeGallons > 0)) return
    setTanks(cur => {
      if (!cur) return []
      return cur.map(t => {
        if (t.tank_id !== tankId) return t
        const newVol = Math.max(0, t.current_volume_gallons - volumeGallons)
        return { ...t, current_volume_gallons: newVol, last_updated: timestamp }
      })
    })
  }

  function handleSave() {
    if (!form.customer.trim()) { toast.error('Customer is required'); return }
    if (!form.truck_id.trim()) { toast.error('Truck ID is required'); return }
    const now = new Date().toISOString()
    const tare = parseFloat(form.tare_weight_lbs) || 0
    const gross = form.gross_weight_lbs ? parseFloat(form.gross_weight_lbs) : null
    const net = gross != null ? gross - tare : null
    const volume = net != null ? net / ASPHALT_LBS_PER_GAL : null

    const base = {
      ticket_number: form.ticket_number,
      customer: form.customer.trim(),
      destination: form.destination.trim(),
      truck_id: form.truck_id.trim().toUpperCase(),
      driver_name: form.driver_name.trim(),
      product: form.product,
      tare_weight_lbs: tare,
      gross_weight_lbs: gross,
      net_weight_lbs: net,
      volume_gallons: volume,
      load_from_tank_id: form.load_from_tank_id,
      temperature_f: form.temperature_f ? parseFloat(form.temperature_f) : null,
      status: form.status,
      scheduled_load_time: form.scheduled_load_time,
      actual_load_start: editTicket?.actual_load_start ?? null,
      actual_load_end: editTicket?.actual_load_end ?? null,
      operator: form.operator.trim(),
      notes: form.notes.trim(),
      updated_at: now,
    }

    if (editTicket) {
      // Deduct from tank when transitioning to Complete with volume and source tank
      const wasComplete = editTicket.status === 'Complete'
      const nowComplete = form.status === 'Complete'
      if (!wasComplete && nowComplete && form.load_from_tank_id && volume != null && volume > 0) {
        deductTankVolume(form.load_from_tank_id, volume, now)
        toast.info('Tank level updated with loaded volume')
      }
      setTickets(cur => (cur || []).map(t => t.ticket_id === editTicket.ticket_id
        ? {
            ...t, ...base,
            actual_load_start: form.status === 'Loading' && !t.actual_load_start ? now : t.actual_load_start,
            actual_load_end: form.status === 'Complete' && !t.actual_load_end ? now : t.actual_load_end,
          }
        : t
      ))
      toast.success('Ticket updated')
    } else {
      const newTicket: TankerLoadingTicket = {
        ticket_id: `ticket-${Date.now()}`,
        ...base,
        created_at: now,
      }
      setTickets(cur => [...(cur || []), newTicket])
      toast.success(`Loading ticket ${form.ticket_number} created`)
    }
    setDialogOpen(false)
  }

  function quickStatus(t: TankerLoadingTicket, status: TankerLoadingStatus) {
    const now = new Date().toISOString()
    setTickets(cur => (cur || []).map(x => x.ticket_id === t.ticket_id
      ? {
          ...x, status, updated_at: now,
          actual_load_start: status === 'Loading' && !x.actual_load_start ? now : x.actual_load_start,
          actual_load_end: status === 'Complete' && !x.actual_load_end ? now : x.actual_load_end,
        }
      : x
    ))

    // Deduct from source tank when marking ticket Complete
    if (status === 'Complete' && t.load_from_tank_id) {
      const vol = t.volume_gallons
      if (vol != null && vol > 0) {
        deductTankVolume(t.load_from_tank_id, vol, now)
        toast.success(`Ticket ${t.ticket_number} completed — tank level updated`)
      } else {
        toast.success(`Ticket ${t.ticket_number} completed — enter gross weight to update tank level`)
      }
    } else {
      toast.success(`Ticket ${t.ticket_number} marked as ${status}`)
    }
  }

  function getTankName(id: string) {
    return (tanks || []).find(t => t.tank_id === id)?.tank_name ?? '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck size={28} className="text-green-600" />
            Tanker Loading
          </h2>
          <p className="text-muted-foreground mt-1">Manage outbound tanker loading tickets for blended asphalt products</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Loading Now</div>
            <div className="text-2xl font-bold text-orange-600">{stats.loading}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Shipped (tons)</div>
            <div className="text-2xl font-bold">{stats.totalTons.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {(['All', ...LOAD_STATUSES] as const).map(s => (
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
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No loading tickets found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Truck ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Load From</TableHead>
                  <TableHead>Net (lbs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.ticket_id}>
                    <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                    <TableCell className="font-medium">{t.customer}</TableCell>
                    <TableCell className="font-mono">{t.truck_id}</TableCell>
                    <TableCell>{t.product}</TableCell>
                    <TableCell>{getTankName(t.load_from_tank_id)}</TableCell>
                    <TableCell>{t.net_weight_lbs != null ? t.net_weight_lbs.toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${STATUS_COLORS[t.status]}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {t.status === 'Pending' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => quickStatus(t, 'Loading')}>Start</Button>
                        )}
                        {t.status === 'Loading' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => quickStatus(t, 'Complete')}>Complete</Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => openEdit(t)}>Edit</Button>
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
            <DialogTitle>{editTicket ? 'Edit Loading Ticket' : 'New Loading Ticket'}</DialogTitle>
            <DialogDescription>Create a tanker loading ticket for outbound shipment</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Ticket Number</Label>
              <Input value={form.ticket_number} onChange={e => setForm(f => ({...f, ticket_number: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Input value={form.customer} onChange={e => setForm(f => ({...f, customer: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Destination</Label>
              <Input value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Truck ID *</Label>
              <Input value={form.truck_id} onChange={e => setForm(f => ({...f, truck_id: e.target.value}))} placeholder="A-101" />
            </div>
            <div className="space-y-1">
              <Label>Driver Name</Label>
              <Input value={form.driver_name} onChange={e => setForm(f => ({...f, driver_name: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={form.product} onValueChange={v => setForm(f => ({...f, product: v as AsphaltProduct}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Load From Tank</Label>
              <Select value={form.load_from_tank_id || '__none__'} onValueChange={v => setForm(f => ({...f, load_from_tank_id: v === '__none__' ? '' : v}))}>
                <SelectTrigger><SelectValue placeholder="Select tank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {activeTanks.map(t => <SelectItem key={t.tank_id} value={t.tank_id}>{t.tank_name} ({t.product})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v as TankerLoadingStatus}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LOAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tare Weight (lbs)</Label>
              <Input type="number" value={form.tare_weight_lbs} onChange={e => setForm(f => ({...f, tare_weight_lbs: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Gross Weight (lbs)</Label>
              <Input type="number" value={form.gross_weight_lbs} onChange={e => setForm(f => ({...f, gross_weight_lbs: e.target.value}))} placeholder="After loading" />
              {form.gross_weight_lbs && form.tare_weight_lbs && (
                <p className="text-xs text-muted-foreground">
                  Net: {((parseFloat(form.gross_weight_lbs) || 0) - (parseFloat(form.tare_weight_lbs) || 0)).toLocaleString()} lbs
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Temperature (°F)</Label>
              <Input type="number" value={form.temperature_f} onChange={e => setForm(f => ({...f, temperature_f: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Scheduled Load Time</Label>
              <Input type="datetime-local" value={form.scheduled_load_time} onChange={e => setForm(f => ({...f, scheduled_load_time: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Operator</Label>
              <Input value={form.operator} onChange={e => setForm(f => ({...f, operator: e.target.value}))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editTicket ? 'Save Changes' : 'Create Ticket'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
