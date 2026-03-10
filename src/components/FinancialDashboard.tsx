import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type {
  MaintenanceCostEntry,
  BudgetEntry,
  SalesOrder,
  ProductionBatch,
  CostCategory,
} from '@/lib/types'
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
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Plus,
  Pencil,
  Trash,
  ChartPie,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const COST_CATEGORIES: CostCategory[] = ['Labor', 'Parts', 'Contractor', 'Equipment Rental', 'Other']

const CATEGORY_COLORS: Record<CostCategory, string> = {
  Labor: 'oklch(0.60 0.15 240)',
  Parts: 'oklch(0.65 0.14 145)',
  Contractor: 'oklch(0.72 0.18 55)',
  'Equipment Rental': 'oklch(0.58 0.20 25)',
  Other: 'oklch(0.75 0.10 300)',
}

const CURRENT_YEAR = new Date().getFullYear()
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Sample data generators ─────────────────────────────────────────────────

function generateSampleCosts(): MaintenanceCostEntry[] {
  const entries: MaintenanceCostEntry[] = []
  const categories: CostCategory[] = ['Labor', 'Parts', 'Contractor', 'Equipment Rental', 'Other']
  const descriptions = {
    Labor: ['Technician overtime', 'Emergency repair crew', 'Scheduled PM labor', 'Welding services'],
    Parts: ['Pump seal kit', 'Bearing replacement', 'Belt replacement', 'Filter elements', 'Valve rebuild kit'],
    Contractor: ['Electrical contractor', 'Hydraulics specialist', 'Crane rental service', 'Alignment service'],
    'Equipment Rental': ['Scissor lift rental', 'Forklift rental', 'Pressure washer rental'],
    Other: ['Safety supplies', 'Lubricants & oils', 'Miscellaneous hardware'],
  }
  for (let month = 1; month <= 12; month++) {
    categories.forEach(cat => {
      const count = 2 + Math.floor(Math.random() * 3)
      const descs = descriptions[cat]
      for (let i = 0; i < count; i++) {
        const baseAmounts: Record<CostCategory, [number, number]> = {
          Labor: [800, 4000],
          Parts: [200, 3000],
          Contractor: [500, 8000],
          'Equipment Rental': [300, 2500],
          Other: [50, 800],
        }
        const [lo, hi] = baseAmounts[cat]
        const amount = Math.round((lo + Math.random() * (hi - lo)) * 100) / 100
        entries.push({
          cost_id: uuidv4(),
          work_order_id: null,
          date: `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
          category: cat,
          description: descs[Math.floor(Math.random() * descs.length)],
          amount,
          vendor: null,
          invoice_number: null,
          created_at: new Date().toISOString(),
        })
      }
    })
  }
  return entries
}

function generateSampleBudgets(): BudgetEntry[] {
  const entries: BudgetEntry[] = []
  const budgets: Record<CostCategory, number> = {
    Labor: 15000,
    Parts: 8000,
    Contractor: 12000,
    'Equipment Rental': 4000,
    Other: 2000,
  }
  COST_CATEGORIES.forEach(cat => {
    for (let month = 1; month <= 12; month++) {
      entries.push({
        budget_id: uuidv4(),
        year: CURRENT_YEAR,
        month,
        category: cat,
        budgeted_amount: budgets[cat] * (0.9 + Math.random() * 0.2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  })
  return entries
}

// ─── Add Cost Dialog ─────────────────────────────────────────────────────────

interface AddCostDialogProps {
  open: boolean
  onClose: () => void
  onSave: (entry: MaintenanceCostEntry) => void
}

function AddCostDialog({ open, onClose, onSave }: AddCostDialogProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Labor' as CostCategory,
    description: '',
    amount: '',
    vendor: '',
    invoice_number: '',
    work_order_id: '',
  })

  const handleSave = () => {
    if (!form.description.trim()) { toast.error('Description is required'); return }
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid positive amount'); return }
    onSave({
      cost_id: uuidv4(),
      work_order_id: form.work_order_id.trim() || null,
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: amt,
      vendor: form.vendor.trim() || null,
      invoice_number: form.invoice_number.trim() || null,
      created_at: new Date().toISOString(),
    })
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Labor', description: '', amount: '', vendor: '', invoice_number: '', work_order_id: '' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cost Entry</DialogTitle>
          <DialogDescription>Record a maintenance cost entry</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as CostCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input placeholder="Describe the cost..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Vendor (optional)</Label>
              <Input placeholder="Vendor name" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Invoice # (optional)</Label>
              <Input placeholder="INV-001" value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Work Order ID (optional)</Label>
              <Input placeholder="WO-xxxx" value={form.work_order_id} onChange={e => setForm(p => ({ ...p, work_order_id: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Entry</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Budget Dialog ────────────────────────────────────────────────────────────

interface BudgetDialogProps {
  open: boolean
  onClose: () => void
  existing: BudgetEntry[]
  onSave: (entries: BudgetEntry[]) => void
}

function BudgetDialog({ open, onClose, existing, onSave }: BudgetDialogProps) {
  const currentMonth = new Date().getMonth() + 1
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(currentMonth)
  const [amounts, setAmounts] = useState<Record<CostCategory, string>>(() => {
    const init: Record<string, string> = {}
    COST_CATEGORIES.forEach(c => { init[c] = '' })
    return init as Record<CostCategory, string>
  })

  const handleOpen = () => {
    const init: Record<string, string> = {}
    COST_CATEGORIES.forEach(cat => {
      const found = existing.find(b => b.year === year && b.month === month && b.category === cat)
      init[cat] = found ? String(found.budgeted_amount) : ''
    })
    setAmounts(init as Record<CostCategory, string>)
  }

  const handleSave = () => {
    const newEntries: BudgetEntry[] = COST_CATEGORIES.map(cat => {
      const existingEntry = existing.find(b => b.year === year && b.month === month && b.category === cat)
      const amt = parseFloat(amounts[cat]) || 0
      return {
        budget_id: existingEntry?.budget_id ?? uuidv4(),
        year,
        month,
        category: cat,
        budgeted_amount: amt,
        created_at: existingEntry?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })
    onSave(newEntries)
    onClose()
    toast.success('Budget updated')
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else handleOpen() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogDescription>Set budget targets by category for a given month</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || CURRENT_YEAR)} />
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {COST_CATEGORIES.map(cat => (
            <div key={cat} className="space-y-1">
              <Label>{cat} Budget ($)</Label>
              <Input
                type="number" min="0" step="100" placeholder="0"
                value={amounts[cat]}
                onChange={e => setAmounts(p => ({ ...p, [cat]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Budget</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinancialDashboard() {
  const [costs, setCosts] = useKV<MaintenanceCostEntry[]>('maintenance-costs', [])
  const [budgets, setBudgets] = useKV<BudgetEntry[]>('maintenance-budgets', [])
  const [salesOrders] = useKV<SalesOrder[]>('sales-orders', [])
  const [productionBatches] = useKV<ProductionBatch[]>('production-batches', [])

  const [addCostOpen, setAddCostOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterCategory, setFilterCategory] = useState<CostCategory | 'All'>('All')

  const safeCosts = costs || []
  const safeBudgets = budgets || []
  const safeSales = salesOrders || []
  const safeBatches = productionBatches || []

  const handleLoadSample = () => {
    setCosts(generateSampleCosts())
    setBudgets(generateSampleBudgets())
    toast.success('Sample financial data loaded')
  }

  const handleAddCost = (entry: MaintenanceCostEntry) => {
    setCosts(c => [...(c || []), entry])
    toast.success('Cost entry added')
  }

  const handleDeleteCost = (id: string) => {
    setCosts(c => (c || []).filter(e => e.cost_id !== id))
    toast.success('Cost entry deleted')
  }

  const handleSaveBudgets = (newEntries: BudgetEntry[]) => {
    setBudgets(current => {
      const existing = (current || []).filter(
        b => !newEntries.some(ne => ne.year === b.year && ne.month === b.month && ne.category === b.category)
      )
      return [...existing, ...newEntries]
    })
  }

  // ─── KPI calculations ────────────────────────────────────────────────────
  const yearCosts = useMemo(() => safeCosts.filter(c => new Date(c.date).getFullYear() === filterYear), [safeCosts, filterYear])

  const totalCostYTD = useMemo(() => yearCosts.reduce((s, c) => s + c.amount, 0), [yearCosts])

  const totalBudgetYTD = useMemo(() =>
    safeBudgets.filter(b => b.year === filterYear).reduce((s, b) => s + b.budgeted_amount, 0),
    [safeBudgets, filterYear])

  const totalRevenue = useMemo(() =>
    safeSales.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total_price, 0),
    [safeSales])

  const totalCollected = useMemo(() =>
    safeSales.filter(o => o.status === 'Paid').reduce((s, o) => s + o.total_price, 0),
    [safeSales])

  const totalProduction = useMemo(() =>
    safeBatches.filter(b => b.status === 'Complete').reduce((s, b) => s + b.actual_tons, 0),
    [safeBatches])

  const outstandingReceivables = useMemo(() =>
    safeSales
      .filter(o => ['Delivered', 'Invoiced'].includes(o.status))
      .reduce((sum, order) => sum + order.total_price, 0),
    [safeSales])

  const pipelineValue = useMemo(() =>
    safeSales
      .filter(o => ['Quote', 'Confirmed', 'In Production', 'Ready'].includes(o.status))
      .reduce((sum, order) => sum + order.total_price, 0),
    [safeSales])

  const topCustomers = useMemo(() => {
    const totals = new Map<string, number>()

    safeSales
      .filter(order => order.status !== 'Cancelled')
      .forEach(order => {
        totals.set(order.customer_name, (totals.get(order.customer_name) || 0) + order.total_price)
      })

    return [...totals.entries()]
      .map(([customer, revenue]) => ({ customer, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [safeSales])

  const unitEconomics = useMemo(() => {
    const revenuePerTon = totalProduction > 0 ? totalRevenue / totalProduction : 0
    const costPerTon = totalProduction > 0 ? totalCostYTD / totalProduction : 0

    return {
      revenuePerTon,
      costPerTon,
      marginPerTon: revenuePerTon - costPerTon,
      collectionRate: totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0
    }
  }, [totalCollected, totalCostYTD, totalProduction, totalRevenue])

  // Monthly cost chart
  const monthlyCostData = useMemo(() => {
    return MONTHS.map((m, i) => {
      const month = i + 1
      const actual = yearCosts
        .filter(c => new Date(c.date).getMonth() + 1 === month)
        .reduce((s, c) => s + c.amount, 0)
      const budget = safeBudgets
        .filter(b => b.year === filterYear && b.month === month)
        .reduce((s, b) => s + b.budgeted_amount, 0)
      return { month: m, actual: Math.round(actual), budget: Math.round(budget) }
    })
  }, [yearCosts, safeBudgets, filterYear])

  // Category breakdown pie
  const categoryData = useMemo(() => {
    return COST_CATEGORIES.map(cat => ({
      name: cat,
      value: Math.round(yearCosts.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0)),
      fill: CATEGORY_COLORS[cat],
    })).filter(d => d.value > 0)
  }, [yearCosts])

  // Filtered cost list
  const filteredCosts = useMemo(() => {
    return yearCosts
      .filter(c => filterCategory === 'All' || c.category === filterCategory)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [yearCosts, filterCategory])

  const budgetPct = totalBudgetYTD > 0 ? Math.round((totalCostYTD / totalBudgetYTD) * 100) : 0

  if (safeCosts.length === 0 && safeBudgets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Financial Overview</h2>
          <p className="text-muted-foreground">Track maintenance costs, budgets, and revenue</p>
        </div>
        <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
            <CurrencyDollar size={32} className="text-primary" weight="duotone" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Financial Data</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start by loading sample data or adding your first cost entry
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleLoadSample}>Load Sample Data</Button>
            <Button variant="outline" onClick={() => setAddCostOpen(true)}>
              <Plus size={16} className="mr-2" />Add Cost Entry
            </Button>
          </div>
        </div>
        <AddCostDialog open={addCostOpen} onClose={() => setAddCostOpen(false)} onSave={handleAddCost} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Financial Overview</h2>
          <p className="text-muted-foreground">Maintenance costs, budgets, and revenue at a glance</p>
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
          <Button variant="outline" onClick={() => setBudgetOpen(true)}>Set Budget</Button>
          <Button onClick={() => setAddCostOpen(true)}>
            <Plus size={16} className="mr-2" />Add Cost
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CurrencyDollar size={14} />Total Cost YTD
            </CardDescription>
            <CardTitle className="text-2xl">{fmt(totalCostYTD)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${budgetPct > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {budgetPct}% of {fmt(totalBudgetYTD)} budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendUp size={14} />Total Revenue
            </CardDescription>
            <CardTitle className="text-2xl">{fmt(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{fmt(totalCollected)} collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ChartPie size={14} />Budget Remaining
            </CardDescription>
            <CardTitle className={`text-2xl ${totalBudgetYTD - totalCostYTD < 0 ? 'text-destructive' : ''}`}>
              {fmt(Math.max(0, totalBudgetYTD - totalCostYTD))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetPct > 100 && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit">
                <Warning size={10} /> Over Budget
              </Badge>
            )}
            {budgetPct <= 100 && (
              <p className="text-sm text-muted-foreground">{100 - budgetPct}% remaining</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendDown size={14} />Production (tons)
            </CardDescription>
            <CardTitle className="text-2xl">{totalProduction.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{safeBatches.filter(b => b.status === 'Complete').length} completed batches</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="business-health">Business Health</TabsTrigger>
          <TabsTrigger value="entries">Cost Entries</TabsTrigger>
        </TabsList>

        {/* Monthly cost vs budget chart */}
        <TabsContent value="trends" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost vs Budget – {filterYear}</CardTitle>
              <CardDescription>Actual maintenance spend compared to budget targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyCostData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="oklch(0.88 0.01 255)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="oklch(0.60 0.15 240)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category pie */}
        <TabsContent value="breakdown" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Category – {filterYear}</CardTitle>
                <CardDescription>Breakdown of maintenance spend by type</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No cost data for {filterYear}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map(d => <Cell key={d.name} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
                <CardDescription>Actual vs budget by cost category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {COST_CATEGORIES.map(cat => {
                    const actual = yearCosts.filter(c => c.category === cat).reduce((s, c) => s + c.amount, 0)
                    const budget = safeBudgets.filter(b => b.year === filterYear && b.category === cat).reduce((s, b) => s + b.budgeted_amount, 0)
                    const pct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat}</span>
                          <span className={actual > budget && budget > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                            {fmt(actual)} {budget > 0 ? `/ ${fmt(budget)}` : ''}
                          </span>
                        </div>
                        {budget > 0 && (
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat} ${pct}% of budget`} style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business-health" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash & Pipeline Snapshot</CardTitle>
                <CardDescription>Current cash conversion and forward revenue visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Outstanding receivables</p>
                  <p className="text-2xl font-semibold">{fmt(outstandingReceivables)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Delivered and invoiced orders awaiting collection</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Open commercial pipeline</p>
                  <p className="text-2xl font-semibold">{fmt(pipelineValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Quotes, confirmed orders, and production-ready demand</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Collection rate</p>
                    <p className="text-2xl font-semibold">{unitEconomics.collectionRate}%</p>
                  </div>
                  <Badge variant={unitEconomics.collectionRate >= 70 ? 'default' : 'secondary'}>
                    {totalCollected > 0 ? 'On Track' : 'Monitor'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Customers</CardTitle>
                <CardDescription>Highest-value accounts across active and completed orders</CardDescription>
              </CardHeader>
              <CardContent>
                {topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No customer revenue available yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.customer} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{customer.customer}</p>
                            <p className="text-xs text-muted-foreground">#{index + 1} revenue contributor</p>
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
                <CardTitle>Unit Economics</CardTitle>
                <CardDescription>How production volume is translating into financial performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Revenue per ton</p>
                    <p className="text-xl font-semibold">{fmt(unitEconomics.revenuePerTon)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Cost per ton</p>
                    <p className="text-xl font-semibold">{fmt(unitEconomics.costPerTon)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Margin proxy per ton</p>
                      <p className={`text-2xl font-semibold ${unitEconomics.marginPerTon < 0 ? 'text-destructive' : ''}`}>
                        {fmt(unitEconomics.marginPerTon)}
                      </p>
                    </div>
                    {unitEconomics.marginPerTon < 0 && (
                      <Badge variant="destructive">Below target</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on total recorded revenue, completed production tons, and maintenance spend.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost entries list */}
        <TabsContent value="entries" className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as CostCategory | 'All')}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {COST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filteredCosts.length} entries</span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredCosts.length === 0 && (
                  <p className="text-muted-foreground text-sm py-8 text-center">No cost entries found</p>
                )}
                {filteredCosts.map(entry => (
                  <div key={entry.cost_id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">{entry.category}</Badge>
                        <span className="text-sm font-medium truncate">{entry.description}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.date}
                        {entry.vendor && ` · ${entry.vendor}`}
                        {entry.work_order_id && ` · WO: ${entry.work_order_id}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-sm">{fmt(entry.amount)}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteCost(entry.cost_id)}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCostDialog open={addCostOpen} onClose={() => setAddCostOpen(false)} onSave={handleAddCost} />
      <BudgetDialog open={budgetOpen} onClose={() => setBudgetOpen(false)} existing={safeBudgets} onSave={handleSaveBudgets} />
    </div>
  )
}
