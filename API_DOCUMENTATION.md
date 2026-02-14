# MaintenancePro Developer API Documentation

## Overview

This document describes the internal APIs, utilities, and patterns used in MaintenancePro for developers who want to extend or modify the system.

## Table of Contents

1. [Data Persistence API](#data-persistence-api)
2. [Type System](#type-system)
3. [Utility Libraries](#utility-libraries)
4. [Component Patterns](#component-patterns)
5. [Auto-Scheduler API](#auto-scheduler-api)
6. [Notification System](#notification-system)
7. [Excel Import/Export](#excel-importexport)
8. [Best Practices](#best-practices)

---

## Data Persistence API

MaintenancePro uses the Spark KV (Key-Value) persistence API for all data storage.

### Using useKV Hook (Recommended)

```typescript
import { useKV } from '@github/spark/hooks'

function MyComponent() {
  const [workOrders, setWorkOrders] = useKV<WorkOrder[]>('maintenance-work-orders', [])
  
  // ❌ WRONG - Closure captures stale state
  const addWorkOrder = (wo: WorkOrder) => {
    setWorkOrders([...workOrders, wo]) // BUG: workOrders is stale!
  }
  
  // ✅ CORRECT - Functional update always gets current value
  const addWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((current) => [...(current || []), wo])
  }
  
  // ✅ CORRECT - Updating item in array
  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((current) =>
      (current || []).map(wo => wo.work_order_id === id ? { ...wo, ...updates } : wo)
    )
  }
  
  // ✅ CORRECT - Removing item
  const deleteWorkOrder = (id: string) => {
    setWorkOrders((current) => (current || []).filter(wo => wo.work_order_id !== id))
  }
}
```

### Direct KV API

For non-React contexts:

```typescript
// Set value
await spark.kv.set('my-key', { data: 'value' })

// Get value
const value = await spark.kv.get<MyType>('my-key')

// Get all keys
const keys = await spark.kv.keys()

// Delete value
await spark.kv.delete('my-key')
```

### KV Keys Used

| Key | Type | Description |
|-----|------|-------------|
| `maintenance-work-orders` | `WorkOrder[]` | All work orders |
| `sop-library` | `SOP[]` | Standard operating procedures |
| `spares-labor` | `SparesLabor[]` | Spare parts and labor data |
| `employees` | `Employee[]` | Employee directory |
| `skill-matrix` | `SkillMatrixEntry[]` | Employee skills |
| `employee-schedules` | `EmployeeSchedule[]` | Shift schedules |
| `employee-messages` | `Message[]` | Internal messages |
| `certification-reminders` | `CertificationReminder[]` | Cert reminders |
| `work-order-notifications` | `WorkOrderNotification[]` | WO notifications |
| `notification-preferences` | `NotificationPreferences` | User notification settings |
| `assets` | `Asset[]` | Asset inventory |
| `areas` | `Area[]` | Facility areas |
| `skills` | `Skill[]` | Skills catalog |
| `technician-capacity` | `TechnicianCapacity[]` | Capacity limits |

---

## Type System

All types are defined in `src/lib/types.ts`.

### Core Types

```typescript
// Work Order
interface WorkOrder {
  work_order_id: string
  equipment_area: string
  priority_level: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Scheduled (Not Started)' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue'
  type: 'Maintenance' | 'Inspection' | 'Calibration' | 'Repair'
  task: string
  comments_description: string
  scheduled_date: string  // ISO 8601
  estimated_downtime_hours: number
  assigned_technician: string | null
  entered_by: string | null
  terminal: string
  created_at: string
  updated_at: string
  completed_at: string | null
  is_overdue: boolean
  auto_generated: boolean
  linked_sop_ids?: string[]
  area_id?: string | null
  required_skill_ids?: string[]
  required_asset_ids?: string[]
}

// Employee
interface Employee {
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

// Skill Matrix Entry
interface SkillMatrixEntry {
  employee_id: string
  skill_category: string
  skill_name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  certified: boolean
  certification_date: string | null
  expiry_date: string | null
  notes: string
}

// Asset
interface Asset {
  asset_id: string
  asset_name: string
  asset_type: string
  category: 'Equipment' | 'Vehicle' | 'Tool' | 'Instrument' | 'Facility'
  status: 'Operational' | 'Under Maintenance' | 'Out of Service' | 'Decommissioned'
  area_id: string | null
  assigned_employee_ids: string[]
  required_skill_ids: string[]
  maintenance_task_ids: string[]
  linked_sop_ids: string[]
  manufacturer: string
  model: string
  serial_number: string
  purchase_date: string | null
  warranty_expiry: string | null
  notes: string
  created_at: string
  updated_at: string
}
```

### Type Guards

```typescript
// Check if work order is overdue
export function isOverdue(wo: WorkOrder): boolean {
  if (wo.status === 'Completed' || wo.status === 'Cancelled') {
    return false
  }
  const scheduledDate = new Date(wo.scheduled_date)
  const now = new Date()
  return scheduledDate < now
}

// Safe type narrowing
function isEmployee(obj: unknown): obj is Employee {
  return typeof obj === 'object' && obj !== null && 'employee_id' in obj
}
```

---

## Utility Libraries

### maintenance-utils.ts

```typescript
import { isOverdue, isPastDue, getDaysUntilDue } from '@/lib/maintenance-utils'

// Check if work order is overdue
const overdue = isOverdue(workOrder)

// Get days until due (negative if overdue)
const days = getDaysUntilDue(workOrder.scheduled_date)

// Format date for display
const formatted = formatScheduledDate(workOrder.scheduled_date)
```

### excel-parser.ts

```typescript
import { parseExcelFile, generateSampleWorkOrders, exportToExcel } from '@/lib/excel-parser'

// Parse uploaded Excel file
const result = await parseExcelFile(file)
if (result.success) {
  const { workOrders, sops, sparesLabor } = result.data
  // Use the data
} else {
  console.error('Validation errors:', result.errors)
}

// Export data to Excel
exportToExcel({
  workOrders: allWorkOrders,
  sops: allSOPs,
  sparesLabor: allSpares
})

// Generate sample data
const sampleWOs = generateSampleWorkOrders()
const sampleSOPs = generateSampleSOPs()
const sampleSpares = generateSampleSparesLabor()
```

### skill-matcher.ts

```typescript
import { 
  matchEmployeeToWorkOrder, 
  getAvailableEmployeesForWorkOrder,
  calculateSkillMatchScore 
} from '@/lib/skill-matcher'

// Match single employee to work order
const match = matchEmployeeToWorkOrder(
  employee,
  workOrder,
  skillMatrix,
  allWorkOrders
)
// Returns: { employee, score, reasons, conflicts }

// Get all available employees sorted by match score
const matches = getAvailableEmployeesForWorkOrder(
  workOrder,
  allEmployees,
  skillMatrix,
  allWorkOrders
)

// Calculate skill match score (0-100)
const score = calculateSkillMatchScore(
  requiredSkills,
  employeeSkills
)
```

### certification-utils.ts

```typescript
import { 
  generateRemindersFromSkillMatrix,
  getReminderCounts,
  shouldSendReminder,
  getReminderPriority
} from '@/lib/certification-utils'

// Generate reminders from skill matrix
const reminders = generateRemindersFromSkillMatrix(
  skillMatrix,
  employees,
  existingReminders
)

// Get counts by priority
const counts = getReminderCounts(reminders)
// Returns: { critical: 5, high: 10, medium: 15, low: 20, total: 50 }

// Check if reminder should be sent
const shouldSend = shouldSendReminder(reminder, notificationSettings)

// Get priority level for reminder
const priority = getReminderPriority(daysUntilExpiry)
```

### notification-utils.ts

```typescript
import { 
  generateSkillMatchNotifications,
  generateAutoSchedulerNotifications,
  markNotificationAsRead,
  markNotificationAsAccepted
} from '@/lib/notification-utils'

// Generate notifications for skill-matched employees
const notifications = generateSkillMatchNotifications(
  workOrder,
  employees,
  skillMatrix,
  allWorkOrders
)

// Generate notifications for auto-scheduled work
const notifications = generateAutoSchedulerNotifications(
  scheduledOrders,
  employees
)

// Update notification status
const updated = markNotificationAsRead(notification)
const accepted = markNotificationAsAccepted(notification)
```

---

## Component Patterns

### Standard Component Structure

```typescript
import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { MyType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface MyComponentProps {
  data: MyType[]
  onUpdate: (id: string, updates: Partial<MyType>) => void
}

export function MyComponent({ data, onUpdate }: MyComponentProps) {
  const [localState, setLocalState] = useState<string>('')
  const [persistedState, setPersistedState] = useKV<MyType[]>('my-key', [])
  
  const handleAction = () => {
    // Always use functional updates with useKV
    setPersistedState((current) => {
      // Transform current state
      return newState
    })
    
    toast.success('Action completed')
  }
  
  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  )
}
```

### Wizard Pattern

```typescript
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface WizardProps {
  open: boolean
  onClose: () => void
  onComplete: (data: MyType) => void
}

export function MyWizard({ open, onClose, onComplete }: WizardProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<MyType>>({})
  
  const handleNext = () => {
    // Validate current step
    setStep(step + 1)
  }
  
  const handleBack = () => {
    setStep(step - 1)
  }
  
  const handleComplete = () => {
    onComplete(formData as MyType)
    onClose()
    setStep(1)
    setFormData({})
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Step {step} of 4
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 && <Step1 data={formData} onChange={setFormData} />}
        {step === 2 && <Step2 data={formData} onChange={setFormData} />}
        {step === 3 && <Step3 data={formData} onChange={setFormData} />}
        {step === 4 && <ReviewStep data={formData} />}
        
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleComplete}>Complete</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Auto-Scheduler API

### Basic Usage

```typescript
import { scheduleWorkOrders } from '@/lib/auto-scheduler'

const result = await scheduleWorkOrders({
  workOrders: unscheduledWorkOrders,
  employees: activeEmployees,
  skillMatrix: skillMatrix,
  areas: areas,
  assets: assets,
  capacityLimits: technicianCapacity,
  options: {
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    prioritization: 'priority', // 'priority' | 'date' | 'skill_match'
    allowPartialSkillMatch: true,
    skipWeekends: true,
    balanceWorkload: true
  }
})

if (result.success) {
  const { scheduled, failed, metrics } = result
  // Apply scheduled work orders
  // Handle failed assignments
} else {
  console.error('Scheduling failed:', result.errors)
}
```

### Scheduling Result

```typescript
interface SchedulingResult {
  success: boolean
  scheduled: Array<{
    workOrder: WorkOrder
    employee: Employee
    score: number
    reasons: string[]
  }>
  failed: Array<{
    workOrder: WorkOrder
    conflicts: SchedulingConflict[]
    reason: string
  }>
  metrics: {
    totalWorkOrders: number
    successfullyScheduled: number
    failedToSchedule: number
    averageScore: number
    employeesUsed: number
    warnings: string[]
  }
  errors?: string[]
}
```

### Conflict Types

```typescript
interface SchedulingConflict {
  conflict_type: 
    | 'skill_mismatch'       // Employee lacks required skills
    | 'employee_unavailable' // Employee is inactive or on leave
    | 'asset_unavailable'    // Required asset is out of service
    | 'capacity_exceeded'    // Employee over daily hour limit
    | 'dependency_violation' // Task dependency not satisfied
  severity: 'warning' | 'error'
  description: string
  work_order_id: string
  employee_id?: string
  asset_id?: string
  suggested_resolution?: string
}
```

---

## Notification System

See [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) for complete documentation.

### Quick Reference

```typescript
import { 
  generateSkillMatchNotifications,
  markNotificationAsRead,
  markNotificationAsAccepted,
  markNotificationAsRejected
} from '@/lib/notification-utils'

// Generate notifications when creating work order
const notifications = generateSkillMatchNotifications(
  workOrder,
  employees,
  skillMatrix,
  allWorkOrders
)

// Filter by minimum match score
const highQualityMatches = notifications.filter(
  n => n.match_score && n.match_score >= 70
)

// Update notification status
const read = markNotificationAsRead(notification)
const accepted = markNotificationAsAccepted(notification)
const rejected = markNotificationAsRejected(notification)
```

---

## Excel Import/Export

### Import Schema Validation

The system validates three sheets:

1. **Maintenance Tracking**
2. **SOP Library**
3. **Spares & Labor**

```typescript
import { validateExcelStructure, parseWorkOrderSheet } from '@/lib/excel-parser'

// Validate structure
const validation = validateExcelStructure(workbook)
if (!validation.valid) {
  console.error('Errors:', validation.errors)
  return
}

// Parse individual sheets
const workOrders = parseWorkOrderSheet(worksheet)
const sops = parseSOPSheet(worksheet)
const sparesLabor = parseSparesLaborSheet(worksheet)
```

### Custom Export

```typescript
import { WorkBook, utils, writeFile } from 'xlsx'

function exportCustomData(data: MyType[]) {
  const wb: WorkBook = utils.book_new()
  const ws = utils.json_to_sheet(data)
  utils.book_append_sheet(wb, ws, 'My Data')
  writeFile(wb, 'export.xlsx')
}
```

---

## Best Practices

### 1. State Management

✅ **DO**: Use functional updates with useKV
```typescript
setWorkOrders((current) => [...(current || []), newWorkOrder])
```

❌ **DON'T**: Reference stale closure values
```typescript
setWorkOrders([...workOrders, newWorkOrder]) // BUG!
```

### 2. Type Safety

✅ **DO**: Use proper TypeScript types
```typescript
const [data, setData] = useKV<WorkOrder[]>('key', [])
```

❌ **DON'T**: Use `any` or skip types
```typescript
const [data, setData] = useKV('key', []) // No type checking
```

### 3. Error Handling

✅ **DO**: Provide user feedback
```typescript
try {
  await doSomething()
  toast.success('Operation completed')
} catch (error) {
  toast.error('Operation failed')
  console.error(error)
}
```

### 4. Component Size

✅ **DO**: Break large components into smaller pieces
```typescript
<EmployeeDetail employee={employee}>
  <ContactInfo data={employee} />
  <SkillMatrix employeeId={employee.id} />
  <Schedule employeeId={employee.id} />
</EmployeeDetail>
```

### 5. Performance

✅ **DO**: Use React.memo for expensive renders
```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
})
```

✅ **DO**: Use useMemo for expensive calculations
```typescript
const sortedData = useMemo(
  () => data.sort((a, b) => a.value - b.value),
  [data]
)
```

### 6. Accessibility

✅ **DO**: Use semantic HTML and ARIA labels
```typescript
<button aria-label="Close dialog" onClick={onClose}>
  <X size={20} />
</button>
```

### 7. Testing

```typescript
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent data={mockData} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles user interaction', () => {
    const mockHandler = jest.fn()
    render(<MyComponent onAction={mockHandler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

---

## Extension Points

### Adding a New Entity Type

1. Define type in `src/lib/types.ts`
2. Create KV key constant
3. Add CRUD utilities
4. Create components (list, detail, form)
5. Add to navigation
6. Update import/export if needed

### Adding a New Scheduling Strategy

1. Implement scorer function in `auto-scheduler.ts`
2. Add to `prioritization` options type
3. Update UI to allow selection
4. Document in user guide

### Adding a New Notification Type

1. Add type to `WorkOrderNotificationType` enum
2. Create generator function in `notification-utils.ts`
3. Add handler in notification components
4. Add preference toggle if needed

---

## API Reference Summary

### Hooks
- `useKV<T>(key: string, defaultValue: T)` - Persistent state
- `useIsMobile()` - Responsive breakpoint detection

### Utilities
- `isOverdue(wo)` - Check overdue status
- `matchEmployeeToWorkOrder(...)` - Skill matching
- `scheduleWorkOrders(...)` - Auto-scheduling
- `generateRemindersFromSkillMatrix(...)` - Cert reminders
- `parseExcelFile(file)` - Excel import
- `exportToExcel(data)` - Excel export

### Components
- All shadcn/ui components in `@/components/ui`
- Custom components in `@/components`
- Wizards in `@/components/wizards`

---

**Version**: 1.0  
**Last Updated**: 2024
