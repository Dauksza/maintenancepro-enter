import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { ProductionBatch, SalesOrder, AsphaltProduct } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  ComposedChart,
  Area,
} from 'recharts'
import {
  Factory,
  CurrencyDollar,
  TrendUp,
  ShoppingCart,
  Package,
  Users,
} from '@phosphor-icons/react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_YEAR = new Date().getFullYear()

const PRODUCT_COLORS = [
  'oklch(0.60 0.15 240)',
  'oklch(0.65 0.14 145)',
  'oklch(0.72 0.18 55)',
  'oklch(0.58 0.20 25)',
  'oklch(0.75 0.10 300)',
  'oklch(0.55 0.18 200)',
  'oklch(0.68 0.16 170)',
  'oklch(0.80 0.12 40)',
  'oklch(0.50 0.10 260)',
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtTons(n: number) {
  return `${n.toLocaleString()} t`
}

export function ProductionSalesAnalytics() {
  const [batches] = useKV<ProductionBatch[]>('production-batches', [])
  const [orders] = useKV<SalesOrder[]>('sales-orders', [])

  const safeBatches = batches || []
  const safeOrders = orders || []

  const yearBatches = useMemo(
    () => safeBatches.filter(b => new Date(b.date).getFullYear() === CURRENT_YEAR),
    [safeBatches],
  )
  const yearOrders = useMemo(
    () => safeOrders.filter(o => new Date(o.order_date).getFullYear() === CURRENT_YEAR),
    [safeOrders],
  )

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalProducedTons = useMemo(
    () => yearBatches.filter(b => b.status === 'Complete').reduce((s, b) => s + b.actual_tons, 0),
    [yearBatches],
  )
  const totalRevenue = useMemo(
    () => yearOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total_price, 0),
    [yearOrders],
  )
  const totalSoldTons = useMemo(
    () => yearOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.quantity_tons, 0),
    [yearOrders],
  )
  const revenuePerTon = totalSoldTons > 0 ? totalRevenue / totalSoldTons : 0

  const fulfillmentRate = useMemo(() => {
    const delivered = yearOrders.filter(o =>
      ['Delivered', 'Invoiced', 'Paid'].includes(o.status),
    ).length
    const confirmed = yearOrders.filter(o => o.status !== 'Cancelled').length
    return confirmed > 0 ? Math.round((delivered / confirmed) * 100) : 0
  }, [yearOrders])

  // ── Monthly Production vs Sales Volume ─────────────────────────────────────
  const monthlyComparison = useMemo(
    () =>
      MONTHS.map((m, i) => {
        const month = i + 1
        const producedTons = yearBatches
          .filter(b => new Date(b.date).getMonth() + 1 === month && b.status === 'Complete')
          .reduce((s, b) => s + b.actual_tons, 0)
        const orderedTons = yearOrders
          .filter(o => new Date(o.order_date).getMonth() + 1 === month && o.status !== 'Cancelled')
          .reduce((s, o) => s + o.quantity_tons, 0)
        const revenue = yearOrders
          .filter(o => new Date(o.order_date).getMonth() + 1 === month && o.status !== 'Cancelled')
          .reduce((s, o) => s + o.total_price, 0)
        return {
          month: m,
          produced: Math.round(producedTons),
          ordered: Math.round(orderedTons),
          revenue: Math.round(revenue),
        }
      }),
    [yearBatches, yearOrders],
  )

  // ── Revenue + Production by Product ────────────────────────────────────────
  const productBreakdown = useMemo(() => {
    const byProduct: Record<AsphaltProduct, { revenue: number; tons: number; orders: number }> = {} as any
    yearOrders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        if (!byProduct[o.product]) byProduct[o.product] = { revenue: 0, tons: 0, orders: 0 }
        byProduct[o.product].revenue += o.total_price
        byProduct[o.product].tons += o.quantity_tons
        byProduct[o.product].orders += 1
      })
    return Object.entries(byProduct)
      .map(([product, data], i) => ({
        product,
        revenue: Math.round(data.revenue),
        tons: Math.round(data.tons),
        orders: data.orders,
        revenuePerTon: data.tons > 0 ? Math.round(data.revenue / data.tons) : 0,
        fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [yearOrders])

  // ── Top Customers ───────────────────────────────────────────────────────────
  const topCustomers = useMemo(() => {
    const byCustomer: Record<string, { revenue: number; tons: number; orders: number }> = {}
    yearOrders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        if (!byCustomer[o.customer_name]) byCustomer[o.customer_name] = { revenue: 0, tons: 0, orders: 0 }
        byCustomer[o.customer_name].revenue += o.total_price
        byCustomer[o.customer_name].tons += o.quantity_tons
        byCustomer[o.customer_name].orders += 1
      })
    return Object.entries(byCustomer)
      .map(([customer, data]) => ({
        customer,
        revenue: Math.round(data.revenue),
        tons: Math.round(data.tons),
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [yearOrders])

  // ── Order Pipeline (status breakdown) ──────────────────────────────────────
  const orderPipeline = useMemo(() => {
    const STATUS_ORDER = ['Quote', 'Confirmed', 'In Production', 'Ready', 'Delivered', 'Invoiced', 'Paid', 'Cancelled']
    const counts: Record<string, number> = {}
    yearOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return STATUS_ORDER.filter(s => counts[s]).map((s, i) => ({
      name: s,
      value: counts[s] || 0,
      fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
    }))
  }, [yearOrders])

  // ── Efficiency Trend ────────────────────────────────────────────────────────
  const efficiencyTrend = useMemo(
    () =>
      MONTHS.map((m, i) => {
        const month = i + 1
        const monthBatches = yearBatches.filter(
          b => new Date(b.date).getMonth() + 1 === month && b.status === 'Complete' && b.target_tons > 0,
        )
        const avgEff =
          monthBatches.length > 0
            ? (monthBatches.reduce((s, b) => s + b.actual_tons / b.target_tons, 0) / monthBatches.length) * 100
            : null
        return { month: m, efficiency: avgEff !== null ? Math.round(avgEff * 10) / 10 : null }
      }),
    [yearBatches],
  )

  const hasData = yearBatches.length > 0 || yearOrders.length > 0

  if (!hasData) {
    return (
      <div className="bg-card border rounded-xl p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
          <TrendUp size={32} className="text-primary" weight="duotone" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Production or Sales Data</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Load sample data in the Production Tracking and Sales Orders tabs to see analytics here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Factory size={14} />
              Produced YTD
            </CardDescription>
            <CardTitle className="text-2xl">{fmtTons(Math.round(totalProducedTons))}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {yearBatches.filter(b => b.status === 'Complete').length} completed batches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CurrencyDollar size={14} />
              Revenue YTD
            </CardDescription>
            <CardTitle className="text-2xl">{fmt(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {yearOrders.filter(o => o.status !== 'Cancelled').length} active orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendUp size={14} />
              Avg Revenue / Ton
            </CardDescription>
            <CardTitle className="text-2xl">{revenuePerTon > 0 ? fmt(revenuePerTon) : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{fmtTons(Math.round(totalSoldTons))} sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShoppingCart size={14} />
              Fulfillment Rate
            </CardDescription>
            <CardTitle className="text-2xl">{fulfillmentRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Orders delivered / invoiced / paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly: Production vs Sales Volume */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Production vs Sales Volume – {CURRENT_YEAR}</CardTitle>
          <CardDescription>Tons produced (completed batches) vs tons ordered (non-cancelled orders)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyComparison} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="tons" tickFormatter={v => `${v}t`} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="revenue" orientation="right" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Revenue' ? fmt(value) : `${value.toLocaleString()} t`
                }
              />
              <Legend />
              <Bar yAxisId="tons" dataKey="produced" name="Produced (t)" fill="oklch(0.62 0.17 145)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="tons" dataKey="ordered" name="Ordered (t)" fill="oklch(0.60 0.15 240)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="oklch(0.72 0.18 55)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Product & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Revenue by Product
            </CardTitle>
            <CardDescription>Total invoiced revenue per product grade</CardDescription>
          </CardHeader>
          <CardContent>
            {productBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No sales data for {CURRENT_YEAR}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={productBreakdown} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="product" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) => name === 'Revenue ($)' ? fmt(v) : `${v.toLocaleString()} t`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue ($)" radius={[0, 3, 3, 0]}>
                    {productBreakdown.map(d => (
                      <Cell key={d.product} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} />
              Top Customers
            </CardTitle>
            <CardDescription>Revenue by customer for {CURRENT_YEAR}</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No customer data for {CURRENT_YEAR}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCustomers} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="customer" type="category" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="oklch(0.60 0.15 240)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Pipeline & Efficiency Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Order Pipeline
            </CardTitle>
            <CardDescription>Order count by status for {CURRENT_YEAR}</CardDescription>
          </CardHeader>
          <CardContent>
            {orderPipeline.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No orders for {CURRENT_YEAR}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={orderPipeline}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {orderPipeline.map(d => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory size={18} />
              Production Efficiency Trend
            </CardTitle>
            <CardDescription>Monthly avg efficiency (actual / target tons) for {CURRENT_YEAR}</CardDescription>
          </CardHeader>
          <CardContent>
            {yearBatches.filter(b => b.status === 'Complete').length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No completed batches for {CURRENT_YEAR}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={efficiencyTrend} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 110]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v !== null && v !== undefined ? `${v}%` : 'N/A'} />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    name="Efficiency %"
                    stroke="oklch(0.62 0.17 145)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product profitability table */}
      {productBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Profitability Summary</CardTitle>
            <CardDescription>Revenue, volume, and average price per ton by product grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Product</th>
                    <th className="text-right py-2 pr-4 font-medium">Orders</th>
                    <th className="text-right py-2 pr-4 font-medium">Volume (t)</th>
                    <th className="text-right py-2 pr-4 font-medium">Revenue</th>
                    <th className="text-right py-2 font-medium">Avg $/ton</th>
                  </tr>
                </thead>
                <tbody>
                  {productBreakdown.map(p => (
                    <tr key={p.product} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 font-medium">{p.product}</td>
                      <td className="text-right py-2 pr-4 text-muted-foreground">{p.orders}</td>
                      <td className="text-right py-2 pr-4">{p.tons.toLocaleString()}</td>
                      <td className="text-right py-2 pr-4">{fmt(p.revenue)}</td>
                      <td className="text-right py-2">{fmt(p.revenuePerTon)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
