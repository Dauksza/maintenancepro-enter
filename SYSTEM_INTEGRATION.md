# System Integration & Interconnectivity Report

## Overview
This document outlines how all modules in the MaintenancePro CMMS system are interconnected and work together.

## Core Data Models & Relationships

### Work Orders ↔ Employees
- **Connection**: `WorkOrder.assigned_technician` matches `Employee.first_name` + `Employee.last_name`
- **Usage**: 
  - Auto-scheduler assigns employees to work orders
  - Resource allocation view groups by technician
  - Employee analytics track work order performance
  - Capacity planning limits daily hours per technician

### Employees ↔ Skills Matrix
- **Connection**: `SkillMatrixEntry.employee_id` → `Employee.employee_id`
- **Usage**:
  - Skill matrix tracks employee competencies with levels (Beginner → Expert)
  - Auto-scheduler filters eligible employees based on required skills
  - Skill-based recommendations suggest best matches
  - Certification reminders track expiry dates

### Work Orders ↔ Skills
- **Connection**: `WorkOrder.required_skill_ids[]` → `Skill.skill_id`
- **Usage**:
  - Work orders specify required skills
  - Auto-scheduler matches employees with those skills
  - Skill matcher calculates compatibility scores
  - Missing skills trigger conflict warnings

### Work Orders ↔ Areas
- **Connection**: `WorkOrder.area_id` → `Area.area_id` OR `WorkOrder.equipment_area` matches `Area.area_name`
- **Usage**:
  - Work orders assigned to specific facility areas
  - Areas have assigned employees (`Area.assigned_employee_ids[]`)
  - Auto-scheduler prioritizes employees assigned to task area
  - Work orders can be filtered/grouped by area

### Work Orders ↔ Assets
- **Connection**: `WorkOrder.required_asset_ids[]` → `Asset.asset_id`
- **Usage**:
  - Work orders specify required equipment/tools
  - Assets track maintenance tasks (`Asset.maintenance_task_ids[]`)
  - Assets have required skills (`Asset.required_skill_ids[]`)
  - Asset availability considered in scheduling

### Work Orders ↔ SOPs
- **Connection**: `WorkOrder.linked_sop_ids[]` → `SOP.sop_id`
- **Usage**:
  - Work orders can reference standard procedures
  - SOPs auto-generate preventive maintenance tasks
  - SOP frequencies (Daily/Monthly/Yearly) create recurring work orders
  - LOTO/PPE requirements auto-populate from SOPs

### Work Orders ↔ Parts Inventory
- **Connection**: Work orders consume parts via transactions
- **Usage**:
  - Part transactions link to work order IDs
  - Work order detail shows required/used parts
  - Parts recommendations based on equipment class
  - Inventory alerts when parts low

### Employees ↔ Schedules
- **Connection**: `EmployeeSchedule.employee_id` → `Employee.employee_id`
- **Usage**:
  - Schedules track daily shifts and hours
  - Auto-scheduler checks employee availability
  - Capacity planning calculates daily limits
  - Schedule view shows weekly assignments

### Employees ↔ Certifications
- **Connection**: Certifications stored in `SkillMatrixEntry` with `expiry_date`
- **Usage**:
  - Certification reminders track expirations
  - Auto-disable employees with expired critical certs
  - Compliance dashboard shows certification status
  - Renewal workflow updates expiry dates

### Employees ↔ Areas
- **Connection**: `Area.assigned_employee_ids[]` contains `Employee.employee_id`
- **Usage**:
  - Employees assigned to facility areas/zones
  - Auto-scheduler matches work location to employee areas
  - Area capacity limits spread workload
  - Employees can be assigned to multiple areas

## Module Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                      Work Order System                       │
│  • Tracking Grid • Timeline • Calendar • Gantt Chart        │
└────────┬─────────────────────────────────┬──────────────────┘
         │                                 │
         │ assigns to                     │ references
         ↓                                 ↓
┌─────────────────────┐          ┌──────────────────────┐
│  Employee System    │          │    SOP Library       │
│  • Directory        │          │  • Procedures        │
│  • Skill Matrix     │←────────→│  • PM Generator      │
│  • Schedules        │  requires │  • LOTO/PPE Rules   │
│  • Messaging        │  skills   │                      │
│  • Certifications   │           └──────────────────────┘
└──────────┬──────────┘
           │ works in                  
           ↓                          
┌─────────────────────┐          ┌──────────────────────┐
│   Asset & Area      │          │  Parts Inventory     │
│  • Assets           │          │  • Parts Catalog     │
│  • Areas/Zones      │←────────→│  • Transactions      │
│  • Assignments      │  uses    │  • Stock Levels      │
│  • Skills Required  │  parts   │  • Reorder Alerts    │
└─────────────────────┘          └──────────────────────┘
           │
           │ provides data to
           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Auto-Scheduler                   │
│  Considers: Skills • Areas • Assets • Capacity • Priority   │
│  Outputs: Assignments • Scores • Conflicts • Previews       │
└─────────────────────────────────────────────────────────────┘
```

## Auto-Scheduler Integration

### Inputs
1. **Work Orders**: Unassigned or overdue tasks
2. **Employees**: Active technicians with skills/areas/schedules
3. **Skills Matrix**: Employee competencies and levels
4. **Assets**: Required equipment with assigned employees
5. **Areas**: Facility zones with employee assignments
6. **Schedules**: Employee availability and shift patterns
7. **Capacities**: Daily hour limits per technician

### Process
1. Filter targetable work orders (Scheduled/Overdue, not Completed/Cancelled)
2. Filter active employees
3. For each work order:
   - Extract required skills from task description
   - Find target area
   - Identify required assets
   - Filter eligible employees by:
     * Skill match (with minimum level threshold)
     * Area assignment (optional)
     * Asset access (optional)
   - For each eligible employee × date combination:
     * Check capacity availability
     * Calculate multi-factor score:
       - Skill match (30%)
       - Area match (20%)
       - Workload balance (20%)
       - Availability (15%)
       - Priority (15%)
   - Sort candidates by total score
   - Assign to best match
   - Update capacity map

### Outputs
1. **Scheduled Work Orders**: With assigned technician and date
2. **Failed Assignments**: With reason and conflicts
3. **Scheduling Previews**: Show current vs. proposed assignments
4. **Statistics**:
   - Total processed
   - Successfully scheduled
   - Failed count
   - Employees used
   - Average score
   - Date range

### Conflict Detection
- **Skill Mismatch**: No employees have required skills
- **Capacity Exceeded**: All employees at daily hour limits
- **Employee Unavailable**: Assigned tech is inactive/on leave
- **Area Mismatch**: No employees assigned to work area
- **Asset Unavailable**: Required equipment not accessible

## Notification System Integration

### Triggers
1. **New Work Order Created** → Notify employees with matching skills
2. **Auto-Scheduler Runs** → Notify assigned technicians
3. **Assignment Changed** → Notify previous and new assignees
4. **Work Order Overdue** → Escalate to supervisors
5. **Certification Expiring** → Alert employee and manager
6. **Part Low Stock** → Notify procurement team

### Notification Flow
```
Event Trigger
     ↓
Generate Notifications (notification-utils.ts)
     ↓
Store in KV ('work-order-notifications')
     ↓
Display in NotificationCenter
     ↓
Optional Toast (if preferences.showToasts)
     ↓
User Actions: Accept | Reject | Mark Read
     ↓
Update Work Order or Notification Status
```

## Data Persistence Strategy

### Key-Value Store Keys
- `maintenance-work-orders`: All work orders
- `employees`: Employee directory
- `skill-matrix`: Employee skills with levels/expiry
- `employee-schedules`: Daily shift assignments
- `employee-messages`: Internal messaging
- `certification-reminders`: Active cert expiration alerts
- `work-order-notifications`: Assignment notifications
- `parts-inventory`: Parts catalog
- `part-transactions`: Inventory movements
- `assets`: Physical assets/equipment
- `areas`: Facility areas/zones
- `skills`: Skill definitions
- `sop-library`: Standard procedures
- `spares-labor`: Parts/labor data
- `technician-capacities`: Daily hour limits
- `notification-preferences`: User settings

### Data Flow Pattern
```
User Action
     ↓
Update State with useKV setter (functional update!)
     ↓
Trigger side effects (notifications, auto-schedule)
     ↓
Update related entities
     ↓
Refresh UI automatically via React hooks
```

## Wizard Integration

All wizards follow the same pattern:
1. **Multi-step form** with progress indicator
2. **Validation** at each step
3. **Review screen** before submission
4. **Auto-linking** to related entities
5. **Conflict detection** and warnings
6. **Persistence** via useKV

### Available Wizards
- **AddEmployeeWizard**: Create employees with skills/schedule
- **AddAssetWizard**: Create assets with area/skill requirements
- **AddSkillWizard**: Define skills with certification rules
- **AddAreaWizard**: Define areas with employee assignments
- **NewWorkOrderDialog**: Create work orders with SOP links

## Best Practices for Developers

### 1. Always Use Functional Updates
```typescript
// ❌ WRONG - Stale closure!
setWorkOrders([...workOrders, newOrder])

// ✅ CORRECT - Fresh state
setWorkOrders((current) => [...(current || []), newOrder])
```

### 2. Maintain Referential Integrity
```typescript
// When updating employee, also update:
- Work orders with assigned_technician
- Skill matrix entries
- Area assignments
- Schedules
- Notifications
```

### 3. Use Safe Defaults
```typescript
const safeEmployees = employees || []
const safeSkillMatrix = skillMatrix || []
```

### 4. Calculate Derived Data
```typescript
// Don't store computed values
const overdueCount = workOrders.filter(wo => wo.is_overdue).length
const activeEmployees = employees.filter(e => e.status === 'Active')
```

### 5. Cascade Updates
```typescript
// When work order completes:
- Update status → 'Completed'
- Set completed_at timestamp
- Clear is_overdue flag
- Update part inventory if parts used
- Generate completion notification
```

## System Health Checks

### Data Integrity
- [ ] All work orders have valid assigned_technician or null
- [ ] All skill matrix entries reference existing employees
- [ ] All area assignments reference existing employees
- [ ] All work order dates are valid ISO strings
- [ ] All capacity limits are positive numbers

### Functional Tests
- [ ] Auto-scheduler runs without errors
- [ ] Employee edit saves all fields correctly
- [ ] Work order assignment triggers notifications
- [ ] Skill matrix updates reflect in scheduler
- [ ] Certification reminders generate on schedule
- [ ] Parts transactions update inventory correctly

### UI/UX Checks
- [ ] All wizards complete successfully
- [ ] Search and filters work across modules
- [ ] Data persists after page reload
- [ ] Toast notifications appear when configured
- [ ] Error messages are clear and actionable

## Future Enhancement Opportunities

1. **Advanced Scheduling**
   - Multi-day task support
   - Task dependencies
   - Team-based assignments
   - Recurring maintenance rules

2. **Enhanced Analytics**
   - Predictive maintenance
   - Employee performance trends
   - Cost tracking per work order
   - Equipment reliability metrics

3. **Mobile Support**
   - Responsive design enhancements
   - Offline mode with sync
   - Barcode/QR scanning for assets
   - Photo attachments

4. **Integration Hooks**
   - External CMMS import/export
   - Calendar sync (Google/Outlook)
   - Email notifications
   - SMS alerts for critical issues

## Conclusion

The MaintenancePro system achieves full interconnectivity through:
- **Shared data models** with clear relationships
- **Consistent patterns** (useKV, functional updates, wizards)
- **Automatic propagation** of changes across modules
- **Intelligent automation** (auto-scheduler, notifications, reminders)
- **Robust error handling** and conflict detection

All modules work together seamlessly to provide a complete maintenance management solution.
