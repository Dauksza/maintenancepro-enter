import { useState, useMemo } from 'react'
import type { PartInventoryItem, PartTransaction, InventoryAlert, PartCategory, PartStatus } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Plus,
  MagnifyingGlass,
  Warning,
  TrendUp,
  TrendDown,
  ShoppingCart,
  ArrowsClockwise,
  ChartBar,
  FunnelSimple
} from '@phosphor-icons/react'
import { 
  calculateTotalInventoryValue,
  generateInventoryAlerts,
  searchParts,
  getPartsByCategory
} from '@/lib/inventory-utils'
import { AddPartDialog } from './AddPartDialog'
import { PartDetailDialog } from './PartDetailDialog'
import { PartTransactionDialog } from './PartTransactionDialog'
import { toast } from 'sonner'

interface PartsInventoryProps {
  parts: PartInventoryItem[]
  transactions: PartTransaction[]
  onAddPart: (part: PartInventoryItem) => void
  onUpdatePart: (partId: string, updates: Partial<PartInventoryItem>) => void
  onAddTransaction: (transaction: PartTransaction) => void
}

export function PartsInventory({
  parts,
  transactions,
  onAddPart,
  onUpdatePart,
  onAddTransaction
}: PartsInventoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<PartStatus | 'All'>('All')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<PartInventoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const alerts = useMemo(() => generateInventoryAlerts(parts), [parts])
  const criticalAlerts = alerts.filter(a => a.severity === 'Critical' && !a.resolved)
  const highAlerts = alerts.filter(a => a.severity === 'High' && !a.resolved)

  const filteredParts = useMemo(() => {
    let filtered = parts

    if (searchQuery) {
      filtered = searchParts(filtered, searchQuery)
    }

    if (categoryFilter !== 'All') {
      filtered = getPartsByCategory(filtered, categoryFilter)
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    return filtered.sort((a, b) => a.part_name.localeCompare(b.part_name))
  }, [parts, searchQuery, categoryFilter, statusFilter])

  const totalValue = useMemo(() => calculateTotalInventoryValue(parts), [parts])
  const lowStockCount = parts.filter(p => p.status === 'Low Stock').length
  const outOfStockCount = parts.filter(p => p.status === 'Out of Stock').length

  const handlePartClick = (part: PartInventoryItem) => {
    setSelectedPart(part)
    setDetailOpen(true)
  }

  const handleAddTransaction = (part: PartInventoryItem) => {
    setSelectedPart(part)
    setTransactionDialogOpen(true)
  }

  const handleGenerateReorderList = () => {
    const reorderRows = parts
      .filter(part => part.quantity_on_hand <= part.minimum_stock_level && part.status !== 'Discontinued')
      .map(part => {
        const quantity = Math.max(part.reorder_quantity, part.minimum_stock_level - part.quantity_on_hand)
        return {
          part_number: part.part_number,
          part_name: part.part_name,
          quantity,
          vendor: part.supplier,
        }
      })

    if (reorderRows.length === 0) {
      toast.info('No reorder items found')
      return
    }

    const csvHeader = 'Part Number,Part Name,Quantity,Vendor\n'
    const csvBody = reorderRows
      .map(row => `"${row.part_number}","${row.part_name}",${row.quantity},"${row.vendor}"`)
      .join('\n')
    const csv = `${csvHeader}${csvBody}`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reorder-list-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Generated reorder list with ${reorderRows.length} item${reorderRows.length === 1 ? '' : 's'}`)
  }

  const getStatusBadge = (status: PartStatus) => {
    const variants: Record<PartStatus, string> = {
      'In Stock': 'bg-green-500 text-white',
      'Low Stock': 'bg-orange-500 text-white',
      'Out of Stock': 'bg-red-500 text-white',
      'On Order': 'bg-blue-500 text-white',
      'Discontinued': 'bg-gray-500 text-white'
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Parts & Inventory Management</h2>
          <p className="text-muted-foreground">
            Track spare parts, manage stock levels, and monitor usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateReorderList} className="gap-2">
            <ShoppingCart size={16} weight="bold" />
            Generate Reorder List
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus size={18} weight="bold" />
            Add Part
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parts.length}</div>
            <p className="text-xs text-muted-foreground">
              {parts.filter(p => p.status === 'In Stock').length} in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Total on-hand value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendDown className="h-4 w-4 text-orange-500" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Below minimum level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Warning className="h-4 w-4 text-red-500" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {(criticalAlerts.length > 0 || highAlerts.length > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Warning size={20} weight="fill" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map(alert => (
              <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-md">
                <div>
                  <p className="font-medium text-destructive">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.recommended_action}</p>
                </div>
                <Button size="sm" variant="destructive">
                  <ShoppingCart size={16} />
                  Order Now
                </Button>
              </div>
            ))}
            {highAlerts.map(alert => (
              <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-400">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.recommended_action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as PartCategory | 'All')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Hydraulic">Hydraulic</SelectItem>
                  <SelectItem value="Pneumatic">Pneumatic</SelectItem>
                  <SelectItem value="Consumable">Consumable</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Tool">Tool</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PartStatus | 'All')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  <SelectItem value="On Order">On Order</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty on Hand</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No parts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow
                      key={part.part_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePartClick(part)}
                    >
                      <TableCell className="font-mono font-medium">{part.part_number}</TableCell>
                      <TableCell className="font-medium">{part.part_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{part.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{part.quantity_on_hand}</TableCell>
                      <TableCell className="text-right font-mono">{part.minimum_stock_level}</TableCell>
                      <TableCell>{getStatusBadge(part.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{part.location}</TableCell>
                      <TableCell className="text-right font-mono">${part.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${(part.quantity_on_hand * part.unit_cost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddTransaction(part)
                          }}
                        >
                          <ArrowsClockwise size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddPartDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={onAddPart}
      />

      {selectedPart && (
        <>
          <PartDetailDialog
            open={detailOpen}
            part={selectedPart}
            transactions={transactions.filter(t => t.part_id === selectedPart.part_id)}
            onClose={() => {
              setDetailOpen(false)
              setSelectedPart(null)
            }}
            onUpdate={onUpdatePart}
          />
          <PartTransactionDialog
            open={transactionDialogOpen}
            part={selectedPart}
            onClose={() => {
              setTransactionDialogOpen(false)
              setSelectedPart(null)
            }}
            onAddTransaction={(transaction) => {
              onAddTransaction(transaction)
              setTransactionDialogOpen(false)
              setSelectedPart(null)
            }}
          />
        </>
      )}
    </div>
  )
}
