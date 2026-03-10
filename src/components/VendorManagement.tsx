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
import { Plus, MagnifyingGlass, Star, Buildings, PencilSimple } from '@phosphor-icons/react'
import type { Vendor, VendorStatus, VendorCategory } from '@/lib/types'

const ALL_CATEGORIES: VendorCategory[] = ['Raw Materials', 'Equipment', 'Services', 'Chemicals', 'Safety', 'Other']
const ALL_STATUSES: VendorStatus[] = ['Active', 'Inactive', 'Preferred', 'Blacklisted']

function generateSampleVendors(): Vendor[] {
  const now = new Date().toISOString()
  return [
    {
      vendor_id: uuidv4(), name: 'Gulf States Asphalt Co.', category: 'Raw Materials', status: 'Preferred',
      contact_name: 'James Tanner', contact_email: 'jtanner@gulfasphalt.com', contact_phone: '(504) 555-0121',
      address: '1234 Refinery Blvd', city: 'Baton Rouge', state: 'LA', zip: '70801',
      payment_terms: 'Net 30', lead_time_days: 7, performance_score: 92, on_time_delivery_rate: 94,
      quality_rating: 4.6, total_spend_ytd: 1240000, notes: 'Primary AC supplier', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Petrolia Supply Inc.', category: 'Chemicals', status: 'Active',
      contact_name: 'Sandra Cruz', contact_email: 'scruz@petrolia.com', contact_phone: '(713) 555-0188',
      address: '9900 Industrial Pkwy', city: 'Houston', state: 'TX', zip: '77001',
      payment_terms: 'Net 45', lead_time_days: 5, performance_score: 87, on_time_delivery_rate: 89,
      quality_rating: 4.2, total_spend_ytd: 415000, notes: 'Flux and modifier supplier', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Southern Safety Equipment', category: 'Safety', status: 'Active',
      contact_name: 'Mike Broussard', contact_email: 'mb@southernsafety.com', contact_phone: '(225) 555-0145',
      address: '400 Commerce St', city: 'Shreveport', state: 'LA', zip: '71101',
      payment_terms: 'Net 30', lead_time_days: 3, performance_score: 95, on_time_delivery_rate: 97,
      quality_rating: 4.8, total_spend_ytd: 78500, notes: 'PPE and safety gear', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Delta Mechanical Services', category: 'Services', status: 'Active',
      contact_name: 'Ray Fontenot', contact_email: 'rfontenot@deltamech.com', contact_phone: '(337) 555-0177',
      address: '200 Plant Dr', city: 'Lake Charles', state: 'LA', zip: '70601',
      payment_terms: 'Net 30', lead_time_days: 2, performance_score: 83, on_time_delivery_rate: 85,
      quality_rating: 4.0, total_spend_ytd: 195000, notes: 'Mechanical maintenance contractor', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Industrial Equipment Corp.', category: 'Equipment', status: 'Active',
      contact_name: 'Brenda Walsh', contact_email: 'bwalsh@iecorp.com', contact_phone: '(985) 555-0199',
      address: '5500 Commerce Way', city: 'New Orleans', state: 'LA', zip: '70112',
      payment_terms: 'Net 60', lead_time_days: 21, performance_score: 78, on_time_delivery_rate: 80,
      quality_rating: 3.9, total_spend_ytd: 320000, notes: 'Process pumps and valves', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Aggregate Resources LLC', category: 'Raw Materials', status: 'Active',
      contact_name: 'Carl Landry', contact_email: 'clandry@aggregateresources.com', contact_phone: '(318) 555-0156',
      address: '780 Quarry Rd', city: 'Monroe', state: 'LA', zip: '71201',
      payment_terms: 'Net 30', lead_time_days: 10, performance_score: 88, on_time_delivery_rate: 91,
      quality_rating: 4.3, total_spend_ytd: 560000, notes: 'Limestone aggregate supplier', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'EcoGuard Environmental', category: 'Services', status: 'Active',
      contact_name: 'Laura Hebert', contact_email: 'lhebert@ecoguard.com', contact_phone: '(504) 555-0134',
      address: '1010 Green Way', city: 'Metairie', state: 'LA', zip: '70001',
      payment_terms: 'Net 30', lead_time_days: 5, performance_score: 90, on_time_delivery_rate: 93,
      quality_rating: 4.5, total_spend_ytd: 42000, notes: 'Environmental monitoring and compliance', created_at: now, updated_at: now
    },
    {
      vendor_id: uuidv4(), name: 'Precision Parts & Fasteners', category: 'Equipment', status: 'Inactive',
      contact_name: 'Gary Thibodaux', contact_email: 'gthibodaux@precisionparts.com', contact_phone: '(225) 555-0167',
      address: '300 Industrial Ave', city: 'Baton Rouge', state: 'LA', zip: '70802',
      payment_terms: 'Net 30', lead_time_days: 7, performance_score: 62, on_time_delivery_rate: 68,
      quality_rating: 3.2, total_spend_ytd: 0, notes: 'Issues with delivery reliability, on hold', created_at: now, updated_at: now
    },
  ]
}

function statusVariant(s: VendorStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'Preferred') return 'default'
  if (s === 'Blacklisted') return 'destructive'
  if (s === 'Inactive') return 'secondary'
  return 'outline'
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} weight={i <= Math.round(rating) ? 'fill' : 'regular'}
          className={i <= Math.round(rating) ? 'text-amber-400' : 'text-muted-foreground/30'} />
      ))}
      <span className="text-xs ml-1 text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

const emptyVendor: Omit<Vendor, 'vendor_id' | 'created_at' | 'updated_at'> = {
  name: '', category: 'Raw Materials', status: 'Active',
  contact_name: '', contact_email: '', contact_phone: '',
  address: '', city: '', state: '', zip: '',
  payment_terms: 'Net 30', lead_time_days: 7, performance_score: 0,
  on_time_delivery_rate: 0, quality_rating: 0, total_spend_ytd: 0, notes: ''
}

export function VendorManagement() {
  const [vendors, setVendors] = useKV<Vendor[]>('vendors', generateSampleVendors())
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<VendorCategory | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<VendorStatus | 'All'>('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState<Omit<Vendor, 'vendor_id' | 'created_at' | 'updated_at'>>(emptyVendor)

  const filtered = useMemo(() => {
    const safeVendors = vendors ?? []
    return safeVendors.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'All' || v.category === filterCategory
      const matchStatus = filterStatus === 'All' || v.status === filterStatus
      return matchSearch && matchCategory && matchStatus
    })
  }, [vendors, search, filterCategory, filterStatus])

  const openAdd = () => {
    setEditVendor(null)
    setForm(emptyVendor)
    setDialogOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditVendor(vendor)
    const { vendor_id: _id, created_at: _ca, updated_at: _ua, ...rest } = vendor
    setForm(rest)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name) {
      toast.error('Vendor name is required')
      return
    }
    const now = new Date().toISOString()
    if (editVendor) {
      setVendors(prev => (prev ?? []).map(v => v.vendor_id === editVendor.vendor_id
        ? { ...v, ...form, updated_at: now } : v))
      toast.success(`${form.name} updated`)
    } else {
      const newVendor: Vendor = { ...form, vendor_id: uuidv4(), created_at: now, updated_at: now }
      setVendors(prev => [newVendor, ...(prev ?? [])])
      toast.success(`${form.name} added`)
    }
    setDialogOpen(false)
  }

  const updateForm = (field: keyof typeof emptyVendor, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Management</h2>
          <p className="text-muted-foreground">Manage supplier relationships and performance</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={v => setFilterCategory(v as VendorCategory | 'All')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as VendorStatus | 'All')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
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
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead className="text-right">On-Time %</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Spend YTD</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vendors found</TableCell>
                </TableRow>
              )}
              {filtered.map(vendor => (
                <TableRow key={vendor.vendor_id}>
                  <TableCell>
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.city}, {vendor.state}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{vendor.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(vendor.status)}>{vendor.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{vendor.contact_name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.contact_phone}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold text-sm ${vendor.performance_score >= 90 ? 'text-green-600' : vendor.performance_score >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                      {vendor.performance_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{vendor.on_time_delivery_rate}%</TableCell>
                  <TableCell>
                    <StarRating rating={vendor.quality_rating} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">${(vendor.total_spend_ytd / 1000).toFixed(0)}K</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(vendor)}>
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
            <DialogTitle className="flex items-center gap-2">
              <Buildings size={18} /> {editVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Vendor Name *</Label>
              <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => updateForm('category', v as VendorCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => updateForm('status', v as VendorStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={e => updateForm('contact_name', e.target.value)} placeholder="Primary contact" />
            </div>
            <div className="space-y-1">
              <Label>Contact Phone</Label>
              <Input value={form.contact_phone} onChange={e => updateForm('contact_phone', e.target.value)} placeholder="(xxx) xxx-xxxx" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Contact Email</Label>
              <Input value={form.contact_email} onChange={e => updateForm('contact_email', e.target.value)} placeholder="email@vendor.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => updateForm('address', e.target.value)} placeholder="Street address" />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={form.city} onChange={e => updateForm('city', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={e => updateForm('state', e.target.value)} maxLength={2} />
              </div>
              <div className="space-y-1">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => updateForm('zip', e.target.value)} maxLength={10} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Payment Terms</Label>
              <Input value={form.payment_terms} onChange={e => updateForm('payment_terms', e.target.value)} placeholder="Net 30" />
            </div>
            <div className="space-y-1">
              <Label>Lead Time (days)</Label>
              <Input type="number" value={form.lead_time_days} min={0} onChange={e => updateForm('lead_time_days', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Performance Score (0-100)</Label>
              <Input type="number" value={form.performance_score} min={0} max={100} onChange={e => updateForm('performance_score', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>On-Time Delivery Rate (%)</Label>
              <Input type="number" value={form.on_time_delivery_rate} min={0} max={100} onChange={e => updateForm('on_time_delivery_rate', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Quality Rating (0-5)</Label>
              <Input type="number" value={form.quality_rating} min={0} max={5} step={0.1} onChange={e => updateForm('quality_rating', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Total Spend YTD ($)</Label>
              <Input type="number" value={form.total_spend_ytd} min={0} onChange={e => updateForm('total_spend_ytd', parseInt(e.target.value) || 0)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editVendor ? 'Save Changes' : 'Add Vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
