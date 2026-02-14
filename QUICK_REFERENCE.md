# Quick Reference: MaintenancePro CMMS

## For Developers

### Core Components Location Map

```
src/
├── App.tsx                           # Main application entry
├── components/
│   ├── EmployeeManagement.tsx        # Employee module container
│   ├── EditEmployeeDialog.tsx        # ✨ Employee editing
│   ├── EmployeeDetailDialog.tsx      # Employee details view
│   ├── EmployeeDirectory.tsx         # Employee grid/cards
│   ├── SkillMatrix.tsx              # Skills management
│   ├── EnhancedAutoSchedulerDialog.tsx # ✨ Auto-scheduler UI
│   ├── WorkOrderGrid.tsx            # Work order table
│   ├── NewWorkOrderDialog.tsx       # Create work orders
│   ├── PartsInventory.tsx           # ✨ Parts management
│   ├── AssetsAreasManagement.tsx    # Assets & areas
│   ├── wizards/
│   │   ├── AddEmployeeWizard.tsx    # ✨ Add employee flow
│   │   ├── AddAssetWizard.tsx       # Add asset flow
│   │   ├── AddSkillWizard.tsx       # Add skill flow
│   │   └── AddAreaWizard.tsx        # Add area flow
│   └── ui/                          # Shadcn components
├── lib/
│   ├── types.ts                     # TypeScript definitions
│   ├── enhanced-auto-scheduler.ts   # ✨ Scheduling algorithm
│   ├── skill-matcher.ts             # Skill matching logic
│   ├── employee-utils.ts            # Employee helpers
│   └── inventory-utils.ts           # Parts helpers
└── index.css                        # Theme & styles

✨ = Enhanced in this iteration
```

### Key Functions

#### Auto-Scheduler
```typescript
// Location: /src/lib/enhanced-auto-scheduler.ts
enhancedAutoSchedule(
  workOrders: WorkOrder[],
  employees: Employee[],
  skills: Skill[],
  skillMatrix: SkillMatrixEntry[],
  assets: Asset[],
  areas: Area[],
  schedules: EmployeeSchedule[],
  capacities: TechnicianCapacity[],
  options: EnhancedSchedulingOptions
): EnhancedSchedulingResult

// Returns:
// - scheduled: WorkOrder[] (with assignments)
// - failed: Array<{workOrder, reason, conflicts}>
// - previews: SchedulingPreview[]
// - stats: {totalProcessed, successfullyScheduled, avgScore, ...}
```

#### Employee Management
```typescript
// Add Employee
onAddEmployee(employee: Employee): void

// Update Employee
onUpdateEmployee(id: string, updates: Partial<Employee>): void

// Edit via Dialog
<EditEmployeeDialog
  employee={employee}
  open={open}
  onClose={handleClose}
  onSave={handleSave}
  existingDepartments={departments}
  existingPositions={positions}
/>

// Add via Wizard
<AddEmployeeWizard
  open={open}
  onClose={handleClose}
  onComplete={handleComplete}
  existingDepartments={departments}
  existingPositions={positions}
/>
```

#### Parts Inventory
```typescript
// Add Part
onAddPart(part: PartInventoryItem): void

// Update Part
onUpdatePart(partId: string, updates: Partial<PartInventoryItem>): void

// Add Transaction
onAddTransaction(transaction: PartTransaction): void
// Automatically updates inventory quantity and status
```

### Data Persistence Patterns

#### Always Use Functional Updates
```typescript
// ❌ WRONG - Stale closure bug
setEmployees([...employees, newEmployee])

// ✅ CORRECT - Fresh state
setEmployees((current) => [...(current || []), newEmployee])
```

#### Safe Defaults
```typescript
const safeEmployees = employees || []
const safeSkillMatrix = skillMatrix || []
```

#### Optional Chaining
```typescript
const name = employee?.first_name ?? 'Unknown'
const skills = employee?.certifications?.length ?? 0
```

### Common Tasks

#### 1. Adding a New Employee
```typescript
import { AddEmployeeWizard } from '@/components/wizards/AddEmployeeWizard'

const [wizardOpen, setWizardOpen] = useState(false)

<Button onClick={() => setWizardOpen(true)}>
  Add Employee
</Button>

<AddEmployeeWizard
  open={wizardOpen}
  onClose={() => setWizardOpen(false)}
  onComplete={(employee) => {
    setEmployees((current) => [...(current || []), employee])
    toast.success('Employee added')
  }}
  existingDepartments={['Maintenance', 'Operations']}
  existingPositions={['Technician', 'Supervisor']}
/>
```

#### 2. Running Auto-Scheduler
```typescript
import { EnhancedAutoSchedulerDialog } from '@/components/EnhancedAutoSchedulerDialog'

const [schedulerOpen, setSchedulerOpen] = useState(false)

<Button onClick={() => setSchedulerOpen(true)}>
  Auto-Schedule
</Button>

<EnhancedAutoSchedulerDialog
  open={schedulerOpen}
  onClose={() => setSchedulerOpen(false)}
  workOrders={workOrders}
  onScheduleComplete={(scheduledOrders) => {
    setWorkOrders((current) =>
      (current || []).map(wo => {
        const scheduled = scheduledOrders.find(s => s.work_order_id === wo.work_order_id)
        return scheduled || wo
      })
    )
  }}
/>
```

#### 3. Editing an Employee
```typescript
import { EditEmployeeDialog } from '@/components/EditEmployeeDialog'

const [editOpen, setEditOpen] = useState(false)
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

<Button onClick={() => {
  setSelectedEmployee(employee)
  setEditOpen(true)
}}>
  Edit
</Button>

<EditEmployeeDialog
  employee={selectedEmployee}
  open={editOpen}
  onClose={() => setEditOpen(false)}
  onSave={(id, updates) => {
    setEmployees((current) =>
      (current || []).map(emp =>
        emp.employee_id === id ? { ...emp, ...updates } : emp
      )
    )
  }}
  existingDepartments={departments}
  existingPositions={positions}
/>
```

#### 4. Adding a Part Transaction
```typescript
import { PartTransactionDialog } from '@/components/PartTransactionDialog'

<PartTransactionDialog
  open={transactionOpen}
  onClose={() => setTransactionOpen(false)}
  part={selectedPart}
  onAddTransaction={(transaction) => {
    // Add transaction
    setPartTransactions((current) => [...(current || []), transaction])
    
    // Update part quantity and status
    setParts((current) =>
      (current || []).map(p => {
        if (p.part_id === transaction.part_id) {
          let newQuantity = p.quantity_on_hand
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
          const status = newQuantity === 0 ? 'Out of Stock' :
                        newQuantity <= p.minimum_stock_level ? 'Low Stock' : 'In Stock'
          return { ...p, quantity_on_hand: Math.max(0, newQuantity), status }
        }
        return p
      })
    )
  }}
/>
```

### Type Definitions Quick Reference

```typescript
// Core Types
Employee {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  status: 'Active' | 'On Leave' | 'Inactive'
  shift: 'Day Shift' | 'Night Shift' | 'Rotating' | 'On Call'
  hire_date: string
  emergency_contact_name: string
  emergency_contact_phone: string
  certifications: string[]
  created_at: string
  updated_at: string
}

WorkOrder {
  work_order_id: string
  equipment_area: string
  priority_level: 'Low' | 'Medium' | 'High' | 'Critical'
  status: WorkOrderStatus
  type: 'Maintenance' | 'Inspection' | 'Calibration' | 'Repair'
  task: string
  scheduled_date: string
  estimated_downtime_hours: number
  assigned_technician: string | null
  area_id?: string | null
  required_skill_ids?: string[]
  required_asset_ids?: string[]
  // ... more fields
}

SkillMatrixEntry {
  skill_matrix_id: string
  employee_id: string
  skill_name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  acquired_date: string
  expiry_date: string | null
  is_certified: boolean
  notes: string
}

PartInventoryItem {
  part_id: string
  part_name: string
  part_number: string
  description: string
  category: string
  quantity_on_hand: number
  minimum_stock_level: number
  unit_cost: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  storage_location: string
  manufacturer: string
  model_number: string
  supplier: string
  // ... more fields
}
```

### Event Flow Diagrams

#### Auto-Scheduler Flow
```
User clicks "Auto-Schedule" button
    ↓
EnhancedAutoSchedulerDialog opens
    ↓
Loads all required data from KV stores:
  - employees, skills, skillMatrix, assets, areas, schedules, capacities
    ↓
User configures options (dates, priorities, thresholds)
    ↓
User clicks "Generate Preview"
    ↓
enhancedAutoSchedule() executes:
  1. Filter unassigned/overdue work orders
  2. Filter active employees
  3. For each work order:
     a. Extract required skills
     b. Find eligible employees
     c. Evaluate all employee×date combinations
     d. Calculate multi-factor scores
     e. Select best match
     f. Update capacity map
    ↓
Preview shows: success count, failures, avg score, conflicts
    ↓
User reviews and clicks "Schedule Now"
    ↓
Work orders updated with assignments
    ↓
Notifications generated for assigned employees
    ↓
onScheduleComplete callback fires
    ↓
App updates work orders in KV store
    ↓
Success toast displayed
    ↓
Dialog closes, UI refreshes
```

#### Employee Edit Flow
```
User clicks employee card in directory
    ↓
EmployeeDetailDialog opens
    ↓
Displays: contact info, skills, schedule, certifications
    ↓
User clicks "Edit" button
    ↓
EditEmployeeDialog opens
    ↓
Form populated with current values
    ↓
User modifies fields
    ↓
User clicks "Save Changes"
    ↓
Validation runs:
  - Required fields check
  - Email format
  - Phone format
    ↓
If valid:
  - onSave callback fires with updates
  - App updates employee in KV store
  - Related data propagates (work orders, schedules, etc.)
  - Success toast
  - Dialog closes
  - Detail view refreshes
```

### Debugging Tips

#### 1. Check KV Store Data
```typescript
// In browser console:
const keys = await spark.kv.keys()
const employees = await spark.kv.get('employees')
const workOrders = await spark.kv.get('maintenance-work-orders')
console.log({ keys, employees, workOrders })
```

#### 2. Verify Auto-Scheduler Inputs
```typescript
// Add console.log in EnhancedAutoSchedulerDialog
console.log('Scheduler inputs:', {
  targetOrders: targetOrders.length,
  activeEmployees: activeEmployees.length,
  skills: safeSkills.length,
  skillMatrix: safeSkillMatrix.length,
  areas: safeAreas.length,
  assets: safeAssets.length
})
```

#### 3. Test Scoring Algorithm
```typescript
// In enhanced-auto-scheduler.ts, log scores:
const score = calculateSchedulingScore(...)
console.log(`Score for ${employee.first_name}:`, score)
```

#### 4. Check Notification Generation
```typescript
// After work order creation:
console.log('Notifications generated:', notifications.length)
notifications.forEach(n => console.log(n))
```

### Performance Tips

1. **Use useMemo for expensive calculations**
   ```typescript
   const filteredEmployees = useMemo(() =>
     employees.filter(e => e.status === 'Active'),
     [employees]
   )
   ```

2. **Debounce search inputs**
   ```typescript
   // Already implemented in search components
   ```

3. **Batch state updates**
   ```typescript
   // React automatically batches setState calls in event handlers
   ```

4. **Virtual scrolling for large lists**
   ```typescript
   // Already implemented in WorkOrderGrid
   ```

### Common Pitfalls

❌ **Don't reference state directly in updates**
```typescript
setEmployees([...employees, newEmp]) // Stale!
```

✅ **Use functional updates**
```typescript
setEmployees(current => [...(current || []), newEmp])
```

❌ **Don't forget null checks**
```typescript
employees.length // Could crash if null
```

✅ **Use safe defaults**
```typescript
(employees || []).length
```

❌ **Don't mutate state directly**
```typescript
employees[0].name = 'New Name' // Bad!
setEmployees(employees) // Won't trigger re-render
```

✅ **Create new objects**
```typescript
setEmployees(current =>
  (current || []).map(emp =>
    emp.id === targetId ? { ...emp, name: 'New Name' } : emp
  )
)
```

### Testing Checklist

Before deployment, verify:
- [ ] Sample data loads successfully
- [ ] Employee wizard creates employees
- [ ] Employee edit saves changes
- [ ] Work orders can be created
- [ ] Auto-scheduler assigns work orders
- [ ] Notifications appear
- [ ] Parts transactions update inventory
- [ ] Skills can be added to employees
- [ ] Certifications track expiry
- [ ] All tabs load without errors
- [ ] Data persists after page reload

### Support Resources

- **System Integration Guide**: `SYSTEM_INTEGRATION.md`
- **Enhancements Summary**: `ENHANCEMENTS_SUMMARY.md`
- **Verification Checklist**: `SYSTEM_VERIFICATION.md`
- **User Guide**: `USER_GUIDE.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Notification System**: `NOTIFICATION_SYSTEM.md`

---

**Need help?** Check the documentation files or review the component source code for inline comments and examples.
