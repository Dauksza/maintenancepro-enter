/**
 * Shared sample data generators for cross-functional modules.
 *
 * These generators are used both by individual module components (as default
 * initialisation values for their useKV stores) and by the top-level
 * handleLoadSampleData routine in App.tsx so that the CrossFunctionalHub can
 * display a complete integrated picture the moment sample data is loaded.
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  AsphaltProduct,
  BudgetEntry,
  CostCategory,
  MaintenanceCostEntry,
  ProductionBatch,
  ProductionBatchStatus,
  SalesOrder,
  SalesOrderStatus,
} from '@/lib/types'

const CURRENT_YEAR = new Date().getFullYear()

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export function generateSampleSalesOrders(): SalesOrder[] {
  const customers = [
    'City of Birmingham',
    'ALDOT District 3',
    'JB&A Paving',
    'Gulf States Paving',
    'Highway 31 Contractors',
    'Southern Asphalt Inc.',
  ]
  const products: AsphaltProduct[] = ['PG 64-22', 'PG 70-22', 'PG 76-22', 'AC-20', 'Emulsion']
  const statuses: SalesOrderStatus[] = [
    'Quote',
    'Confirmed',
    'In Production',
    'Ready',
    'Delivered',
    'Invoiced',
    'Paid',
    'Paid',
    'Paid',
  ]
  const orders: SalesOrder[] = []
  let orderNum = 1
  for (let month = 1; month <= 12; month++) {
    const count = 3 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const tons = 50 + Math.floor(Math.random() * 500)
      const unitPrice =
        product.startsWith('PG 76') || product.startsWith('PG 82')
          ? 750 + Math.random() * 100
          : product === 'Emulsion'
            ? 550 + Math.random() * 80
            : 620 + Math.random() * 80
      const price = Math.round(tons * unitPrice * 100) / 100
      const orderDate = `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 20)).padStart(2, '0')}`
      const delivDate = `${CURRENT_YEAR}-${String(Math.min(12, month + 1)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`
      const status: SalesOrderStatus =
        month < new Date().getMonth() + 1
          ? Math.random() > 0.15
            ? 'Paid'
            : 'Invoiced'
          : statuses[Math.floor(Math.random() * statuses.length)]
      orders.push({
        order_id: uuidv4(),
        order_number: `SO-${CURRENT_YEAR}-${String(orderNum++).padStart(4, '0')}`,
        customer_name: customers[Math.floor(Math.random() * customers.length)],
        customer_contact: null,
        order_date: orderDate,
        delivery_date: delivDate,
        product,
        quantity_tons: tons,
        unit_price_per_ton: Math.round(unitPrice * 100) / 100,
        total_price: price,
        status,
        invoice_number:
          status === 'Invoiced' || status === 'Paid'
            ? `INV-${CURRENT_YEAR}-${String(orderNum).padStart(5, '0')}`
            : null,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }
  return orders
}

// ─── Production Batches ───────────────────────────────────────────────────────

export function generateSampleProductionBatches(): ProductionBatch[] {
  const batches: ProductionBatch[] = []
  const products: AsphaltProduct[] = ['PG 64-22', 'PG 70-22', 'PG 76-22', 'AC-20', 'Emulsion']
  const operators = ['John Smith', 'Maria Garcia', 'Bob Johnson', 'Sarah Lee']
  let batchNum = 1
  for (let month = 1; month <= 12; month++) {
    const count = 4 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(Math.random() * 28)
      const product = products[Math.floor(Math.random() * products.length)]
      const target = 200 + Math.floor(Math.random() * 300)
      const efficiency = 0.85 + Math.random() * 0.2
      const actual = Math.round(target * efficiency)
      const status: ProductionBatchStatus =
        month < new Date().getMonth() + 1
          ? 'Complete'
          : month === new Date().getMonth() + 1
            ? Math.random() > 0.5
              ? 'Complete'
              : 'In Progress'
            : 'Planned'
      batches.push({
        batch_id: uuidv4(),
        batch_number: `BATCH-${CURRENT_YEAR}-${String(batchNum++).padStart(4, '0')}`,
        date: `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        product,
        target_tons: target,
        actual_tons:
          status === 'Complete'
            ? actual
            : status === 'In Progress'
              ? Math.round(actual * 0.5)
              : 0,
        start_time:
          status !== 'Planned'
            ? `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T06:00:00Z`
            : null,
        end_time:
          status === 'Complete'
            ? `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T14:00:00Z`
            : null,
        status,
        operator: operators[Math.floor(Math.random() * operators.length)],
        equipment_id: null,
        linked_order_id: null,
        downtime_minutes: status === 'Complete' ? Math.floor(Math.random() * 45) : 0,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }
  return batches
}

// ─── Maintenance Costs ────────────────────────────────────────────────────────

const COST_CATEGORIES: CostCategory[] = ['Labor', 'Parts', 'Contractor', 'Equipment Rental', 'Other']

export function generateSampleMaintenanceCosts(): MaintenanceCostEntry[] {
  const entries: MaintenanceCostEntry[] = []
  const descriptions: Record<CostCategory, string[]> = {
    Labor: ['Technician overtime', 'Emergency repair crew', 'Scheduled PM labor', 'Welding services'],
    Parts: ['Pump seal kit', 'Bearing replacement', 'Belt replacement', 'Filter elements', 'Valve rebuild kit'],
    Contractor: ['Electrical contractor', 'Hydraulics specialist', 'Crane rental service', 'Alignment service'],
    'Equipment Rental': ['Scissor lift rental', 'Forklift rental', 'Pressure washer rental'],
    Other: ['Safety supplies', 'Lubricants & oils', 'Miscellaneous hardware'],
  }
  for (let month = 1; month <= 12; month++) {
    COST_CATEGORIES.forEach(cat => {
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

// ─── Maintenance Budgets ──────────────────────────────────────────────────────

export function generateSampleMaintenanceBudgets(): BudgetEntry[] {
  const entries: BudgetEntry[] = []
  const budgetAmounts: Record<CostCategory, number> = {
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
        budgeted_amount: budgetAmounts[cat] * (0.9 + Math.random() * 0.2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  })
  return entries
}
