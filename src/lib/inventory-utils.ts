import type { PartInventoryItem, PartTransaction, InventoryAlert, PartUsageHistory } from './types'

export function generatePartId(): string {
  return `PART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function calculatePartStatus(
  quantityOnHand: number,
  minimumStockLevel: number
): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantityOnHand === 0) return 'Out of Stock'
  if (quantityOnHand <= minimumStockLevel) return 'Low Stock'
  return 'In Stock'
}

export function calculateTotalInventoryValue(parts: PartInventoryItem[]): number {
  return parts.reduce((total, part) => total + (part.quantity_on_hand * part.unit_cost), 0)
}

export function generateInventoryAlerts(parts: PartInventoryItem[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = []
  const now = new Date().toISOString()

  parts.forEach(part => {
    if (part.quantity_on_hand === 0 && part.status !== 'Discontinued') {
      alerts.push({
        alert_id: `ALERT-${part.part_id}-${Date.now()}`,
        part_id: part.part_id,
        alert_type: 'Out of Stock',
        severity: 'Critical',
        message: `${part.part_name} is out of stock`,
        recommended_action: `Order ${part.reorder_quantity} units immediately`,
        created_at: now,
        resolved: false,
        resolved_at: null
      })
    } else if (part.quantity_on_hand <= part.minimum_stock_level && part.status !== 'Discontinued') {
      alerts.push({
        alert_id: `ALERT-${part.part_id}-${Date.now()}`,
        part_id: part.part_id,
        alert_type: 'Low Stock',
        severity: part.quantity_on_hand <= part.minimum_stock_level * 0.5 ? 'High' : 'Medium',
        message: `${part.part_name} is below minimum stock level`,
        recommended_action: `Order ${part.reorder_quantity} units`,
        created_at: now,
        resolved: false,
        resolved_at: null
      })
    }
  })

  return alerts
}

export function calculatePartUsage(
  partId: string,
  transactions: PartTransaction[]
): PartUsageHistory {
  const partTransactions = transactions.filter(t => t.part_id === partId && t.transaction_type === 'Use')
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const totalUsed = partTransactions.reduce((sum, t) => sum + t.quantity, 0)
  const timesUsed = partTransactions.length
  const averagePerUse = timesUsed > 0 ? totalUsed / timesUsed : 0

  const last30Days = partTransactions
    .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.quantity, 0)

  const last90Days = partTransactions
    .filter(t => new Date(t.created_at) >= ninetyDaysAgo)
    .reduce((sum, t) => sum + t.quantity, 0)

  const linkedWorkOrders = Array.from(
    new Set(partTransactions.map(t => t.work_order_id).filter(Boolean))
  ) as string[]

  return {
    part_id: partId,
    part_name: '',
    total_used: totalUsed,
    times_used: timesUsed,
    average_per_use: averagePerUse,
    last_30_days: last30Days,
    last_90_days: last90Days,
    linked_work_orders: linkedWorkOrders
  }
}

export function recordPartTransaction(
  part: PartInventoryItem,
  transaction: Omit<PartTransaction, 'transaction_id' | 'created_at'>
): { part: PartInventoryItem; transaction: PartTransaction } {
  const newTransaction: PartTransaction = {
    ...transaction,
    transaction_id: generateTransactionId(),
    created_at: new Date().toISOString()
  }

  let newQuantity = part.quantity_on_hand

  switch (transaction.transaction_type) {
    case 'Purchase':
    case 'Return':
      newQuantity += transaction.quantity
      break
    case 'Use':
    case 'Transfer':
      newQuantity -= transaction.quantity
      break
    case 'Adjustment':
      newQuantity = transaction.quantity
      break
  }

  const updatedPart: PartInventoryItem = {
    ...part,
    quantity_on_hand: Math.max(0, newQuantity),
    status: calculatePartStatus(Math.max(0, newQuantity), part.minimum_stock_level),
    last_used_date: transaction.transaction_type === 'Use' ? newTransaction.created_at : part.last_used_date,
    last_ordered_date: transaction.transaction_type === 'Purchase' ? newTransaction.created_at : part.last_ordered_date,
    updated_at: newTransaction.created_at
  }

  return { part: updatedPart, transaction: newTransaction }
}

export function getPartsByCategory(parts: PartInventoryItem[], category: string): PartInventoryItem[] {
  return parts.filter(part => part.category === category)
}

export function searchParts(parts: PartInventoryItem[], query: string): PartInventoryItem[] {
  const lowerQuery = query.toLowerCase()
  return parts.filter(part =>
    part.part_name.toLowerCase().includes(lowerQuery) ||
    part.part_number.toLowerCase().includes(lowerQuery) ||
    part.description.toLowerCase().includes(lowerQuery) ||
    part.manufacturer.toLowerCase().includes(lowerQuery) ||
    part.compatible_equipment.some(eq => eq.toLowerCase().includes(lowerQuery))
  )
}

export function generateSampleParts(): PartInventoryItem[] {
  const now = new Date().toISOString()
  
  return [
    {
      part_id: generatePartId(),
      part_number: 'ACT-001',
      part_name: 'Pneumatic Actuator Seal Kit',
      description: 'Complete seal replacement kit for pneumatic actuators',
      category: 'Pneumatic',
      manufacturer: 'Festo',
      supplier: 'Industrial Supply Co',
      unit_cost: 45.99,
      quantity_on_hand: 12,
      minimum_stock_level: 5,
      reorder_quantity: 10,
      unit_of_measure: 'Kit',
      location: 'Shelf A-12',
      status: 'In Stock',
      compatible_equipment: ['Pneumatic Actuator', 'Control Valve Actuator'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: '',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'VLV-002',
      part_name: 'Solenoid Valve Coil',
      description: '24VDC solenoid valve replacement coil',
      category: 'Electrical',
      manufacturer: 'ASCO',
      supplier: 'Automation Parts Direct',
      unit_cost: 89.50,
      quantity_on_hand: 3,
      minimum_stock_level: 5,
      reorder_quantity: 10,
      unit_of_measure: 'Each',
      location: 'Bin B-05',
      status: 'Low Stock',
      compatible_equipment: ['Solenoid Valve', 'Control Valve'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: 'Critical spare - monitor stock level',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'BRG-003',
      part_name: 'Ball Bearing 6205-2RS',
      description: 'Deep groove ball bearing with rubber seals',
      category: 'Mechanical',
      manufacturer: 'SKF',
      supplier: 'Bearing Warehouse',
      unit_cost: 12.75,
      quantity_on_hand: 25,
      minimum_stock_level: 10,
      reorder_quantity: 20,
      unit_of_measure: 'Each',
      location: 'Drawer C-08',
      status: 'In Stock',
      compatible_equipment: ['Motor', 'Pump', 'Conveyor'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: '',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'HYD-004',
      part_name: 'Hydraulic Hose 1/2" x 6ft',
      description: 'High-pressure hydraulic hose assembly with fittings',
      category: 'Hydraulic',
      manufacturer: 'Parker',
      supplier: 'Hydraulic Supply Inc',
      unit_cost: 67.25,
      quantity_on_hand: 0,
      minimum_stock_level: 3,
      reorder_quantity: 5,
      unit_of_measure: 'Each',
      location: 'Rack D-02',
      status: 'Out of Stock',
      compatible_equipment: ['Hydraulic Press', 'Lift System'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: 'URGENT - Order immediately',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'FLT-005',
      part_name: 'Air Filter Element',
      description: 'Replacement filter element for compressed air system',
      category: 'Pneumatic',
      manufacturer: 'Donaldson',
      supplier: 'Filtration Systems',
      unit_cost: 34.50,
      quantity_on_hand: 18,
      minimum_stock_level: 8,
      reorder_quantity: 12,
      unit_of_measure: 'Each',
      location: 'Shelf E-03',
      status: 'In Stock',
      compatible_equipment: ['Air Compressor', 'Air Dryer'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: 'Replace quarterly per SOP-105',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'OIL-006',
      part_name: 'Hydraulic Oil ISO 68',
      description: 'Premium hydraulic oil 5 gallon pail',
      category: 'Consumable',
      manufacturer: 'Mobil',
      supplier: 'Lubrication Products',
      unit_cost: 125.00,
      quantity_on_hand: 8,
      minimum_stock_level: 4,
      reorder_quantity: 6,
      unit_of_measure: 'Pail',
      location: 'Storage Room A',
      status: 'In Stock',
      compatible_equipment: ['Hydraulic System', 'Press'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: 'Store in temperature-controlled area',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'SNS-007',
      part_name: 'Proximity Sensor M18',
      description: 'Inductive proximity sensor M18x1 10mm range',
      category: 'Electrical',
      manufacturer: 'Omron',
      supplier: 'Controls & Sensors',
      unit_cost: 78.99,
      quantity_on_hand: 6,
      minimum_stock_level: 3,
      reorder_quantity: 6,
      unit_of_measure: 'Each',
      location: 'Bin F-11',
      status: 'In Stock',
      compatible_equipment: ['Conveyor System', 'Assembly Line'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: '',
      created_at: now,
      updated_at: now
    },
    {
      part_id: generatePartId(),
      part_number: 'BLT-008',
      part_name: 'V-Belt B52',
      description: 'Industrial V-belt 52 inch length',
      category: 'Mechanical',
      manufacturer: 'Gates',
      supplier: 'Power Transmission Supply',
      unit_cost: 22.50,
      quantity_on_hand: 15,
      minimum_stock_level: 6,
      reorder_quantity: 12,
      unit_of_measure: 'Each',
      location: 'Shelf G-04',
      status: 'In Stock',
      compatible_equipment: ['Motor Drive', 'Fan System'],
      linked_sop_ids: [],
      linked_asset_ids: [],
      last_ordered_date: null,
      last_used_date: null,
      notes: 'Common replacement part',
      created_at: now,
      updated_at: now
    }
  ]
}
