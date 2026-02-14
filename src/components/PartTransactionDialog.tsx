import { useState } from 'react'
import type { PartInventoryItem, PartTransaction } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { recordPartTransaction } from '@/lib/inventory-utils'
import { toast } from 'sonner'

interface PartTransactionDialogProps {
  open: boolean
  part: PartInventoryItem
  onClose: () => void
  onAddTransaction: (transaction: PartTransaction) => void
}

export function PartTransactionDialog({
  open,
  part,
  onClose,
  onAddTransaction
}: PartTransactionDialogProps) {
  const [transactionType, setTransactionType] = useState<PartTransaction['transaction_type']>('Use')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(part.unit_cost.toString())
  const [workOrderId, setWorkOrderId] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (transactionType === 'Use' && qty > part.quantity_on_hand) {
      toast.error('Quantity exceeds available stock')
      return
    }

    const cost = parseFloat(unitCost) || part.unit_cost
    const totalCost = qty * cost

    const transaction: Omit<PartTransaction, 'transaction_id' | 'created_at'> = {
      part_id: part.part_id,
      transaction_type: transactionType,
      quantity: qty,
      unit_cost: cost,
      total_cost: totalCost,
      work_order_id: workOrderId || null,
      employee_id: null,
      from_location: transactionType === 'Transfer' ? part.location : null,
      to_location: null,
      notes,
      created_by: 'System'
    }

    const result = recordPartTransaction(part, transaction)
    onAddTransaction(result.transaction)
    
    toast.success(`Transaction recorded: ${transactionType} ${qty} ${part.unit_of_measure}`)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setTransactionType('Use')
    setQuantity('')
    setUnitCost(part.unit_cost.toString())
    setWorkOrderId('')
    setNotes('')
  }

  const projectedQuantity = () => {
    const qty = parseInt(quantity) || 0
    switch (transactionType) {
      case 'Purchase':
      case 'Return':
        return part.quantity_on_hand + qty
      case 'Use':
      case 'Transfer':
        return Math.max(0, part.quantity_on_hand - qty)
      case 'Adjustment':
        return qty
      default:
        return part.quantity_on_hand
    }
  }

  const totalCost = (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>
            {part.part_name} ({part.part_number})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{part.quantity_on_hand}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Projected Stock</p>
              <p className="text-2xl font-bold">{projectedQuantity()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select value={transactionType} onValueChange={(v) => setTransactionType(v as PartTransaction['transaction_type'])}>
              <SelectTrigger id="transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Use">Use (Issue from stock)</SelectItem>
                <SelectItem value="Purchase">Purchase (Add to stock)</SelectItem>
                <SelectItem value="Return">Return (Add to stock)</SelectItem>
                <SelectItem value="Adjustment">Adjustment (Set quantity)</SelectItem>
                <SelectItem value="Transfer">Transfer (Remove from stock)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={transactionType === 'Adjustment' ? 'New total quantity' : 'Quantity'}
            />
            <p className="text-xs text-muted-foreground">
              {transactionType === 'Adjustment' 
                ? 'Enter the new total quantity'
                : `Available: ${part.quantity_on_hand} ${part.unit_of_measure}`
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-cost">Unit Cost ($)</Label>
            <Input
              id="unit-cost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>

          {totalCost > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</p>
            </div>
          )}

          {transactionType === 'Use' && (
            <div className="space-y-2">
              <Label htmlFor="work-order">Work Order ID (Optional)</Label>
              <Input
                id="work-order"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                placeholder="WO-12345"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this transaction"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Record Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
