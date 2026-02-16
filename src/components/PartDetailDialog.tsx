import { useState, useMemo } from 'react'
import type { PartInventoryItem, PartTransaction } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Package, Clock, ShoppingCart, TrendUp } from '@phosphor-icons/react'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface PartDetailDialogProps {
  open: boolean
  part: PartInventoryItem
  transactions: PartTransaction[]
  onClose: () => void
  onUpdate: (partId: string, updates: Partial<PartInventoryItem>) => void
}

export function PartDetailDialog({
  open,
  part,
  transactions,
  onClose,
  onUpdate
}: PartDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [minimumStockLevel, setMinimumStockLevel] = useState(part.minimum_stock_level.toString())
  const [reorderQuantity, setReorderQuantity] = useState(part.reorder_quantity.toString())
  const [location, setLocation] = useState(part.location)
  const [notes, setNotes] = useState(part.notes)

  const totalValue = part.quantity_on_hand * part.unit_cost
  const recentTransactions = transactions.slice(0, 10)

  const handleSave = () => {
    onUpdate(part.part_id, {
      minimum_stock_level: parseInt(minimumStockLevel) || part.minimum_stock_level,
      reorder_quantity: parseInt(reorderQuantity) || part.reorder_quantity,
      location,
      notes,
      updated_at: new Date().toISOString()
    })
    setIsEditing(false)
    toast.success('Part updated successfully')
  }

  const getStatusColor = (status: PartInventoryItem['status']) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-500 text-white'
      case 'Low Stock':
        return 'bg-orange-500 text-white'
      case 'Out of Stock':
        return 'bg-red-500 text-white'
      case 'On Order':
        return 'bg-blue-500 text-white'
      case 'Discontinued':
        return 'bg-gray-500 text-white'
    }
  }

  const getTransactionTypeColor = (type: PartTransaction['transaction_type']) => {
    switch (type) {
      case 'Purchase':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Use':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Return':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'Adjustment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Transfer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{part.part_name}</DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-mono font-medium">{part.part_number}</span>
                {' • '}
                <Badge variant="outline" className="ml-2">{part.category}</Badge>
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(part.status)}>{part.status}</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">On Hand</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{part.quantity_on_hand}</div>
                  <p className="text-xs text-muted-foreground">{part.unit_of_measure}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Min Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{part.minimum_stock_level}</div>
                  <p className="text-xs text-muted-foreground">Reorder at</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unit Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${part.unit_cost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">per {part.unit_of_measure}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">On-hand value</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Part Information</CardTitle>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Part Number</Label>
                    <p className="font-mono font-medium mt-1">{part.part_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium mt-1">{part.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="font-medium mt-1">{part.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="font-medium mt-1">{part.supplier || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Minimum Stock Level</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={minimumStockLevel}
                        onChange={(e) => setMinimumStockLevel(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{part.minimum_stock_level}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reorder Quantity</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={reorderQuantity}
                        onChange={(e) => setReorderQuantity(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{part.reorder_quantity}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    {isEditing ? (
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{part.location || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unit of Measure</Label>
                    <p className="font-medium mt-1">{part.unit_of_measure}</p>
                  </div>
                </div>

                {part.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{part.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1">{part.notes || 'No notes'}</p>
                  )}
                </div>

                {part.compatible_equipment.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Compatible Equipment</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {part.compatible_equipment.map((eq, i) => (
                        <Badge key={i} variant="secondary">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Last 10 transactions for this part</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Work Order</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.map((txn) => (
                          <TableRow key={txn.transaction_id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(txn.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getTransactionTypeColor(txn.transaction_type)}>
                                {txn.transaction_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {txn.transaction_type === 'Use' ? '-' : '+'}{txn.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono">${txn.unit_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ${txn.total_cost.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {txn.work_order_id || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {txn.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            {(() => {
              const monthlyData = Array.from({ length: 6 }, (_, i) => {
                const monthDate = subMonths(new Date(), 5 - i)
                const monthStart = startOfMonth(monthDate)
                const monthEnd = endOfMonth(monthDate)
                const monthTxns = transactions.filter(t => {
                  const txnDate = new Date(t.created_at)
                  return isWithinInterval(txnDate, { start: monthStart, end: monthEnd })
                })
                const used = monthTxns
                  .filter(t => t.transaction_type === 'Use')
                  .reduce((sum, t) => sum + t.quantity, 0)
                const purchased = monthTxns
                  .filter(t => t.transaction_type === 'Purchase')
                  .reduce((sum, t) => sum + t.quantity, 0)
                return {
                  month: format(monthDate, 'MMM yyyy'),
                  used,
                  purchased,
                }
              })

              const totalUsed = transactions
                .filter(t => t.transaction_type === 'Use')
                .reduce((sum, t) => sum + t.quantity, 0)
              const totalPurchased = transactions
                .filter(t => t.transaction_type === 'Purchase')
                .reduce((sum, t) => sum + t.quantity, 0)
              const avgMonthlyUse = monthlyData.length > 0
                ? Math.round(monthlyData.reduce((s, m) => s + m.used, 0) / monthlyData.length)
                : 0
              const monthsUntilEmpty = avgMonthlyUse > 0 && part.quantity_on_hand > 0
                ? Math.round(part.quantity_on_hand / avgMonthlyUse * 10) / 10
                : null

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-sm text-muted-foreground">Total Used</p>
                        <p className="text-2xl font-bold">{totalUsed}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-sm text-muted-foreground">Total Purchased</p>
                        <p className="text-2xl font-bold">{totalPurchased}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-sm text-muted-foreground">Avg Monthly Use</p>
                        <p className="text-2xl font-bold">
                          {avgMonthlyUse}
                          {monthsUntilEmpty !== null && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              (~{monthsUntilEmpty} mo. remaining)
                            </span>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Monthly Usage vs. Purchases</CardTitle>
                      <CardDescription>Last 6 months of transaction activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No transaction data available yet. Record transactions to see analytics.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 255)" />
                            <XAxis dataKey="month" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="used" name="Used" fill="oklch(0.58 0.20 25)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="purchased" name="Purchased" fill="oklch(0.62 0.17 145)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {transactions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Stock Level Trend</CardTitle>
                        <CardDescription>How your stock level has changed over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={(() => {
                            const sorted = [...transactions].sort(
                              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            )
                            // Each transaction's net effect on stock level
                            const effects = sorted.map(t => {
                              let effect = 0
                              if (t.transaction_type === 'Purchase' || t.transaction_type === 'Return') {
                                effect = t.quantity // increased stock
                              } else if (t.transaction_type === 'Use' || t.transaction_type === 'Transfer') {
                                effect = -t.quantity // decreased stock
                              }
                              return { date: format(new Date(t.created_at), 'MMM d'), effect }
                            })
                            // Walk backwards from current stock to find starting level
                            const totalEffect = effects.reduce((s, e) => s + e.effect, 0)
                            const startingLevel = part.quantity_on_hand - totalEffect
                            // Walk forward to reconstruct each point
                            let level = startingLevel
                            return effects.map(e => {
                              level += e.effect
                              return { date: e.date, stock: Math.max(0, level) }
                            })
                          })()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 255)" />
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="stock"
                              name="Stock Level"
                              stroke="oklch(0.35 0.12 255)"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
