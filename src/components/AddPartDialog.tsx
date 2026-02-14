import { useState } from 'react'
import type { PartInventoryItem, PartCategory } from '@/lib/types'
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
import { generatePartId } from '@/lib/inventory-utils'
import { toast } from 'sonner'

interface AddPartDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (part: PartInventoryItem) => void
}

export function AddPartDialog({ open, onClose, onAdd }: AddPartDialogProps) {
  const [partNumber, setPartNumber] = useState('')
  const [partName, setPartName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PartCategory>('Mechanical')
  const [manufacturer, setManufacturer] = useState('')
  const [supplier, setSupplier] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [quantityOnHand, setQuantityOnHand] = useState('')
  const [minimumStockLevel, setMinimumStockLevel] = useState('')
  const [reorderQuantity, setReorderQuantity] = useState('')
  const [unitOfMeasure, setUnitOfMeasure] = useState('Each')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!partNumber || !partName) {
      toast.error('Part number and name are required')
      return
    }

    const qty = parseInt(quantityOnHand) || 0
    const minLevel = parseInt(minimumStockLevel) || 0
    
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock'
    if (qty === 0) status = 'Out of Stock'
    else if (qty <= minLevel) status = 'Low Stock'

    const now = new Date().toISOString()

    const newPart: PartInventoryItem = {
      part_id: generatePartId(),
      part_number: partNumber,
      part_name: partName,
      description,
      category,
      manufacturer,
      supplier,
      unit_cost: parseFloat(unitCost) || 0,
      quantity_on_hand: qty,
      minimum_stock_level: minLevel,
      reorder_quantity: parseInt(reorderQuantity) || minLevel * 2,
      unit_of_measure: unitOfMeasure,
      location,
      status,
      compatible_equipment: [],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes,
      created_at: now,
      updated_at: now
    }

    onAdd(newPart)
    toast.success('Part added successfully')
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setPartNumber('')
    setPartName('')
    setDescription('')
    setCategory('Mechanical')
    setManufacturer('')
    setSupplier('')
    setUnitCost('')
    setQuantityOnHand('')
    setMinimumStockLevel('')
    setReorderQuantity('')
    setUnitOfMeasure('Each')
    setLocation('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogDescription>
            Add a new part to the inventory system
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part-number">Part Number *</Label>
              <Input
                id="part-number"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="ACT-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PartCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="part-name">Part Name *</Label>
            <Input
              id="part-name"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Pneumatic Actuator Seal Kit"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the part"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Festo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Industrial Supply Co"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity on Hand</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantityOnHand}
                onChange={(e) => setQuantityOnHand(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-level">Min Stock Level</Label>
              <Input
                id="min-level"
                type="number"
                min="0"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder-qty">Reorder Qty</Label>
              <Input
                id="reorder-qty"
                type="number"
                min="0"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-cost">Unit Cost ($)</Label>
              <Input
                id="unit-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="45.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom">Unit of Measure</Label>
              <Input
                id="uom"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="Each, Kit, Pail"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Shelf A-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or special instructions"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
