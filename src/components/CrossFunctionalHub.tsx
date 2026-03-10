import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type {
  BudgetEntry,
  CertificationReminder,
  MaintenanceCostEntry,
  PartInventoryItem,
  ProductionBatch,
  SalesOrder,
  WorkOrder,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ChartLineUp,
  Clock,
  CurrencyDollar,
  Factory,
  Package,
  ShieldCheck,
  WarningCircle,
  Wrench,
} from '@phosphor-icons/react'

type ModuleKey = 'salesFinance' | 'production' | 'maintenance'

interface CrossFunctionalHubProps {
  currentModule?: ModuleKey | null
}

const MODULE_CONTEXT: Record<ModuleKey, string> = {
  salesFinance: 'Track how plant readiness and maintenance execution affect customer commitments and cash flow.',
  production: 'Coordinate plant throughput with maintenance priorities and the sales pipeline from one shared view.',
  maintenance: 'See which maintenance actions have the biggest downstream impact on operations, delivery, and margin.',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function CrossFunctionalHub({ currentModule }: CrossFunctionalHubProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [workOrders] = useKV<WorkOrder[]>('maintenance-work-orders', [])
  const [parts] = useKV<PartInventoryItem[]>('parts-inventory', [])
  const [reminders] = useKV<CertificationReminder[]>('certification-reminders', [])
  const [productionBatches] = useKV<ProductionBatch[]>('production-batches', [])
  const [salesOrders] = useKV<SalesOrder[]>('sales-orders', [])
  const [costEntries] = useKV<MaintenanceCostEntry[]>('maintenance-costs', [])
  const [budgets] = useKV<BudgetEntry[]>('maintenance-budgets', [])

  const safeWorkOrders = workOrders || []
  const safeParts = parts || []
  const safeReminders = reminders || []
  const safeBatches = productionBatches || []
  const safeSalesOrders = salesOrders || []
  const safeCostEntries = costEntries || []
  const safeBudgets = budgets || []

  const openWorkOrders = useMemo(
    () => safeWorkOrders.filter(order => !['Completed', 'Cancelled'].includes(order.status)),
    [safeWorkOrders],
  )
  const overdueWorkOrders = useMemo(
    () => openWorkOrders.filter(order => order.is_overdue || order.status === 'Overdue'),
    [openWorkOrders],
  )
  const criticalWorkOrders = useMemo(
    () => openWorkOrders.filter(order => order.priority_level === 'Critical'),
    [openWorkOrders],
  )
  const plannedDowntimeHours = useMemo(
    () => openWorkOrders.reduce((sum, order) => sum + (order.estimated_downtime_hours || 0), 0),
    [openWorkOrders],
  )
  const overdueDowntimeHours = useMemo(
    () => overdueWorkOrders.reduce((sum, order) => sum + (order.estimated_downtime_hours || 0), 0),
    [overdueWorkOrders],
  )
  const lowStockParts = useMemo(
    () => safeParts.filter(part => ['Low Stock', 'Out of Stock'].includes(part.status)),
    [safeParts],
  )
  const expiringCertifications = useMemo(
    () => safeReminders.filter(reminder => reminder.days_until_expiry <= 30 && !reminder.dismissed),
    [safeReminders],
  )

  const yearBatches = useMemo(
    () => safeBatches.filter(batch => new Date(batch.date).getFullYear() === currentYear),
    [currentYear, safeBatches],
  )
  const activeBatches = useMemo(
    () => yearBatches.filter(batch => ['Planned', 'In Progress'].includes(batch.status)),
    [yearBatches],
  )
  const completedBatches = useMemo(
    () => yearBatches.filter(batch => batch.status === 'Complete'),
    [yearBatches],
  )
  const producedTons = useMemo(
    () => completedBatches.reduce((sum, batch) => sum + batch.actual_tons, 0),
    [completedBatches],
  )
  const scheduledTons = useMemo(
    () => activeBatches.reduce((sum, batch) => sum + batch.target_tons, 0),
    [activeBatches],
  )
  const recordedDowntimeHours = useMemo(
    () => completedBatches.reduce((sum, batch) => sum + batch.downtime_minutes, 0) / 60,
    [completedBatches],
  )

  const yearSalesOrders = useMemo(
    () => safeSalesOrders.filter(order => new Date(order.order_date).getFullYear() === currentYear),
    [currentYear, safeSalesOrders],
  )
  const activeSalesOrders = useMemo(
    () => yearSalesOrders.filter(order => !['Paid', 'Cancelled'].includes(order.status)),
    [yearSalesOrders],
  )
  const pipelineOrders = useMemo(
    () => yearSalesOrders.filter(order => ['Quote', 'Confirmed', 'In Production', 'Ready'].includes(order.status)),
    [yearSalesOrders],
  )
  const receivableOrders = useMemo(
    () => yearSalesOrders.filter(order => ['Delivered', 'Invoiced'].includes(order.status)),
    [yearSalesOrders],
  )
  const openDemandTons = useMemo(
    () => pipelineOrders.reduce((sum, order) => sum + order.quantity_tons, 0),
    [pipelineOrders],
  )
  const activeOrderValue = useMemo(
    () => activeSalesOrders.reduce((sum, order) => sum + order.total_price, 0),
    [activeSalesOrders],
  )
  const pipelineValue = useMemo(
    () => pipelineOrders.reduce((sum, order) => sum + order.total_price, 0),
    [pipelineOrders],
  )
  const receivablesValue = useMemo(
    () => receivableOrders.reduce((sum, order) => sum + order.total_price, 0),
    [receivableOrders],
  )

  const yearCosts = useMemo(
    () => safeCostEntries.filter(entry => new Date(entry.date).getFullYear() === currentYear),
    [currentYear, safeCostEntries],
  )
  const yearBudget = useMemo(
    () => safeBudgets.filter(entry => entry.year === currentYear),
    [currentYear, safeBudgets],
  )
  const maintenanceSpend = useMemo(
    () => yearCosts.reduce((sum, entry) => sum + entry.amount, 0),
    [yearCosts],
  )
  const maintenanceBudget = useMemo(
    () => yearBudget.reduce((sum, entry) => sum + entry.budgeted_amount, 0),
    [yearBudget],
  )

  const maintenanceReadiness = calculateCoverage(openWorkOrders.length - overdueWorkOrders.length, openWorkOrders.length)
  const partsCoverage = safeParts.length > 0
    ? clampPercentage(((safeParts.length - lowStockParts.length) / safeParts.length) * 100)
    : 100
  const certificationCoverage = calculateCoverage(
    safeReminders.length - expiringCertifications.length,
    safeReminders.length,
  )
  const demandCoverage = calculateCoverage(scheduledTons, openDemandTons)
  const budgetCoverage = calculateCoverage(maintenanceBudget - maintenanceSpend, maintenanceBudget)
  const demandCoverageDetail = openDemandTons > 0
    ? `${Math.round(scheduledTons).toLocaleString()} t scheduled vs ${Math.round(openDemandTons).toLocaleString()} t open demand`
    : 'No open demand is currently waiting on production scheduling.'
  const budgetCoverageDetail = maintenanceBudget === 0
    ? 'Add budgets to track spend headroom'
    : maintenanceSpend > maintenanceBudget
      ? `${formatCurrency(maintenanceSpend - maintenanceBudget)} over annual budget`
      : `${formatCurrency(Math.max(maintenanceBudget - maintenanceSpend, 0))} remaining`

  const productAlignment = useMemo(() => {
    const demandByProduct = new Map<string, number>()
    const supplyByProduct = new Map<string, number>()

    pipelineOrders.forEach(order => {
      demandByProduct.set(order.product, (demandByProduct.get(order.product) || 0) + order.quantity_tons)
    })

    activeBatches.forEach(batch => {
      supplyByProduct.set(batch.product, (supplyByProduct.get(batch.product) || 0) + batch.target_tons)
    })

    return [...new Set([...demandByProduct.keys(), ...supplyByProduct.keys()])]
      .map(product => {
        const demand = Math.round(demandByProduct.get(product) || 0)
        const supply = Math.round(supplyByProduct.get(product) || 0)
        return {
          product,
          demand,
          supply,
          gap: supply - demand,
        }
      })
      .filter(item => item.demand > 0 || item.supply > 0)
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
      .slice(0, 4)
  }, [activeBatches, pipelineOrders])

  const actionItems = useMemo(() => {
    const items: Array<{ title: string; detail: string; tone: 'default' | 'warning' | 'critical' }> = []

    if (overdueWorkOrders.length > 0) {
      items.push({
        title: 'Clear overdue maintenance work',
        detail: `${overdueWorkOrders.length} overdue work orders account for ${overdueDowntimeHours.toFixed(1)} planned downtime hours.`,
        tone: overdueWorkOrders.length > 3 ? 'critical' : 'warning',
      })
    }

    if (scheduledTons < openDemandTons) {
      items.push({
        title: 'Close the production-to-demand gap',
        detail: `${Math.round(openDemandTons - scheduledTons).toLocaleString()} tons are still uncovered in the active commercial pipeline.`,
        tone: 'critical',
      })
    }

    if (lowStockParts.length > 0) {
      items.push({
        title: 'Protect parts availability',
        detail: `${lowStockParts.length} stocked items could delay maintenance or production recovery plans.`,
        tone: lowStockParts.length > 5 ? 'critical' : 'warning',
      })
    }

    if (maintenanceBudget > 0 && maintenanceSpend > maintenanceBudget * 0.85) {
      items.push({
        title: 'Review spend before budget is exhausted',
        detail: `${formatCurrency(maintenanceSpend)} has been used against a ${formatCurrency(maintenanceBudget)} annual maintenance budget.`,
        tone: maintenanceSpend > maintenanceBudget ? 'critical' : 'warning',
      })
    }

    if (expiringCertifications.length > 0) {
      items.push({
        title: 'Maintain technician coverage',
        detail: `${expiringCertifications.length} certifications expire in the next 30 days and could affect staffing flexibility.`,
        tone: 'warning',
      })
    }

    if (items.length === 0) {
      items.push({
        title: 'Operations are aligned',
        detail: 'Maintenance, production, and commercial indicators are currently balanced with no major cross-functional blockers.',
        tone: 'default',
      })
    }

    return items.slice(0, 4)
  }, [
    expiringCertifications.length,
    lowStockParts.length,
    maintenanceBudget,
    maintenanceSpend,
    openDemandTons,
    overdueDowntimeHours,
    overdueWorkOrders.length,
    scheduledTons,
  ])

  const summaryText = currentModule ? MODULE_CONTEXT[currentModule] : 'A shared operational picture for maintenance, production, sales, and finance teams.'

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background/80">Maintenance + Production + Finance</Badge>
            <Badge variant="secondary">Shared operating picture</Badge>
          </div>
          <div>
            <CardTitle className="text-3xl">Operations Hub</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
              {summaryText}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wrench}
          label="Open work orders"
          value={openWorkOrders.length.toLocaleString()}
          helper={`${criticalWorkOrders.length} critical · ${overdueWorkOrders.length} overdue`}
        />
        <MetricCard
          icon={Factory}
          label="Scheduled production"
          value={`${Math.round(scheduledTons).toLocaleString()} t`}
          helper={`${activeBatches.length} active batches`}
        />
        <MetricCard
          icon={CurrencyDollar}
          label="Active order value"
          value={formatCurrency(activeOrderValue)}
          helper={`${pipelineOrders.length} pipeline orders`}
        />
        <MetricCard
          icon={ChartLineUp}
          label="Maintenance spend"
          value={formatCurrency(maintenanceSpend)}
          helper={maintenanceBudget > 0 ? `${formatCurrency(maintenanceBudget)} annual budget` : 'No budget set'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck size={18} />
              Maintenance readiness
            </CardTitle>
            <CardDescription>Readiness signals that ripple into throughput and service delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ReadinessRow label="Schedule adherence" value={maintenanceReadiness} detail={`${overdueWorkOrders.length} overdue of ${openWorkOrders.length || 0} open`} />
            <ReadinessRow label="Parts coverage" value={partsCoverage} detail={`${lowStockParts.length} low or out of stock`} />
            <ReadinessRow
              label="Certification coverage"
              value={certificationCoverage}
              detail={`${expiringCertifications.length} expiring soon`}
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <SnapshotStat icon={Clock} label="Planned downtime" value={`${plannedDowntimeHours.toFixed(1)} h`} />
              <SnapshotStat icon={Package} label="Parts at risk" value={lowStockParts.length.toString()} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory size={18} />
              Production & demand alignment
            </CardTitle>
            <CardDescription>Compare available plant output with what customers and dispatchers already need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ReadinessRow
              label="Open demand coverage"
              value={demandCoverage}
              detail={demandCoverageDetail}
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <SnapshotStat icon={Factory} label="Produced YTD" value={`${Math.round(producedTons).toLocaleString()} t`} />
              <SnapshotStat icon={Clock} label="Recorded downtime" value={`${recordedDowntimeHours.toFixed(1)} h`} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Product alignment watch list</p>
              {productAlignment.length > 0 ? (
                <div className="space-y-2">
                  {productAlignment.map(item => (
                    <ProductAlignmentRow key={item.product} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No current production or demand conflicts detected.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CurrencyDollar size={18} />
              Commercial & financial impact
            </CardTitle>
            <CardDescription>Keep delivery promises, receivables, and maintenance spend aligned.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ReadinessRow
              label="Budget remaining"
              value={budgetCoverage}
              detail={budgetCoverageDetail}
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <SnapshotStat icon={CurrencyDollar} label="Pipeline value" value={formatCurrency(pipelineValue)} />
              <SnapshotStat icon={ChartLineUp} label="Receivables" value={formatCurrency(receivablesValue)} />
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">Integrated position</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Active customer orders</span>
                  <span className="font-medium text-foreground">{activeSalesOrders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Critical maintenance work</span>
                  <span className="font-medium text-foreground">{criticalWorkOrders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Production runs in motion</span>
                  <span className="font-medium text-foreground">{activeBatches.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <WarningCircle size={18} />
            Cross-functional priorities
          </CardTitle>
          <CardDescription>Action items synthesized from maintenance, production, and customer demand data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {actionItems.map(item => (
            <div key={item.title} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <Badge variant={item.tone === 'critical' ? 'destructive' : item.tone === 'warning' ? 'secondary' : 'outline'}>
                  {item.tone === 'critical' ? 'Urgent' : item.tone === 'warning' ? 'Watch' : 'Stable'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function calculateCoverage(numerator: number, denominator: number) {
  if (denominator <= 0) return 100
  return clampPercentage((numerator / denominator) * 100)
}

interface MetricCardProps {
  icon: typeof Wrench
  label: string
  value: string
  helper: string
}

function MetricCard({ icon: Icon, label, value, helper }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon size={14} />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

interface ReadinessRowProps {
  label: string
  value: number
  detail: string
}

function ReadinessRow({ label, value, detail }: ReadinessRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} />
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

interface SnapshotStatProps {
  icon: typeof Wrench
  label: string
  value: string
}

function SnapshotStat({ icon: Icon, label, value }: SnapshotStatProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

interface ProductAlignmentItem {
  product: string
  demand: number
  supply: number
  gap: number
}

function ProductAlignmentRow({ item }: { item: ProductAlignmentItem }) {
  const isCovered = item.gap >= 0
  const gapLabel = isCovered ? `+${item.gap}` : item.gap

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <div>
        <p className="font-medium">{item.product}</p>
        <p className="text-xs text-muted-foreground">{item.demand.toLocaleString()} t demand · {item.supply.toLocaleString()} t scheduled</p>
      </div>
      <Badge variant={isCovered ? 'secondary' : 'destructive'}>
        {gapLabel} t
      </Badge>
    </div>
  )
}
