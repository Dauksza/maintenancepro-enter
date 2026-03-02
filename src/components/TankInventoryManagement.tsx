import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { AsphaltTank, AsphaltProduct, TankStatus } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Drop, Plus, Pencil, Warning, Thermometer, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

const ASPHALT_DENSITY_LBS_GAL = 8.7
const TONS_TO_LBS = 2000

const PRODUCTS: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
const STATUSES: TankStatus[] = ['Active', 'Inactive', 'Maintenance']

function pct(vol: number, cap: number) {
  if (!cap) return 0
  return Math.min(100, Math.max(0, (vol / cap) * 100))
}

function levelColor(p: number, isLow: boolean) {
  if (isLow) return 'bg-red-500'
  if (p < 20) return 'bg-orange-500'
  if (p < 80) return 'bg-green-500'
  return 'bg-blue-500'
}

function statusBadge(status: TankStatus) {
  if (status === 'Active') return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
  if (status === 'Maintenance') return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Maintenance</Badge>
  return <Badge variant="secondary">Inactive</Badge>
}

interface TankFormData {
  tank_name: string
  tank_number: string
  capacity_gallons: string
  current_volume_gallons: string
  product: AsphaltProduct
  temperature_f: string
  min_level_gallons: string
  status: TankStatus
  location: string
  notes: string
}

const DEFAULT_FORM: TankFormData = {
  tank_name: '',
  tank_number: '',
  capacity_gallons: '250000',
  current_volume_gallons: '0',
  product: 'PG 64-22',
  temperature_f: '325',
  min_level_gallons: '25000',
  status: 'Active',
  location: '',
  notes: '',
}

export function TankInventoryManagement() {
  const [tanks, setTanks] = useKV<AsphaltTank[]>('asphalt-tanks', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTank, setEditTank] = useState<AsphaltTank | null>(null)
  const [form, setForm] = useState<TankFormData>(DEFAULT_FORM)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [adjustTank, setAdjustTank] = useState<AsphaltTank | null>(null)
  const [adjustVolume, setAdjustVolume] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const totalCapacity = useMemo(() => (tanks || []).reduce((s, t) => s + t.capacity_gallons, 0), [tanks])
  const totalVolume = useMemo(() => (tanks || []).reduce((s, t) => s + t.current_volume_gallons, 0), [tanks])
  const lowTanks = useMemo(() => (tanks || []).filter(t => t.current_volume_gallons <= t.min_level_gallons && t.status === 'Active'), [tanks])

  function openAdd() {
    setEditTank(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  function openEdit(tank: AsphaltTank) {
    setEditTank(tank)
    setForm({
      tank_name: tank.tank_name,
      tank_number: tank.tank_number,
      capacity_gallons: String(tank.capacity_gallons),
      current_volume_gallons: String(tank.current_volume_gallons),
      product: tank.product,
      temperature_f: String(tank.temperature_f),
      min_level_gallons: String(tank.min_level_gallons),
      status: tank.status,
      location: tank.location,
      notes: tank.notes,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.tank_name.trim()) { toast.error('Tank name is required'); return }
    const now = new Date().toISOString()
    if (editTank) {
      const updated: AsphaltTank = {
        ...editTank,
        tank_name: form.tank_name.trim(),
        tank_number: form.tank_number.trim(),
        capacity_gallons: parseFloat(form.capacity_gallons) || 0,
        current_volume_gallons: parseFloat(form.current_volume_gallons) || 0,
        product: form.product,
        temperature_f: parseFloat(form.temperature_f) || 0,
        min_level_gallons: parseFloat(form.min_level_gallons) || 0,
        status: form.status,
        location: form.location.trim(),
        notes: form.notes.trim(),
        last_updated: now,
      }
      setTanks(cur => (cur || []).map(t => t.tank_id === editTank.tank_id ? updated : t))
      toast.success('Tank updated')
    } else {
      const newTank: AsphaltTank = {
        tank_id: `tank-${Date.now()}`,
        tank_name: form.tank_name.trim(),
        tank_number: form.tank_number.trim(),
        capacity_gallons: parseFloat(form.capacity_gallons) || 0,
        current_volume_gallons: parseFloat(form.current_volume_gallons) || 0,
        product: form.product,
        temperature_f: parseFloat(form.temperature_f) || 0,
        min_level_gallons: parseFloat(form.min_level_gallons) || 0,
        status: form.status,
        location: form.location.trim(),
        notes: form.notes.trim(),
        last_updated: now,
      }
      setTanks(cur => [...(cur || []), newTank])
      toast.success('Tank added')
    }
    setDialogOpen(false)
  }

  function openAdjust(tank: AsphaltTank) {
    setAdjustTank(tank)
    setAdjustVolume(String(tank.current_volume_gallons))
    setAdjustNote('')
    setAdjustDialogOpen(true)
  }

  function handleAdjust() {
    if (!adjustTank) return
    const newVol = parseFloat(adjustVolume)
    if (isNaN(newVol) || newVol < 0) { toast.error('Invalid volume'); return }
    if (newVol > adjustTank.capacity_gallons) { toast.error('Volume exceeds tank capacity'); return }
    const updated = { ...adjustTank, current_volume_gallons: newVol, last_updated: new Date().toISOString() }
    setTanks(cur => (cur || []).map(t => t.tank_id === adjustTank.tank_id ? updated : t))
    toast.success(`${adjustTank.tank_name} volume updated`)
    setAdjustDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Drop size={28} className="text-blue-500" />
            Tank Inventory
          </h2>
          <p className="text-muted-foreground mt-1">Monitor hot liquid asphalt storage tanks in real time</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} />
          Add Tank
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Tanks</div>
            <div className="text-2xl font-bold">{(tanks || []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Capacity</div>
            <div className="text-2xl font-bold">{(totalCapacity / 1000).toFixed(0)}K gal</div>
            <div className="text-xs text-muted-foreground">{((totalCapacity * ASPHALT_DENSITY_LBS_GAL) / TONS_TO_LBS / 1000).toFixed(1)}K tons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Current Inventory</div>
            <div className="text-2xl font-bold">{(totalVolume / 1000).toFixed(0)}K gal</div>
            <div className="text-xs text-muted-foreground">{pct(totalVolume, totalCapacity).toFixed(0)}% full</div>
          </CardContent>
        </Card>
        <Card className={lowTanks.length > 0 ? 'border-red-300' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {lowTanks.length > 0 && <Warning size={12} className="text-red-500" />}
              Low Level Alerts
            </div>
            <div className={`text-2xl font-bold ${lowTanks.length > 0 ? 'text-red-600' : ''}`}>{lowTanks.length}</div>
            <div className="text-xs text-muted-foreground">tanks below minimum</div>
          </CardContent>
        </Card>
      </div>

      {/* Tank cards */}
      {(tanks || []).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Drop size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tanks configured. Add your first tank to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(tanks || []).map(tank => {
          const fillPct = pct(tank.current_volume_gallons, tank.capacity_gallons)
          const isLow = tank.current_volume_gallons <= tank.min_level_gallons && tank.status === 'Active'
          const weightTons = (tank.current_volume_gallons * ASPHALT_DENSITY_LBS_GAL) / TONS_TO_LBS
          return (
            <Card key={tank.tank_id} className={isLow ? 'border-red-300 bg-red-50/20 dark:bg-red-950/10' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{tank.tank_name}</CardTitle>
                    <CardDescription className="text-xs">#{tank.tank_number} · {tank.location || 'No location'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusBadge(tank.status)}
                    {isLow && <Badge variant="destructive" className="text-[10px]">LOW</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{tank.current_volume_gallons.toLocaleString()} gal</span>
                    <span>{fillPct.toFixed(0)}%</span>
                    <span>{tank.capacity_gallons.toLocaleString()} gal</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${levelColor(fillPct, isLow)}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {isLow && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <Warning size={12} />
                      Below minimum ({tank.min_level_gallons.toLocaleString()} gal)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Product</div>
                    <div className="font-medium">{tank.product}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Thermometer size={10} />Temp</div>
                    <div className="font-medium">{tank.temperature_f}°F</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Available (tons)</div>
                    <div className="font-medium">{weightTons.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Available Space</div>
                    <div className="font-medium">{(tank.capacity_gallons - tank.current_volume_gallons).toLocaleString()} gal</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => openAdjust(tank)}>
                    <ArrowsClockwise size={12} />
                    Update Level
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEdit(tank)}>
                    <Pencil size={12} />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editTank ? 'Edit Tank' : 'Add New Tank'}</DialogTitle>
            <DialogDescription>Configure asphalt storage tank details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tank Name *</Label>
              <Input value={form.tank_name} onChange={e => setForm(f => ({...f, tank_name: e.target.value}))} placeholder="Tank 1" />
            </div>
            <div className="space-y-1">
              <Label>Tank Number</Label>
              <Input value={form.tank_number} onChange={e => setForm(f => ({...f, tank_number: e.target.value}))} placeholder="T-001" />
            </div>
            <div className="space-y-1">
              <Label>Capacity (gallons)</Label>
              <Input type="number" value={form.capacity_gallons} onChange={e => setForm(f => ({...f, capacity_gallons: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Current Volume (gallons)</Label>
              <Input type="number" value={form.current_volume_gallons} onChange={e => setForm(f => ({...f, current_volume_gallons: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Product Grade</Label>
              <Select value={form.product} onValueChange={v => setForm(f => ({...f, product: v as AsphaltProduct}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Temperature (°F)</Label>
              <Input type="number" value={form.temperature_f} onChange={e => setForm(f => ({...f, temperature_f: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Min Level (gallons)</Label>
              <Input type="number" value={form.min_level_gallons} onChange={e => setForm(f => ({...f, min_level_gallons: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v as TankStatus}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Tank farm area" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editTank ? 'Save Changes' : 'Add Tank'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust level dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tank Level</DialogTitle>
            <DialogDescription>{adjustTank?.tank_name} – Capacity: {adjustTank?.capacity_gallons.toLocaleString()} gal</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Current Volume (gallons)</Label>
              <Input type="number" value={adjustVolume} onChange={e => setAdjustVolume(e.target.value)} />
              {adjustTank && (
                <p className="text-xs text-muted-foreground">
                  {pct(parseFloat(adjustVolume) || 0, adjustTank.capacity_gallons).toFixed(0)}% full
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason for adjustment" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
