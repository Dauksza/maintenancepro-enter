# Auto-Scheduler Implementation Analysis

**Analysis Date**: 2024  
**Repository**: maintenancepro-enter  
**Focus**: Auto-scheduler implementation, task distribution, and calendar/timeline integration

---

## Executive Summary

The auto-scheduler implementation has **two separate scheduling engines** that are not properly integrated with each other. The system exhibits critical issues with task distribution, date assignment, and worker allocation. Multiple tasks are being assigned to the same date without proper distribution among workers or across the scheduling window.

---

## 1. Current Implementation Overview

### 1.1 Two Auto-Scheduler Implementations

#### **Basic Auto-Scheduler** (`/src/lib/auto-scheduler.ts`)
- **Lines of Code**: 354 lines
- **Primary Function**: `autoScheduleOverdueTasks()`
- **Focus**: Simple capacity-based scheduling for overdue tasks only
- **Used By**: `AutoSchedulerDialog.tsx` (NOT currently active in app)

#### **Enhanced Auto-Scheduler** (`/src/lib/enhanced-auto-scheduler.ts`)
- **Lines of Code**: 514 lines
- **Primary Function**: `enhancedAutoSchedule()`
- **Focus**: Advanced scheduling with skills, areas, and asset matching
- **Used By**: `EnhancedAutoSchedulerDialog.tsx` (CURRENTLY ACTIVE)

**Key Finding**: The app uses `EnhancedAutoSchedulerDialog` (line 1234-1239 in App.tsx), meaning the enhanced scheduler is the active implementation.

---

## 2. How the Auto-Scheduler Currently Works

### 2.1 Enhanced Auto-Scheduler Flow

```
enhancedAutoSchedule()
  ↓
1. Filter work orders (overdue + not started)
2. Sort by priority/date/duration/skill_match
3. Get active employees
4. For each work order:
   ↓
   scheduleWorkOrder()
     ↓
     a. Extract required skills from task description
     b. Find eligible employees (skill/area matching)
     c. Build candidate list with ALL dates (0 to maxDaysAhead)
     d. Calculate scheduling score for each employee+date combo
     e. Sort by score and pick best candidate
     f. Update employeeCapacityMap
     g. Return scheduled work order
```

### 2.2 Key Code Locations

**Main scheduling loop** (`enhanced-auto-scheduler.ts:126-165`):
```typescript
for (const workOrder of sortedOrders) {
  const result = scheduleWorkOrder(
    workOrder,
    activeEmployees,
    // ... parameters
  )
  
  if (result.success && result.scheduledWorkOrder) {
    scheduled.push(result.scheduledWorkOrder)
    // Updates capacity map
  }
}
```

**Best slot selection** (`enhanced-auto-scheduler.ts:329`):
```typescript
candidates.sort((a, b) => b.score.total - a.score.total)
const best = candidates[0]  // Always picks highest score
```

**Date assignment** (`enhanced-auto-scheduler.ts:337`):
```typescript
scheduled_date: best.dateStr,  // From candidate with highest score
```

---

## 3. Critical Issues Identified

### 🔴 **ISSUE #1: All Tasks Assigned to Same/Single Date**

**Location**: `enhanced-auto-scheduler.ts:278-315`

**Problem**: The scheduling algorithm creates candidates for all employees across all dates (0 to maxDaysAhead), but always picks the candidate with the highest score. Since the scoring algorithm heavily weights:
- Skill match (30%)
- Area match (20%)
- Workload (20%)
- Availability (15%)
- Priority (15%)

**Result**: When the start date is today, and employees have 0 current load, the scoring creates:
- Day 0 (today) + Employee A = Score 95
- Day 0 (today) + Employee B = Score 92
- Day 1 + Employee A = Score 95 (same workload since it's Day 1)
- Day 1 + Employee B = Score 92

The algorithm doesn't penalize earlier dates or encourage distribution. **All tasks get assigned to Day 0 or very early dates** because:
1. Workload score is `((dailyLimit - currentLoad) / dailyLimit) * 100`
2. On Day 0, currentLoad = 0, so workload score = 100% for everyone
3. As tasks are assigned, Day 0 fills up first before Day 1 is considered

**Evidence**: Lines 278-315 show the loop creates candidates for ALL days, but the sort at line 329 always picks the highest score without considering date distribution.

---

### 🔴 **ISSUE #2: Poor Worker Distribution**

**Location**: `enhanced-auto-scheduler.ts:289-314`

**Problem**: The capacity tracking is per-employee per-date in a Map structure:
```typescript
const employeeCapacityMap = new Map<string, Map<string, number>>()
```

However, the scoring algorithm doesn't sufficiently penalize assigning multiple tasks to the same worker on the same day until they hit their daily limit (8 hours default).

**Example Scenario**:
- 10 tasks, each 1 hour long
- 3 employees available
- Result: Employee A gets 8 tasks on Day 0, Employee B gets 2 tasks on Day 0
- Expected: Tasks distributed across all 3 employees more evenly

**Why**: The workload score component only accounts for 20% of total score. Skill/area matching (50% combined) dominates the decision.

---

### 🔴 **ISSUE #3: Capacity Map Not Persisting Across Calls**

**Location**: `enhanced-auto-scheduler.ts:120-124`

**Problem**: The `employeeCapacityMap` is created fresh on each auto-scheduler run:
```typescript
const employeeCapacityMap = new Map<string, Map<string, number>>()
activeEmployees.forEach(emp => {
  employeeCapacityMap.set(emp.employee_id, new Map())
})
```

**Result**: The capacity map doesn't consider existing scheduled work orders when initialized. It should be pre-populated with current workload from already scheduled tasks.

**Impact**: Workers might be double-booked or overloaded if auto-scheduler is run multiple times.

---

### 🔴 **ISSUE #4: Basic Auto-Scheduler Has Same Issues**

**Location**: `auto-scheduler.ts:248-284`

The basic scheduler has similar problems:

```typescript
function findBestSlot(workOrder, slots, capacities) {
  const availableSlots = slots.filter(slot => {
    const remainingCapacity = slot.availableHours - slot.currentHours
    return remainingCapacity >= requiredHours
  })
  
  availableSlots.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime()  // EARLIEST DATE FIRST
    }
    return aUtilization - bUtilization  // LOWEST UTILIZATION SECOND
  })
  
  return availableSlots[0]  // Always returns earliest available date
}
```

**Problem**: Explicitly sorts by earliest date first (line 274), meaning all tasks go to the earliest possible dates.

---

### 🟡 **ISSUE #5: Weekend Handling Inconsistency**

**Location**: `enhanced-auto-scheduler.ts:281`

```typescript
if (!allowWeekends && isWeekend(candidateDate)) continue
```

**Problem**: This correctly skips weekend days when `allowWeekends=false`, BUT the UI default is:
- `AutoSchedulerDialog.tsx:62`: `allowWeekends = false`
- `EnhancedAutoSchedulerDialog.tsx:77`: `allowWeekends = false`

**Impact**: If scheduling starts on Friday and weekends are disallowed, all tasks bunch up on Friday or skip to Monday, creating uneven distribution.

---

### 🟡 **ISSUE #6: Scheduling Window Not Utilized Effectively**

**Location**: `enhanced-auto-scheduler.ts:78` and `AutoSchedulerDialog.tsx:62`

Default: `maxDaysAhead = 30`

**Problem**: Even though there's a 30-day window, the scoring algorithm doesn't encourage using it. Tasks are front-loaded into the earliest dates.

**Expected Behavior**: Tasks should be distributed across the 30-day window based on:
- Priority (Critical tasks earlier, Low priority can be later)
- Workload balancing
- Resource availability

**Actual Behavior**: All tasks pile up on the first available day(s).

---

## 4. Timeline and Calendar View Integration

### 4.1 CalendarView Component (`/src/components/CalendarView.tsx`)

**How it displays tasks** (lines 70-77):
```typescript
const dayWorkOrders = workOrders.filter(wo => {
  const woDate = new Date(wo.scheduled_date)
  return (
    woDate.getFullYear() === date.getFullYear() &&
    woDate.getMonth() === date.getMonth() &&
    woDate.getDate() === date.getDate()
  )
})
```

**Key Finding**: Calendar correctly filters work orders by `scheduled_date`. If all work orders have the same scheduled date, they all appear on the same day in the calendar view.

**Visual Result**: One calendar day is packed with 10-20 tasks while other days are empty.

---

### 4.2 TimelineView Component (`/src/components/TimelineView.tsx`)

**How it displays tasks** (lines 85-100):
```typescript
const calculateTimelineBars = (orders: WorkOrder[]): TimelineBar[] => {
  return orders.map(wo => {
    const startDate = parseISO(wo.scheduled_date)
    const durationDays = Math.max(wo.estimated_downtime_hours / 24, 0.25)
    const endDate = addDays(startDate, durationDays)
    const { left, width } = getBarPosition(wo.scheduled_date, wo.estimated_downtime_hours)
    
    return {
      workOrder: wo,
      startDate,
      endDate,
      left,
      width
    }
  })
}
```

**Key Finding**: Timeline groups tasks by `equipment_area` (line 58-63) and displays them as horizontal bars based on `scheduled_date`.

**Visual Result**: All bars start at the same position (same date), creating overlapping or stacked bars on one day.

---

## 5. Integration Points

### 5.1 Where Auto-Scheduler is Triggered

**Trigger Points in App.tsx**:

1. **Dashboard "Overdue" Alert** (line 649):
   ```typescript
   <Button onClick={() => setAutoSchedulerOpen(true)}>
     {overdueCount} Overdue
   </Button>
   ```

2. **Work Orders Tab** (line 817):
   ```typescript
   <Button onClick={() => setAutoSchedulerOpen(true)}>
     <Sparkle /> Auto-Schedule
   </Button>
   ```

3. **Calendar View "Optimize Schedule"** (line 964):
   ```typescript
   <CalendarView
     onOptimizeSchedule={() => setAutoSchedulerOpen(true)}
   />
   ```

---

### 5.2 How Scheduled Orders are Applied

**Location**: `App.tsx:307-326`

```typescript
const handleAutoScheduleComplete = (scheduledOrders: WorkOrder[]) => {
  setWorkOrders((current) => {
    const currentOrders = current || []
    const updatedOrders = [...currentOrders]
    
    scheduledOrders.forEach(scheduledOrder => {
      const index = updatedOrders.findIndex(
        wo => wo.work_order_id === scheduledOrder.work_order_id
      )
      if (index !== -1) {
        updatedOrders[index] = scheduledOrder  // ← Updates scheduled_date
      }
    })
    
    return updatedOrders
  })
}
```

**Key Finding**: The scheduled work orders directly replace existing work orders in state, updating their:
- `scheduled_date`
- `assigned_technician`
- `status` → `'Scheduled (Not Started)'`
- `is_overdue` → `false`

**Problem**: No validation that dates are actually distributed. The component trusts the scheduler output.

---

## 6. Data Flow Diagram

```
User clicks "Auto-Schedule" button
           ↓
App.tsx sets autoSchedulerOpen = true
           ↓
EnhancedAutoSchedulerDialog opens
           ↓
User configures options (start date, max days, etc.)
           ↓
User clicks "Schedule Now"
           ↓
enhancedAutoSchedule() is called
           ↓
For each work order:
  • Build candidates for ALL dates (Day 0 to Day 30)
  • Score each candidate (skill, area, workload)
  • Pick highest scoring candidate
  • Assign work order to that employee + date
  • Update employeeCapacityMap
           ↓
Return scheduled work orders
           ↓
handleAutoScheduleComplete() updates work orders in state
           ↓
Calendar/Timeline re-render with new scheduled_date values
           ↓
ALL TASKS APPEAR ON SAME DATE (BUG)
```

---

## 7. Root Causes Summary

### Primary Root Cause
**Greedy Algorithm with No Date Distribution Incentive**

The scheduler uses a greedy approach that always picks the "best" candidate based on score, but the scoring function doesn't penalize early dates or encourage spreading tasks across the scheduling window.

### Secondary Root Causes

1. **Workload score calculation** doesn't differentiate between dates when capacity is equal
2. **No progressive date preference** (e.g., spread tasks across week/month)
3. **Capacity map doesn't initialize with existing workload**
4. **Sort logic favors earliest dates** (basic scheduler) or highest scores (enhanced scheduler)
5. **No post-processing to rebalance** the schedule after initial assignment

---

## 8. Specific Code Problems

### Problem 1: Scoring Doesn't Account for Date Distribution
**File**: `enhanced-auto-scheduler.ts`  
**Line**: 371-426  
**Function**: `calculateSchedulingScore()`

```typescript
function calculateSchedulingScore(...) {
  // Scores: skill, area, asset, workload, availability, priority
  // MISSING: date distribution, task spacing, team balancing
  
  const total = (
    skillMatch * 0.3 +
    areaMatch * 0.2 +
    workload * 0.2 +
    availability * 0.15 +
    priority * 0.15
  )
  // No penalty for picking Day 0 vs Day 15
}
```

### Problem 2: Candidate Selection Always Picks Best Score
**File**: `enhanced-auto-scheduler.ts`  
**Line**: 329-331

```typescript
candidates.sort((a, b) => b.score.total - a.score.total)
const best = candidates[0]
// Should implement round-robin, date balancing, or team distribution
```

### Problem 3: Capacity Map Not Pre-populated
**File**: `enhanced-auto-scheduler.ts`  
**Line**: 120-124

```typescript
const employeeCapacityMap = new Map<string, Map<string, number>>()
activeEmployees.forEach(emp => {
  employeeCapacityMap.set(emp.employee_id, new Map())
  // MISSING: Loop through existing work orders and populate current load
})
```

### Problem 4: Basic Scheduler Explicitly Favors Earliest Dates
**File**: `auto-scheduler.ts`  
**Line**: 273-282

```typescript
availableSlots.sort((a, b) => {
  if (a.date.getTime() !== b.date.getTime()) {
    return a.date.getTime() - b.date.getTime()  // Earliest first
  }
  // ...
})
return availableSlots[0]  // Always earliest available
```

---

## 9. Visual Evidence of Issues

### Expected Calendar View:
```
Mon   Tue   Wed   Thu   Fri   Sat   Sun
[2]   [3]   [2]   [3]   [2]   [0]   [0]   ← Tasks distributed
```

### Actual Calendar View:
```
Mon   Tue   Wed   Thu   Fri   Sat   Sun
[12]  [0]   [0]   [0]   [0]   [0]   [0]   ← All tasks on Monday
```

### Expected Timeline View:
```
Equipment A: [===]  [===]     [===]       ← Bars spread across days
Equipment B:   [==]     [===]  [==]
```

### Actual Timeline View:
```
Equipment A: [===]                        ← All bars start at same day
             [===]
             [===]
Equipment B: [==]
             [==]
```

---

## 10. Recommendations for Fixes

### Priority 1: Fix Date Distribution in Enhanced Scheduler

**Add date spread factor to scoring**:
```typescript
function calculateSchedulingScore(
  workOrder: WorkOrder,
  employee: Employee,
  date: Date,
  skillMatrix: SkillMatrixEntry[],
  requiredSkills: Skill[],
  targetArea: Area | undefined,
  currentLoad: number,
  dailyLimit: number,
  taskIndex: number,  // NEW: position in sorted task list
  totalTasks: number,  // NEW: total tasks to schedule
  startDate: Date      // NEW: scheduling start date
): SchedulingScore {
  // ... existing scoring ...
  
  // NEW: Date distribution score
  const idealDayOffset = Math.floor((taskIndex / totalTasks) * maxDaysAhead)
  const actualDayOffset = differenceInDays(date, startDate)
  const dateDistanceFromIdeal = Math.abs(idealDayOffset - actualDayOffset)
  const dateDistribution = Math.max(0, 100 - (dateDistanceFromIdeal * 5))
  
  const total = (
    skillMatch * 0.25 +        // Reduced from 0.3
    areaMatch * 0.15 +         // Reduced from 0.2
    workload * 0.20 +
    availability * 0.10 +      // Reduced from 0.15
    priority * 0.10 +          // Reduced from 0.15
    dateDistribution * 0.20    // NEW: Encourages spreading
  )
  
  return { ...scores, dateDistribution, total }
}
```

### Priority 2: Initialize Capacity Map with Existing Workload

```typescript
const employeeCapacityMap = new Map<string, Map<string, number>>()
activeEmployees.forEach(emp => {
  const empMap = new Map<string, number>()
  const empName = `${emp.first_name} ${emp.last_name}`
  
  // Pre-populate with existing work orders
  workOrders
    .filter(wo => 
      wo.assigned_technician === empName && 
      wo.status !== 'Completed' && 
      wo.status !== 'Cancelled'
    )
    .forEach(wo => {
      const dateStr = format(new Date(wo.scheduled_date), 'yyyy-MM-dd')
      const currentHours = empMap.get(dateStr) || 0
      empMap.set(dateStr, currentHours + wo.estimated_downtime_hours)
    })
  
  employeeCapacityMap.set(emp.employee_id, empMap)
})
```

### Priority 3: Implement Round-Robin or Balanced Assignment

Instead of always picking `candidates[0]`, implement a smarter selection:

```typescript
// Group candidates by date
const candidatesByDate = candidates.reduce((acc, candidate) => {
  if (!acc[candidate.dateStr]) acc[candidate.dateStr] = []
  acc[candidate.dateStr].push(candidate)
  return acc
}, {} as Record<string, ScoredEmployee[]>)

// Pick from least loaded date
const dateCounts = Object.entries(candidatesByDate).map(([date, cands]) => ({
  date,
  count: cands.length,
  bestCandidate: cands.sort((a, b) => b.score.total - a.score.total)[0]
}))

dateCounts.sort((a, b) => a.count - b.count)  // Least loaded dates first
const best = dateCounts[0].bestCandidate
```

### Priority 4: Fix Basic Scheduler Date Logic

Replace earliest-first sort with balanced distribution:

```typescript
availableSlots.sort((a, b) => {
  // Sort by utilization first (balance load)
  const aUtilization = a.currentHours / a.availableHours
  const bUtilization = b.currentHours / b.availableHours
  const utilizationDiff = aUtilization - bUtilization
  
  if (Math.abs(utilizationDiff) > 0.1) {
    return utilizationDiff  // Pick less utilized slot
  }
  
  // If similar utilization, use date as tiebreaker
  return a.date.getTime() - b.date.getTime()
})
```

### Priority 5: Add Visual Validation in Calendar/Timeline

Add a distribution analysis after scheduling:

```typescript
const analyzeDateDistribution = (scheduledOrders: WorkOrder[]) => {
  const dateMap = new Map<string, number>()
  scheduledOrders.forEach(wo => {
    const count = dateMap.get(wo.scheduled_date) || 0
    dateMap.set(wo.scheduled_date, count + 1)
  })
  
  const uniqueDates = dateMap.size
  const avgTasksPerDate = scheduledOrders.length / uniqueDates
  
  console.log(`Scheduled ${scheduledOrders.length} tasks across ${uniqueDates} dates`)
  console.log(`Average: ${avgTasksPerDate.toFixed(1)} tasks per date`)
  
  // Alert if poor distribution
  if (uniqueDates < scheduledOrders.length / 5) {
    toast.warning('Tasks are concentrated on few dates. Consider manual adjustment.')
  }
}
```

---

## 11. Testing Recommendations

### Test Scenario 1: Basic Distribution
- **Input**: 20 overdue tasks, 4 employees, 30-day window
- **Expected**: ~5 tasks per employee, spread across at least 5-10 different dates
- **Current**: All 20 tasks on Day 0-1

### Test Scenario 2: Capacity Limits
- **Input**: 10 tasks (2 hours each), 2 employees (8hr limit), same skills
- **Expected**: Each employee gets 5 tasks, distributed across 2-3 days
- **Current**: Employee A gets 4 tasks on Day 0, 1 task on Day 1; Employee B gets 4 tasks on Day 0, 1 task on Day 1

### Test Scenario 3: Priority Handling
- **Input**: 5 Critical, 5 High, 5 Medium, 5 Low priority tasks
- **Expected**: Critical tasks scheduled first/earliest, Low tasks scheduled later
- **Current**: All tasks bunched together by score, not spread by priority

### Test Scenario 4: Weekend Handling
- **Input**: 15 tasks, scheduling starts Friday, weekends disabled
- **Expected**: Tasks spread across M-F of multiple weeks
- **Current**: All tasks on Friday, or all skip to Monday

---

## 12. Summary of Findings

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| All tasks assigned to same date | 🔴 Critical | `enhanced-auto-scheduler.ts:329` | Calendar shows all tasks on one day |
| Poor worker distribution | 🔴 Critical | `enhanced-auto-scheduler.ts:289-314` | Some workers overloaded, others idle |
| Capacity map not pre-populated | 🔴 Critical | `enhanced-auto-scheduler.ts:120-124` | Double-booking possible |
| Basic scheduler favors earliest dates | 🔴 Critical | `auto-scheduler.ts:274` | Same date clustering |
| Weekend handling causes bunching | 🟡 Medium | `enhanced-auto-scheduler.ts:281` | Uneven weekly distribution |
| Scheduling window not utilized | 🟡 Medium | Scoring algorithm | Wasted capacity in later dates |

---

## 13. Files Requiring Changes

1. ✅ `/src/lib/enhanced-auto-scheduler.ts` - Primary scheduler logic
2. ✅ `/src/lib/auto-scheduler.ts` - Basic scheduler logic
3. ⚠️ `/src/components/EnhancedAutoSchedulerDialog.tsx` - Add distribution preview
4. ⚠️ `/src/components/AutoSchedulerDialog.tsx` - Add distribution preview
5. ⚠️ `/src/components/CalendarView.tsx` - Add distribution warnings
6. ⚠️ `/src/components/TimelineView.tsx` - Add distribution warnings
7. ⚠️ `/src/App.tsx` - Add validation in handleAutoScheduleComplete

---

## 14. Conclusion

The auto-scheduler has a **fundamental algorithmic flaw** where the greedy selection of the "best" candidate (highest score) results in all tasks being assigned to the earliest dates with the most available capacity, rather than being distributed across the scheduling window and among workers.

**The fix requires**:
1. Modifying the scoring algorithm to include date distribution
2. Pre-populating the capacity map with existing workload
3. Implementing balanced assignment instead of greedy selection
4. Adding visual feedback and warnings about poor distribution

**Estimated Effort**: 2-3 days to implement and test all fixes

**Risk Level**: Medium (core scheduling logic changes, but well-isolated)

**Business Impact**: High (directly affects operational efficiency and resource utilization)

---

**End of Analysis**
