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
import { Plus, Van, Warning, PencilSimple } from '@phosphor-icons/react'
import type { FleetVehicle, VehicleStatus, VehicleType } from '@/lib/types'

const ALL_VEHICLE_TYPES: VehicleType[] = ['Tanker', 'Flatbed', 'Pickup', 'Service Truck', 'Rail Car', 'Other']
const ALL_VEHICLE_STATUSES: VehicleStatus[] = ['Available', 'In Service', 'Maintenance', 'Out of Service']

function generateSampleVehicles(): FleetVehicle[] {
  const now = new Date().toISOString()
  return [
    {
      vehicle_id: uuidv4(), vehicle_number: 'T-101', vehicle_type: 'Tanker', make: 'Kenworth', model: 'T680',
      year: 2021, license_plate: 'LA-T101', vin: '1XKYD49X4MJ123001', status: 'In Service',
      assigned_driver: 'Carlos Rivera', current_location: 'I-10 Westbound MM 225', odometer_miles: 87432,
      last_service_date: '2024-09-15', next_service_due_miles: 90000, fuel_type: 'Diesel',
      capacity_tons: 25, insurance_expiry: '2025-03-31', registration_expiry: '2025-01-31',
      notes: 'Asphalt tanker #1 – primary unit', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'T-102', vehicle_type: 'Tanker', make: 'Peterbilt', model: '389',
      year: 2020, license_plate: 'LA-T102', vin: '1XPBD49X0LD456002', status: 'Available',
      assigned_driver: null, current_location: 'Plant Yard – Bay 2', odometer_miles: 112840,
      last_service_date: '2024-10-01', next_service_due_miles: 125000, fuel_type: 'Diesel',
      capacity_tons: 25, insurance_expiry: '2025-03-31', registration_expiry: '2025-02-28',
      notes: '', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'T-103', vehicle_type: 'Tanker', make: 'Freightliner', model: 'Cascadia',
      year: 2022, license_plate: 'LA-T103', vin: '3AKJGLD56NSNA7803', status: 'Maintenance',
      assigned_driver: null, current_location: 'Shop Bay 1', odometer_miles: 54210,
      last_service_date: '2024-10-28', next_service_due_miles: 55000, fuel_type: 'Diesel',
      capacity_tons: 28, insurance_expiry: '2025-06-30', registration_expiry: '2025-04-30',
      notes: 'Valve replacement in progress', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'FB-201', vehicle_type: 'Flatbed', make: 'Mack', model: 'Anthem',
      year: 2019, license_plate: 'LA-FB201', vin: '1M2BX9UMXKM002561', status: 'Available',
      assigned_driver: null, current_location: 'Plant Yard – Bay 4', odometer_miles: 143250,
      last_service_date: '2024-08-20', next_service_due_miles: 145000, fuel_type: 'Diesel',
      capacity_tons: 20, insurance_expiry: '2025-03-31', registration_expiry: '2025-03-31',
      notes: 'Material delivery flatbed', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'SV-301', vehicle_type: 'Service Truck', make: 'Ford', model: 'F-550',
      year: 2023, license_plate: 'LA-SV301', vin: '1FD0W5HY4PEC12345', status: 'In Service',
      assigned_driver: 'Marcus Williams', current_location: 'Customer Site – Hwy 190', odometer_miles: 23100,
      last_service_date: '2024-10-10', next_service_due_miles: 25000, fuel_type: 'Diesel',
      capacity_tons: 3, insurance_expiry: '2025-12-31', registration_expiry: '2025-12-31',
      notes: 'Service truck with crane', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'PU-401', vehicle_type: 'Pickup', make: 'Chevrolet', model: 'Silverado 2500',
      year: 2022, license_plate: 'LA-PU401', vin: '1GC4YNE71NF234567', status: 'Available',
      assigned_driver: null, current_location: 'Main Office', odometer_miles: 38750,
      last_service_date: '2024-10-25', next_service_due_miles: 40000, fuel_type: 'Gasoline',
      capacity_tons: 1, insurance_expiry: '2025-12-31', registration_expiry: '2025-12-31',
      notes: 'Supervisor field truck', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'T-104', vehicle_type: 'Tanker', make: 'Volvo', model: 'VNL',
      year: 2018, license_plate: 'LA-T104', vin: '4V4NC9GH4JN903456', status: 'Out of Service',
      assigned_driver: null, current_location: 'Shop Bay 3', odometer_miles: 278900,
      last_service_date: '2024-07-01', next_service_due_miles: 280000, fuel_type: 'Diesel',
      capacity_tons: 22, insurance_expiry: '2025-03-31', registration_expiry: '2025-01-31',
      notes: 'Engine failure – awaiting parts', created_at: now, updated_at: now
    },
    {
      vehicle_id: uuidv4(), vehicle_number: 'PU-402', vehicle_type: 'Pickup', make: 'Ford', model: 'F-250',
      year: 2021, license_plate: 'LA-PU402', vin: '1FT7W2BT9MED78901', status: 'In Service',
      assigned_driver: 'Angela Fontenot', current_location: 'Dispatch Route 3', odometer_miles: 61220,
      last_service_date: '2024-10-05', next_service_due_miles: 62000, fuel_type: 'Gasoline',
      capacity_tons: 1, insurance_expiry: '2025-12-31', registration_expiry: '2025-12-31',
      notes: '', created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: VehicleStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Available') return 'default'
  if (s === 'In Service') return 'outline'
  if (s === 'Maintenance') return 'secondary'
  return 'destructive'
}

const statusColorClass: Record<VehicleStatus, string> = {
  Available: 'text-green-600',
  'In Service': 'text-blue-600',
  Maintenance: 'text-amber-600',
  'Out of Service': 'text-red-600',
}

const emptyVehicle: Omit<FleetVehicle, 'vehicle_id' | 'created_at' | 'updated_at'> = {
  vehicle_number: '', vehicle_type: 'Tanker', make: '', model: '', year: new Date().getFullYear(),
  license_plate: '', vin: '', status: 'Available', assigned_driver: null, current_location: '',
  odometer_miles: 0, last_service_date: '', next_service_due_miles: 0, fuel_type: 'Diesel',
  capacity_tons: 0, insurance_expiry: '', registration_expiry: '', notes: ''
}

export function FleetManagement() {
  const [vehicles, setVehicles] = useKV<FleetVehicle[]>('fleet-vehicles', generateSampleVehicles())
  const safeVehicles = vehicles ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<FleetVehicle | null>(null)
  const [form, setForm] = useState<Omit<FleetVehicle, 'vehicle_id' | 'created_at' | 'updated_at'>>(emptyVehicle)

  const summary = useMemo(() => ({
    total: safeVehicles.length,
    available: safeVehicles.filter(v => v.status === 'Available').length,
    inService: safeVehicles.filter(v => v.status === 'In Service').length,
    maintenance: safeVehicles.filter(v => v.status === 'Maintenance' || v.status === 'Out of Service').length,
  }), [safeVehicles])

  const maintenanceAlerts = useMemo(() =>
    safeVehicles.filter(v => v.next_service_due_miles - v.odometer_miles <= 2000 && v.status !== 'Out of Service'),
    [safeVehicles]
  )

  const openAdd = () => {
    setEditVehicle(null)
    setForm(emptyVehicle)
    setDialogOpen(true)
  }

  const openEdit = (v: FleetVehicle) => {
    setEditVehicle(v)
    const { vehicle_id: _id, created_at: _ca, updated_at: _ua, ...rest } = v
    setForm(rest)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.vehicle_number) {
      toast.error('Vehicle number is required')
      return
    }
    const now = new Date().toISOString()
    if (editVehicle) {
      setVehicles(prev => (prev ?? []).map(v => v.vehicle_id === editVehicle.vehicle_id
        ? { ...v, ...form, updated_at: now } : v))
      toast.success(`${form.vehicle_number} updated`)
    } else {
      const newVehicle: FleetVehicle = { ...form, vehicle_id: uuidv4(), created_at: now, updated_at: now }
      setVehicles(prev => [newVehicle, ...(prev ?? [])])
      toast.success(`${form.vehicle_number} added to fleet`)
    }
    setDialogOpen(false)
  }

  const updateForm = <K extends keyof typeof emptyVehicle>(field: K, value: typeof emptyVehicle[K] | null) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Management</h2>
          <p className="text-muted-foreground">Vehicles, drivers, and service tracking</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> Add Vehicle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Van size={16} />Total Vehicles</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{summary.available}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Service</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{summary.inService}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Maintenance/OOS</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{summary.maintenance}</div></CardContent>
        </Card>
      </div>

      {/* Maintenance Alerts */}
      {maintenanceAlerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Warning size={16} /> Service Due Soon ({maintenanceAlerts.length} vehicles)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {maintenanceAlerts.map(v => (
                <div key={v.vehicle_id} className="text-sm flex items-center justify-between">
                  <span className="font-medium">{v.vehicle_number} – {v.make} {v.model}</span>
                  <span className="text-muted-foreground">{(v.next_service_due_miles - v.odometer_miles).toLocaleString()} miles to service</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make/Model/Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Odometer</TableHead>
                <TableHead>Next Service</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeVehicles.map(v => (
                <TableRow key={v.vehicle_id}>
                  <TableCell className="font-mono font-bold">{v.vehicle_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{v.vehicle_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{v.make} {v.model} {v.year}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(v.status)} className={statusColorClass[v.status]}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{v.assigned_driver || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{v.current_location}</TableCell>
                  <TableCell className="text-right text-sm">{v.odometer_miles.toLocaleString()} mi</TableCell>
                  <TableCell className="text-sm">{v.next_service_due_miles.toLocaleString()} mi</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                      <PencilSimple size={14} />
                    </Button>
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
            <DialogTitle>{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Vehicle Number *</Label>
              <Input value={form.vehicle_number} onChange={e => updateForm('vehicle_number', e.target.value)} placeholder="T-105" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.vehicle_type} onValueChange={v => updateForm('vehicle_type', v as VehicleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Make</Label>
              <Input value={form.make} onChange={e => updateForm('make', e.target.value)} placeholder="Kenworth" />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input value={form.model} onChange={e => updateForm('model', e.target.value)} placeholder="T680" />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" value={form.year} onChange={e => updateForm('year', parseInt(e.target.value) || 2024)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => updateForm('status', v as VehicleStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_VEHICLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>License Plate</Label>
              <Input value={form.license_plate} onChange={e => updateForm('license_plate', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={v => updateForm('fuel_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Gasoline">Gasoline</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Assigned Driver</Label>
              <Input value={form.assigned_driver || ''} onChange={e => updateForm('assigned_driver', e.target.value || null)} placeholder="Leave blank if unassigned" />
            </div>
            <div className="space-y-1">
              <Label>Current Location</Label>
              <Input value={form.current_location} onChange={e => updateForm('current_location', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Odometer (miles)</Label>
              <Input type="number" value={form.odometer_miles} min={0} onChange={e => updateForm('odometer_miles', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Next Service Due (miles)</Label>
              <Input type="number" value={form.next_service_due_miles} min={0} onChange={e => updateForm('next_service_due_miles', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Capacity (tons)</Label>
              <Input type="number" value={form.capacity_tons} min={0} step={0.5} onChange={e => updateForm('capacity_tons', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Last Service Date</Label>
              <Input type="date" value={form.last_service_date} onChange={e => updateForm('last_service_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Insurance Expiry</Label>
              <Input type="date" value={form.insurance_expiry} onChange={e => updateForm('insurance_expiry', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Registration Expiry</Label>
              <Input type="date" value={form.registration_expiry} onChange={e => updateForm('registration_expiry', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editVehicle ? 'Save Changes' : 'Add Vehicle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
