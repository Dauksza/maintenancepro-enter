# MaintenancePro Database Schema & Persistence

## Overview

MaintenancePro uses the Spark KV (Key-Value) persistence API to store all application data. All data is automatically persisted and survives page refreshes and browser sessions.

## Persistence Technology

- **Primary Storage**: Spark KV API (`useKV` React hook)
- **Storage Type**: Browser-based persistent key-value store
- **Data Format**: JSON serialization
- **Automatic**: All updates are automatically persisted

## Database Tables (KV Keys)

### Core Work Order Management

#### `maintenance-work-orders` → `WorkOrder[]`
Primary work order tracking table containing all maintenance tasks.

**Fields:**
- `work_order_id` (string, primary key) - Unique identifier
- `equipment_area` (string, indexed) - Equipment or area name
- `priority_level` (enum) - Low | Medium | High | Critical
- `status` (enum) - Scheduled | In Progress | Completed | Cancelled | Overdue
- `type` (enum) - Maintenance | Inspection | Calibration | Repair
- `task` (text) - Task description
- `comments_description` (text) - Additional details and notes
- `scheduled_date` (ISO string, indexed) - When task is scheduled
- `estimated_downtime_hours` (number) - Estimated duration
- `assigned_technician` (string, nullable) - Assigned employee name
- `entered_by` (string, nullable) - Who created the work order
- `terminal` (string) - Location/terminal
- `created_at` (ISO string) - Creation timestamp
- `updated_at` (ISO string) - Last update timestamp
- `completed_at` (ISO string, nullable) - Completion timestamp
- `is_overdue` (boolean) - Computed overdue status
- `auto_generated` (boolean) - Whether auto-generated from SOP

**Relationships:**
- Links to `employees` via `assigned_technician`
- Links to `sop-library` via SOP references
- Links to `spares-labor` via `equipment_area`

---

#### `sop-library` → `SOP[]`
Standard Operating Procedures library.

**Fields:**
- `sop_id` (string, primary key)
- `title` (string)
- `revision` (number)
- `effective_date` (ISO string)
- `purpose` (text)
- `scope` (text)
- `loto_ppe_hazards` (text) - LOTO, PPE, and hazard information
- `pm_frequencies_included` (string[]) - Frequency keywords (Daily, Weekly, etc.)
- `procedure_summary` (text)
- `records_required` (text)
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Can generate `maintenance-work-orders`
- Links to `employees` for SOP acknowledgment

---

#### `spares-labor` → `SparesLabor[]`
Spare parts and labor estimates by equipment class.

**Fields:**
- `class` (string, indexed) - Equipment class
- `common_spares` (string[]) - List of common spare parts
- `labor_typical` (object) - Frequency-to-hours mapping
  ```typescript
  {
    "Daily": 0.25,
    "Monthly": 1,
    "Yearly": 4
  }
  ```

**Relationships:**
- Links to `maintenance-work-orders` via equipment class
- Links to `parts-inventory` via spare parts

---

### Employee & Workforce Management

#### `employees` → `Employee[]`
Employee directory and basic information.

**Fields:**
- `employee_id` (string, primary key)
- `first_name` (string)
- `last_name` (string)
- `email` (string)
- `phone` (string)
- `role` (string)
- `department` (string)
- `hire_date` (ISO string)
- `status` (enum) - Active | Inactive | On Leave
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `skill-matrix` for skills
- Links to `employee-schedules` for availability
- Links to `certification-reminders` for certifications
- Links to `maintenance-work-orders` as assigned technician

---

#### `skill-matrix` → `SkillMatrixEntry[]`
Employee skills, certifications, and proficiency levels.

**Fields:**
- `skill_id` (string, primary key)
- `employee_id` (string, foreign key)
- `skill_name` (string)
- `skill_category` (string)
- `proficiency_level` (enum) - Beginner | Intermediate | Advanced | Expert
- `certification_required` (boolean)
- `certification_date` (ISO string, nullable)
- `certification_expiry` (ISO string, nullable)
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `employees` via `employee_id`
- Used by auto-scheduler for skill matching
- Links to `skills` for skill definitions

---

#### `employee-schedules` → `EmployeeSchedule[]`
Employee availability and shift schedules.

**Fields:**
- `schedule_id` (string, primary key)
- `employee_id` (string, foreign key)
- `start_date` (ISO string)
- `end_date` (ISO string)
- `schedule_type` (enum) - Regular | Overtime | On Call | Time Off
- `hours_per_day` (number)
- `notes` (text)
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `employees` via `employee_id`
- Used by auto-scheduler for availability
- Used by capacity planning

---

#### `employee-messages` → `Message[]`
Internal messaging between employees and managers.

**Fields:**
- `message_id` (string, primary key)
- `from_employee_id` (string, foreign key)
- `to_employee_id` (string, foreign key)
- `subject` (string)
- `body` (text)
- `read` (boolean)
- `created_at` (ISO string)

**Relationships:**
- Links to `employees` for sender/receiver

---

### Assets & Areas

#### `assets` → `Asset[]`
Physical assets and equipment.

**Fields:**
- `asset_id` (string, primary key)
- `asset_name` (string)
- `asset_type` (string)
- `manufacturer` (string)
- `model` (string)
- `serial_number` (string)
- `area_id` (string, foreign key, nullable)
- `required_skills` (string[])
- `assigned_employees` (string[])
- `status` (enum) - Operational | Down | Maintenance | Retired
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `areas` via `area_id`
- Links to `employees` via `assigned_employees`
- Links to `skills` via `required_skills`
- Links to `maintenance-work-orders` for maintenance tasks

---

#### `areas` → `Area[]`
Work areas, zones, and departments.

**Fields:**
- `area_id` (string, primary key)
- `area_name` (string)
- `department` (string)
- `zone` (string)
- `description` (text)
- `supervisor_employee_id` (string, foreign key, nullable)
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `employees` via `supervisor_employee_id`
- Links to `assets` for assets in area
- Links to `maintenance-work-orders` via `equipment_area`

---

#### `skills` → `Skill[]`
Skill definitions and requirements.

**Fields:**
- `skill_id` (string, primary key)
- `skill_name` (string)
- `skill_category` (string)
- `description` (text)
- `certification_required` (boolean)
- `renewal_frequency_months` (number, nullable)
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `skill-matrix` for employee skills
- Links to `assets` for required skills
- Links to `maintenance-work-orders` for skill requirements

---

### Parts & Inventory

#### `parts-inventory` → `PartInventoryItem[]`
Spare parts inventory tracking.

**Fields:**
- `part_id` (string, primary key)
- `part_number` (string, unique)
- `part_name` (string)
- `description` (text)
- `category` (string)
- `manufacturer` (string)
- `quantity_on_hand` (number)
- `minimum_stock_level` (number)
- `unit_cost` (number)
- `location` (string)
- `status` (enum) - In Stock | Low Stock | Out of Stock
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `part-transactions` for transaction history
- Links to `spares-labor` via spare parts
- Links to `maintenance-work-orders` for parts usage

---

#### `part-transactions` → `PartTransaction[]`
Parts inventory transaction log.

**Fields:**
- `transaction_id` (string, primary key)
- `part_id` (string, foreign key)
- `transaction_type` (enum) - Purchase | Use | Transfer | Return | Adjustment
- `quantity` (number)
- `work_order_id` (string, foreign key, nullable)
- `employee_id` (string, foreign key, nullable)
- `notes` (text)
- `created_at` (ISO string)

**Relationships:**
- Links to `parts-inventory` via `part_id`
- Links to `maintenance-work-orders` via `work_order_id`
- Links to `employees` via `employee_id`

---

### Forms & Inspections

#### `form-templates` → `FormTemplate[]`
Inspection and JHA form templates.

**Fields:**
- `template_id` (string, primary key)
- `title` (string)
- `description` (text)
- `category` (enum) - Inspection | JHA | Safety | Checklist
- `fields` (FormField[]) - Dynamic form field definitions
- `created_at` (ISO string)
- `updated_at` (ISO string)

**Relationships:**
- Links to `form-submissions` for completed forms

---

#### `form-submissions` → `FormSubmission[]`
Completed form submissions.

**Fields:**
- `submission_id` (string, primary key)
- `template_id` (string, foreign key)
- `submitted_by` (string, foreign key)
- `work_order_id` (string, foreign key, nullable)
- `asset_id` (string, foreign key, nullable)
- `responses` (object) - Field ID to response mapping
- `status` (enum) - Draft | Submitted | Approved | Rejected
- `submitted_at` (ISO string)
- `created_at` (ISO string)

**Relationships:**
- Links to `form-templates` via `template_id`
- Links to `employees` via `submitted_by`
- Links to `maintenance-work-orders` via `work_order_id`
- Links to `assets` via `asset_id`

---

### Notifications & Reminders

#### `work-order-notifications` → `WorkOrderNotification[]`
Work order assignment notifications to employees.

**Fields:**
- `notification_id` (string, primary key)
- `employee_id` (string, foreign key)
- `work_order_id` (string, foreign key)
- `notification_type` (enum) - Assignment | Suggestion | Change | Overdue | Escalation
- `match_score` (number, nullable) - Skill match percentage
- `message` (string)
- `read` (boolean)
- `status` (enum) - Pending | Accepted | Rejected | Expired
- `created_at` (ISO string)

**Relationships:**
- Links to `employees` via `employee_id`
- Links to `maintenance-work-orders` via `work_order_id`

---

#### `certification-reminders` → `CertificationReminder[]`
Certification expiry reminders.

**Fields:**
- `reminder_id` (string, primary key)
- `employee_id` (string, foreign key)
- `skill_id` (string, foreign key)
- `certification_name` (string)
- `expiry_date` (ISO string)
- `days_until_expiry` (number)
- `status` (enum) - Active | Acknowledged | Expired | Renewed
- `created_at` (ISO string)

**Relationships:**
- Links to `employees` via `employee_id`
- Links to `skill-matrix` via `skill_id`

---

### User Settings & Preferences

#### `user-profile` → `UserProfile | null`
Current user profile and role selection.

**Fields:**
- `user_id` (string)
- `employee_id` (string, nullable)
- `role` (enum) - Admin | Manager | Supervisor | Technician | Viewer
- `preferences` (object)
- `created_at` (ISO string)
- `updated_at` (ISO string)

---

#### `notification-preferences` → `NotificationPreferences`
User notification settings.

**Fields:**
- `enabled` (boolean)
- `showToasts` (boolean)
- `playSound` (boolean)
- `notifyOnAssignmentSuggestions` (boolean)
- `notifyOnAssignmentChanges` (boolean)
- `notifyOnWorkOrderCreated` (boolean)
- `notifyOnWorkOrderOverdue` (boolean)
- `notifyOnPriorityEscalation` (boolean)
- `minimumMatchScore` (number)
- `autoAcceptHighMatchScore` (boolean)
- `autoAcceptThreshold` (number)

---

#### `dashboard-widgets` → `DashboardWidget[]`
Customizable dashboard widget configuration.

**Fields:**
- `widget_id` (string, primary key)
- `type` (string) - Widget type identifier
- `title` (string)
- `position` (object) - {x, y} grid position
- `size` (object) - {width, height} grid size
- `visible` (boolean)

---

## Data Access Patterns

### Read Operations
```typescript
const [data, setData] = useKV<Type[]>('key-name', defaultValue)
```

### Write Operations (Functional Updates - REQUIRED)
```typescript
// ✅ CORRECT - Always use functional updates
setData((current) => [...(current || []), newItem])
setData((current) => (current || []).filter(item => item.id !== deleteId))
setData((current) => (current || []).map(item => 
  item.id === updateId ? { ...item, ...updates } : item
))

// ❌ WRONG - Never reference closure state
setData([...data, newItem]) // CRITICAL BUG - data is stale!
```

### Delete Operations
```typescript
const [data, setData, deleteData] = useKV<Type[]>('key-name', [])
deleteData() // Removes entire key from storage
```

## Data Integrity Rules

1. **Always use functional updates** to avoid stale closure references
2. **Always validate foreign keys** before creating relationships
3. **Always update timestamps** when modifying records
4. **Always use null-safe operators** when accessing nested data
5. **Always provide default values** for useKV hooks

## Backup & Export

The application supports Excel export of:
- Work Orders
- SOPs
- Spares & Labor

Export function: `exportToExcel(data)` in `excel-parser.ts`

## Migration & Seeding

Sample data generators:
- `generateSampleWorkOrders()` - Creates sample work orders
- `generateSampleSOPs()` - Creates sample SOPs
- `generateSampleSparesLabor()` - Creates spare parts data
- `generateSampleEmployees()` - Creates sample employees
- `generateSampleSkillMatrix()` - Creates sample skills
- `generateSampleSchedules()` - Creates sample schedules
- `generateSampleParts()` - Creates sample parts inventory
- `generatePremadeTemplates()` - Creates form templates

## Performance Considerations

- All KV operations are async but cached in memory
- Updates trigger automatic persistence in background
- Large datasets (1000+ records) perform well due to client-side storage
- Functional updates prevent unnecessary re-renders

## Security

- Data is stored per-user and persists across sessions
- No server-side database required
- Data is not shared between users
- Browser storage limits apply (~5-10MB typical)

## Future Enhancements

Potential improvements for production:
- Server-side database synchronization
- Multi-user collaborative editing
- Real-time updates via WebSocket
- Data compression for large datasets
- Conflict resolution for concurrent edits
- Audit log for all changes
