import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Buildings, Receipt, TrendUp, Warning, Package, ArrowSquareOut } from '@phosphor-icons/react'
import type { Vendor, PurchaseOrder, POStatus, VendorCategory, AsphaltTank, PartInventoryItem } from '@/lib/types'

function generateInitialData(): { vendors: Vendor[]; pos: PurchaseOrder[] } {
  const now = new Date().toISOString()
  const vendors: Vendor[] = [
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
  ]

  const pos: PurchaseOrder[] = [
    {
      po_id: uuidv4(), po_number: 'PO-2024-0312', vendor_id: vendors[0].vendor_id, vendor_name: vendors[0].name,
      status: 'Ordered', order_date: '2024-11-01', expected_delivery_date: '2024-11-08',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'AC-PG64-22', description: 'PG 64-22 Asphalt Cement', quantity_ordered: 250, quantity_received: 0, unit_cost: 420, total_cost: 105000, unit_of_measure: 'Ton', notes: '' }
      ],
      subtotal: 105000, tax: 0, shipping: 1500, total: 106500,
      requested_by: 'John Davis', approved_by: 'Rachel Kim', notes: 'Rush order for project',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0311', vendor_id: vendors[1].vendor_id, vendor_name: vendors[1].name,
      status: 'Pending Approval', order_date: '2024-10-30', expected_delivery_date: '2024-11-05',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'FLUX-10', description: 'Aromatic Flux Oil', quantity_ordered: 5000, quantity_received: 0, unit_cost: 2.10, total_cost: 10500, unit_of_measure: 'Gallon', notes: '' },
        { line_id: uuidv4(), part_number: 'MOD-SBS', description: 'SBS Polymer Modifier', quantity_ordered: 20, quantity_received: 0, unit_cost: 1850, total_cost: 37000, unit_of_measure: 'Drum', notes: '' }
      ],
      subtotal: 47500, tax: 0, shipping: 800, total: 48300,
      requested_by: 'Tom Hall', approved_by: null, notes: '',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0310', vendor_id: vendors[2].vendor_id, vendor_name: vendors[2].name,
      status: 'Received', order_date: '2024-10-20', expected_delivery_date: '2024-10-23',
      actual_delivery_date: '2024-10-23',
      lines: [
        { line_id: uuidv4(), part_number: 'PPE-HARD', description: 'Hard Hat Class E', quantity_ordered: 20, quantity_received: 20, unit_cost: 24.99, total_cost: 499.80, unit_of_measure: 'EA', notes: '' },
        { line_id: uuidv4(), part_number: 'PPE-GLOVE', description: 'Heat Resistant Gloves', quantity_ordered: 50, quantity_received: 50, unit_cost: 18.50, total_cost: 925.00, unit_of_measure: 'Pair', notes: '' }
      ],
      subtotal: 1424.80, tax: 117.55, shipping: 45, total: 1587.35,
      requested_by: 'Safety Dept', approved_by: 'Rachel Kim', notes: 'Annual safety stock replenishment',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0309', vendor_id: vendors[3].vendor_id, vendor_name: vendors[3].name,
      status: 'Approved', order_date: '2024-10-28', expected_delivery_date: '2024-11-04',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'SVC-PM01', description: 'Pump Overhaul Service', quantity_ordered: 1, quantity_received: 0, unit_cost: 8500, total_cost: 8500, unit_of_measure: 'Job', notes: 'Pump #3 overhaul' }
      ],
      subtotal: 8500, tax: 0, shipping: 0, total: 8500,
      requested_by: 'Maintenance Dept', approved_by: 'Tom Hall', notes: '',
      created_at: now, updated_at: now
    },
    {
      po_id: uuidv4(), po_number: 'PO-2024-0308', vendor_id: vendors[0].vendor_id, vendor_name: vendors[0].name,
      status: 'Draft', order_date: '2024-10-31', expected_delivery_date: '2024-11-10',
      actual_delivery_date: null,
      lines: [
        { line_id: uuidv4(), part_number: 'AC-PG70-22', description: 'PG 70-22 Asphalt Cement', quantity_ordered: 150, quantity_received: 0, unit_cost: 445, total_cost: 66750, unit_of_measure: 'Ton', notes: '' }
      ],
      subtotal: 66750, tax: 0, shipping: 1200, total: 67950,
      requested_by: 'John Davis', approved_by: null, notes: 'Pending board approval',
      created_at: now, updated_at: now
    },
  ]

  return { vendors, pos }
}

const STATUS_COLORS: Record<POStatus, string> = {
  Draft: 'secondary',
  'Pending Approval': 'outline',
  Approved: 'default',
  Ordered: 'default',
  'Partially Received': 'outline',
  Received: 'default',
  Cancelled: 'destructive',
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

/** Maximum number of low-stock parts alerts to show on the dashboard */
const MAX_PARTS_ALERTS = 5

export function ProcurementDashboard() {
  const [vendors] = useKV<Vendor[]>('procurement-vendors', generateInitialData().vendors)
  const [pos] = useKV<PurchaseOrder[]>('purchase-orders', generateInitialData().pos)
  const [asphaltTanks] = useKV<AsphaltTank[]>('asphalt-tanks', [])
  const [partsInventory] = useKV<PartInventoryItem[]>('parts-inventory', [])
  const [, setActiveTab] = useKV<string>('active-tab', 'procurement-dashboard')
  const safeVendors = vendors ?? generateInitialData().vendors
  const safePOs = pos ?? []
  const safeTanks = asphaltTanks ?? []
  const safeParts = partsInventory ?? []

  const kpis = useMemo(() => {
    const totalSpend = safePOs.filter(p => p.status === 'Received' || p.status === 'Partially Received')
      .reduce((s, p) => s + p.total, 0)
    const openPOs = safePOs.filter(p => !['Received', 'Cancelled', 'Draft'].includes(p.status)).length
    const pendingApproval = safePOs.filter(p => p.status === 'Pending Approval').length
    const onTimeVendors = safeVendors.filter(v => v.on_time_delivery_rate > 0)
    const avgOnTime = onTimeVendors.length
      ? onTimeVendors.reduce((s, v) => s + v.on_time_delivery_rate, 0) / onTimeVendors.length
      : 0
    return { totalSpend, openPOs, pendingApproval, avgOnTime }
  }, [safePOs, safeVendors])

  const spendByCategory = useMemo(() => {
    const cats: Record<VendorCategory, number> = {
      'Raw Materials': 0, Equipment: 0, Services: 0, Chemicals: 0, Safety: 0, Other: 0
    }
    safePOs.filter(p => p.status !== 'Cancelled').forEach(po => {
      // Match vendor by ID first, then fall back to name match
      const vendor = safeVendors.find(v => v.vendor_id === po.vendor_id) ??
        safeVendors.find(v => v.name.toLowerCase() === po.vendor_name?.toLowerCase())
      if (vendor) {
        cats[vendor.category] = (cats[vendor.category] || 0) + po.total
      } else {
        cats['Other'] = (cats['Other'] || 0) + po.total
      }
    })
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [safePOs, safeVendors])

  const poStatusDist = useMemo(() => {
    const counts: Record<string, number> = {}
    safePOs.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [safePOs])

  const recentPOs = useMemo(() =>
    [...safePOs].sort((a, b) => b.order_date.localeCompare(a.order_date)).slice(0, 5),
    [safePOs]
  )

  const lowStockAlerts = useMemo(() => {
    const alerts: { item: string; current: string; reorder: string; urgency: 'High' | 'Medium' | 'Low' }[] = []

    // Tanks below minimum level
    safeTanks
      .filter(t => t.status === 'Active' && t.current_volume_gallons <= t.min_level_gallons)
      .forEach(t => {
        const pct = t.min_level_gallons > 0
          ? Math.round((t.current_volume_gallons / t.min_level_gallons) * 100)
          : 0
        alerts.push({
          item: `${t.tank_name} (${t.product})`,
          current: `${Math.round(t.current_volume_gallons).toLocaleString()} gal`,
          reorder: `${Math.round(t.min_level_gallons).toLocaleString()} gal`,
          urgency: pct <= 25 ? 'High' : pct <= 60 ? 'Medium' : 'Low',
        })
      })

    // Parts that are Low Stock or Out of Stock
    safeParts
      .filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
      .slice(0, MAX_PARTS_ALERTS)
      .forEach(p => {
        alerts.push({
          item: `${p.part_name} (${p.part_number})`,
          current: `${p.quantity_on_hand} ${p.unit_of_measure}`,
          reorder: `${p.minimum_stock_level} ${p.unit_of_measure}`,
          urgency: p.status === 'Out of Stock' ? 'High' : 'Medium',
        })
      })

    return alerts
  }, [safeTanks, safeParts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Procurement Dashboard</h2>
          <p className="text-muted-foreground">Supply chain overview and purchasing activity</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setActiveTab('purchase-orders')}>
          <ArrowSquareOut size={16} />
          Manage Purchase Orders
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendUp size={16} /> Total Spend YTD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.totalSpend / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">Received POs only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Receipt size={16} /> Open POs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.openPOs}</div>
            <p className="text-xs text-muted-foreground mt-1">Active purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Warning size={16} /> Pending Approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{kpis.pendingApproval}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting sign-off</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Buildings size={16} /> On-Time Delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.avgOnTime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Avg across vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendByCategory} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Spend']} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">PO Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={poStatusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {poStatusDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent POs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Purchase Orders</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setActiveTab('purchase-orders')}>
            View All <ArrowSquareOut size={12} />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPOs.map(po => (
                <TableRow key={po.po_id}>
                  <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                  <TableCell>{po.vendor_name}</TableCell>
                  <TableCell>{po.order_date}</TableCell>
                  <TableCell>{po.expected_delivery_date}</TableCell>
                  <TableCell className="text-right font-medium">${po.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[po.status] as any}>{po.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} className="text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No low-stock items detected</p>
          ) : (
            <div className="space-y-2">
              {lowStockAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <div>
                    <span className="font-medium text-sm">{alert.item}</span>
                    <span className="text-xs text-muted-foreground ml-3">Current: {alert.current}</span>
                    <span className="text-xs text-muted-foreground ml-3">Reorder point: {alert.reorder}</span>
                  </div>
                  <Badge variant={alert.urgency === 'High' ? 'destructive' : alert.urgency === 'Medium' ? 'outline' : 'secondary'}>
                    {alert.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
