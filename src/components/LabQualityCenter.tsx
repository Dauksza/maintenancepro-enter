import { useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { AsphaltProduct } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Clock, Flask, Plus, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

type LabView = 'dashboard' | 'queue' | 'specs'
type LabSampleStatus = 'Queued' | 'Testing' | 'Approved' | 'Hold'

interface LabSample {
  sample_id: string
  sample_number: string
  product: AsphaltProduct
  customer: string
  test_package: string
  requested_tests: string[]
  sample_date: string
  due_date: string
  technician: string
  status: LabSampleStatus
  notes: string
}

interface LabSpecification {
  spec_id: string
  product: AsphaltProduct
  viscosity_min: number
  viscosity_max: number
  softening_point_min: number
  max_storage_temp_f: number
  release_note: string
  updated_at: string
}

const ASPHALT_PRODUCTS: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
const LAB_STATUSES: LabSampleStatus[] = ['Queued', 'Testing', 'Approved', 'Hold']

function isoDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split('T')[0]
}

function statusBadge(status: LabSampleStatus) {
  if (status === 'Approved') {
    return <Badge className="border-green-200 bg-green-100 text-green-700">{status}</Badge>
  }
  if (status === 'Testing') {
    return <Badge className="border-blue-200 bg-blue-100 text-blue-700">{status}</Badge>
  }
  if (status === 'Hold') {
    return <Badge className="border-amber-200 bg-amber-100 text-amber-700">{status}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

function generateDefaultSamples(): LabSample[] {
  return [
    {
      sample_id: uuidv4(),
      sample_number: 'LAB-2401',
      product: 'PG 64-22',
      customer: 'City of Huntsville',
      test_package: 'Binder Release',
      requested_tests: ['Viscosity', 'Softening Point', 'Elastic Recovery'],
      sample_date: isoDate(-1),
      due_date: isoDate(0),
      technician: 'Jamie Carter',
      status: 'Testing',
      notes: 'Rush verification for morning dispatch.'
    },
    {
      sample_id: uuidv4(),
      sample_number: 'LAB-2402',
      product: 'PG 76-22',
      customer: 'ALDOT District 3',
      test_package: 'Polymer Validation',
      requested_tests: ['Polymer Content', 'Softening Point', 'Penetration'],
      sample_date: isoDate(-2),
      due_date: isoDate(1),
      technician: 'Morgan Blake',
      status: 'Queued',
      notes: 'Awaiting second retained sample.'
    },
    {
      sample_id: uuidv4(),
      sample_number: 'LAB-2403',
      product: 'Emulsion',
      customer: 'Internal Tank Check',
      test_package: 'Storage Stability',
      requested_tests: ['Residue', 'Settlement', 'Viscosity'],
      sample_date: isoDate(-3),
      due_date: isoDate(-1),
      technician: 'Alex Turner',
      status: 'Hold',
      notes: 'Viscosity outside historical trend; confirm tank temperature.'
    },
    {
      sample_id: uuidv4(),
      sample_number: 'LAB-2404',
      product: 'PG 70-22',
      customer: 'Jefferson Paving',
      test_package: 'Shipment Release',
      requested_tests: ['Viscosity', 'Softening Point'],
      sample_date: isoDate(-1),
      due_date: isoDate(0),
      technician: 'Jamie Carter',
      status: 'Approved',
      notes: 'Released for afternoon loadout.'
    }
  ]
}

function generateDefaultSpecifications(): LabSpecification[] {
  return [
    {
      spec_id: uuidv4(),
      product: 'PG 64-22',
      viscosity_min: 325,
      viscosity_max: 475,
      softening_point_min: 126,
      max_storage_temp_f: 345,
      release_note: 'Standard terminal release limits.',
      updated_at: isoDate(-7)
    },
    {
      spec_id: uuidv4(),
      product: 'PG 70-22',
      viscosity_min: 375,
      viscosity_max: 550,
      softening_point_min: 138,
      max_storage_temp_f: 360,
      release_note: 'Requires polymer verification before shipment.',
      updated_at: isoDate(-5)
    },
    {
      spec_id: uuidv4(),
      product: 'PG 76-22',
      viscosity_min: 425,
      viscosity_max: 650,
      softening_point_min: 149,
      max_storage_temp_f: 370,
      release_note: 'Escalate any elastic recovery miss to quality manager.',
      updated_at: isoDate(-2)
    }
  ]
}

interface SampleDialogProps {
  open: boolean
  onClose: () => void
  onSave: (sample: LabSample) => void
}

function SampleDialog({ open, onClose, onSave }: SampleDialogProps) {
  const [form, setForm] = useState({
    sample_number: '',
    product: 'PG 64-22' as AsphaltProduct,
    customer: '',
    test_package: 'Binder Release',
    requested_tests: 'Viscosity, Softening Point',
    sample_date: isoDate(0),
    due_date: isoDate(1),
    technician: '',
    status: 'Queued' as LabSampleStatus,
    notes: '',
  })

  const handleSave = () => {
    if (!form.sample_number.trim()) { toast.error('Sample number is required'); return }
    if (!form.customer.trim()) { toast.error('Customer or source is required'); return }
    onSave({
      sample_id: uuidv4(),
      sample_number: form.sample_number.trim(),
      product: form.product,
      customer: form.customer.trim(),
      test_package: form.test_package.trim(),
      requested_tests: form.requested_tests.split(',').map(item => item.trim()).filter(Boolean),
      sample_date: form.sample_date,
      due_date: form.due_date,
      technician: form.technician.trim() || 'Unassigned',
      status: form.status,
      notes: form.notes.trim(),
    })
    setForm({
      sample_number: '',
      product: 'PG 64-22',
      customer: '',
      test_package: 'Binder Release',
      requested_tests: 'Viscosity, Softening Point',
      sample_date: isoDate(0),
      due_date: isoDate(1),
      technician: '',
      status: 'Queued',
      notes: '',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Lab Sample</DialogTitle>
          <DialogDescription>Create a new lab request for production release, customer QC, or internal verification.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sample-number">Sample Number</Label>
            <Input id="sample-number" value={form.sample_number} placeholder="LAB-2405" onChange={event => setForm(current => ({ ...current, sample_number: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={form.product} onValueChange={value => setForm(current => ({ ...current, product: value as AsphaltProduct }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASPHALT_PRODUCTS.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer">Customer / Source</Label>
            <Input id="customer" value={form.customer} placeholder="Plant, terminal, or customer name" onChange={event => setForm(current => ({ ...current, customer: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="package">Test Package</Label>
            <Input id="package" value={form.test_package} placeholder="Binder Release" onChange={event => setForm(current => ({ ...current, test_package: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sample-date">Sample Date</Label>
            <Input id="sample-date" type="date" value={form.sample_date} onChange={event => setForm(current => ({ ...current, sample_date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input id="due-date" type="date" value={form.due_date} onChange={event => setForm(current => ({ ...current, due_date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="technician">Technician</Label>
            <Input id="technician" value={form.technician} placeholder="Assigned technician" onChange={event => setForm(current => ({ ...current, technician: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={value => setForm(current => ({ ...current, status: value as LabSampleStatus }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LAB_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requested-tests">Requested Tests</Label>
          <Textarea id="requested-tests" rows={2} value={form.requested_tests} placeholder="Comma separated tests" onChange={event => setForm(current => ({ ...current, requested_tests: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sample-notes">Notes</Label>
          <Textarea id="sample-notes" rows={3} value={form.notes} placeholder="Special release notes or customer requests" onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Sample</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SpecificationDialogProps {
  open: boolean
  onClose: () => void
  onSave: (specification: LabSpecification) => void
  existing?: LabSpecification | null
}

function SpecificationDialog({ open, onClose, onSave, existing }: SpecificationDialogProps) {
  const [form, setForm] = useState({
    product: existing?.product ?? 'PG 64-22' as AsphaltProduct,
    viscosity_min: existing?.viscosity_min?.toString() ?? '',
    viscosity_max: existing?.viscosity_max?.toString() ?? '',
    softening_point_min: existing?.softening_point_min?.toString() ?? '',
    max_storage_temp_f: existing?.max_storage_temp_f?.toString() ?? '',
    release_note: existing?.release_note ?? '',
  })

  const handleSave = () => {
    const viscosityMin = Number(form.viscosity_min)
    const viscosityMax = Number(form.viscosity_max)
    const softeningPointMin = Number(form.softening_point_min)
    const maxStorageTemp = Number(form.max_storage_temp_f)

    if ([viscosityMin, viscosityMax, softeningPointMin, maxStorageTemp].some(value => Number.isNaN(value) || value <= 0)) {
      toast.error('Enter valid numeric limits for the specification')
      return
    }

    onSave({
      spec_id: existing?.spec_id ?? uuidv4(),
      product: form.product,
      viscosity_min: viscosityMin,
      viscosity_max: viscosityMax,
      softening_point_min: softeningPointMin,
      max_storage_temp_f: maxStorageTemp,
      release_note: form.release_note.trim(),
      updated_at: isoDate(0),
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit' : 'Add'} Product Specification</DialogTitle>
          <DialogDescription>Maintain the release limits the lab uses to clear production batches and shipments.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Product</Label>
            <Select value={form.product} onValueChange={value => setForm(current => ({ ...current, product: value as AsphaltProduct }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASPHALT_PRODUCTS.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="viscosity-min">Viscosity Min</Label>
            <Input id="viscosity-min" type="number" min="0" value={form.viscosity_min} onChange={event => setForm(current => ({ ...current, viscosity_min: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="viscosity-max">Viscosity Max</Label>
            <Input id="viscosity-max" type="number" min="0" value={form.viscosity_max} onChange={event => setForm(current => ({ ...current, viscosity_max: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="softening-min">Softening Point Min</Label>
            <Input id="softening-min" type="number" min="0" value={form.softening_point_min} onChange={event => setForm(current => ({ ...current, softening_point_min: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage-temp">Max Storage Temp °F</Label>
            <Input id="storage-temp" type="number" min="0" value={form.max_storage_temp_f} onChange={event => setForm(current => ({ ...current, max_storage_temp_f: event.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="release-note">Release Guidance</Label>
          <Textarea id="release-note" rows={3} value={form.release_note} onChange={event => setForm(current => ({ ...current, release_note: event.target.value }))} placeholder="Escalation rules, customer notes, and release guidance" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Specification</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LabQualityCenter({ view }: { view: LabView }) {
  const defaultSamples = useMemo(() => generateDefaultSamples(), [])
  const defaultSpecifications = useMemo(() => generateDefaultSpecifications(), [])
  const [samples, setSamples] = useKV<LabSample[]>('lab-quality-samples', defaultSamples)
  const [specifications, setSpecifications] = useKV<LabSpecification[]>('lab-quality-specifications', defaultSpecifications)
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false)
  const [specDialogOpen, setSpecDialogOpen] = useState(false)
  const [editingSpecification, setEditingSpecification] = useState<LabSpecification | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | LabSampleStatus>('all')
  const [productFilter, setProductFilter] = useState<'all' | AsphaltProduct>('all')

  const today = isoDate(0)
  const openSamples = (samples || []).filter(sample => sample.status !== 'Approved')
  const dueToday = (samples || []).filter(sample => sample.status !== 'Approved' && sample.due_date <= today)
  const releaseReady = (samples || []).filter(sample => sample.status === 'Approved')
  const holdCount = (samples || []).filter(sample => sample.status === 'Hold').length

  const visibleSamples = (samples || []).filter(sample => {
    if (statusFilter !== 'all' && sample.status !== statusFilter) return false
    if (productFilter !== 'all' && sample.product !== productFilter) return false
    return true
  })

  const dashboardTitle = view === 'dashboard'
    ? 'Lab dashboard'
    : view === 'queue'
      ? 'Sample queue'
      : 'Product specifications'

  const dashboardDescription = view === 'dashboard'
    ? 'Monitor release readiness, sample turnaround, and product quality in one place.'
    : view === 'queue'
      ? 'Track active samples from intake through approval, hold, or release.'
      : 'Maintain the release limits and guidance used by the lab team.'

  const saveSample = (sample: LabSample) => {
    setSamples(current => [sample, ...(current || [])])
    toast.success('Lab sample added')
  }

  const saveSpecification = (specification: LabSpecification) => {
    setSpecifications(current => {
      const existing = (current || []).some(item => item.spec_id === specification.spec_id)
      if (existing) {
        return (current || []).map(item => item.spec_id === specification.spec_id ? specification : item)
      }
      return [specification, ...(current || [])]
    })
    setEditingSpecification(null)
    toast.success(existingSpecificationMessage(specification, specifications || []))
  }

  const updateSampleStatus = (sampleId: string, status: LabSampleStatus) => {
    setSamples(current => (current || []).map(sample => sample.sample_id === sampleId ? { ...sample, status } : sample))
    toast.success(`Sample updated to ${status.toLowerCase()}`)
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Flask size={14} weight="fill" />
              Lab & Quality
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl">{dashboardTitle}</CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">{dashboardDescription}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setEditingSpecification(null); setSpecDialogOpen(true) }}>
              <Plus size={16} />
              Add specification
            </Button>
            <Button onClick={() => setSampleDialogOpen(true)}>
              <Plus size={16} />
              Log sample
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open samples</CardDescription>
            <CardTitle className="text-3xl">{openSamples.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} />
            Requiring active lab attention
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due today</CardDescription>
            <CardTitle className="text-3xl">{dueToday.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Warning size={16} />
            Turnaround commitments at risk
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Release ready</CardDescription>
            <CardTitle className="text-3xl">{releaseReady.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle size={16} />
            Samples approved for production or shipment
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>On hold</CardDescription>
            <CardTitle className="text-3xl">{holdCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Warning size={16} />
            Review failed or suspect results
          </CardContent>
        </Card>
      </div>

      {(view === 'dashboard' || view === 'queue') && (
        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Active lab samples</CardTitle>
              <CardDescription>Manage testing progress, release holds, and urgent turnarounds.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | LabSampleStatus)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LAB_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={value => setProductFilter(value as 'all' | AsphaltProduct)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {ASPHALT_PRODUCTS.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSamples.map(sample => (
                  <TableRow key={sample.sample_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{sample.sample_number}</p>
                        <p className="text-xs text-muted-foreground">{sample.customer}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sample.product}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{sample.test_package}</p>
                        <p className="text-xs text-muted-foreground">{sample.requested_tests.join(', ')}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sample.due_date}</TableCell>
                    <TableCell>{sample.technician}</TableCell>
                    <TableCell>{statusBadge(sample.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {sample.status !== 'Testing' && (
                          <Button size="sm" variant="outline" onClick={() => updateSampleStatus(sample.sample_id, 'Testing')}>
                            Start
                          </Button>
                        )}
                        {sample.status !== 'Approved' && (
                          <Button size="sm" onClick={() => updateSampleStatus(sample.sample_id, 'Approved')}>
                            Approve
                          </Button>
                        )}
                        {sample.status !== 'Hold' && (
                          <Button size="sm" variant="secondary" onClick={() => updateSampleStatus(sample.sample_id, 'Hold')}>
                            Hold
                          </Button>
                        )}
                        {sample.status === 'Hold' && (
                          <Button size="sm" variant="outline" onClick={() => updateSampleStatus(sample.sample_id, 'Queued')}>
                            Requeue
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleSamples.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No lab samples match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(view === 'dashboard' || view === 'specs') && (
        <Card>
          <CardHeader>
            <CardTitle>Release specifications</CardTitle>
            <CardDescription>Reference viscosity, softening point, and storage limits before clearing production.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Viscosity Range</TableHead>
                  <TableHead>Softening Point Min</TableHead>
                  <TableHead>Max Storage Temp</TableHead>
                  <TableHead>Guidance</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(specifications || []).map(specification => (
                  <TableRow key={specification.spec_id}>
                    <TableCell className="font-medium">{specification.product}</TableCell>
                    <TableCell>{specification.viscosity_min} - {specification.viscosity_max}</TableCell>
                    <TableCell>{specification.softening_point_min} °F</TableCell>
                    <TableCell>{specification.max_storage_temp_f} °F</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-sm text-muted-foreground">{specification.release_note}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSpecification(specification)
                          setSpecDialogOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SampleDialog open={sampleDialogOpen} onClose={() => setSampleDialogOpen(false)} onSave={saveSample} />
      <SpecificationDialog
        key={editingSpecification?.spec_id ?? 'new-specification'}
        open={specDialogOpen}
        onClose={() => {
          setSpecDialogOpen(false)
          setEditingSpecification(null)
        }}
        onSave={saveSpecification}
        existing={editingSpecification}
      />
    </div>
  )
}

function existingSpecificationMessage(specification: LabSpecification, specifications: LabSpecification[]) {
  return specifications.some(item => item.spec_id === specification.spec_id)
    ? 'Specification updated'
    : 'Specification added'
}

export function LabDashboard() {
  return <LabQualityCenter view="dashboard" />
}

export function LabSampleQueue() {
  return <LabQualityCenter view="queue" />
}

export function LabSpecifications() {
  return <LabQualityCenter view="specs" />
}
