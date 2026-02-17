# Auto-Scheduler Quick Reference

## 🔍 Quick Diagnosis

**Symptom**: All tasks appear on the same date in Calendar/Timeline views

**Root Cause**: Greedy algorithm always picks highest-scoring candidate, which is usually Day 0 with lowest utilization

---

## 🎯 Critical Issues at a Glance

### Issue #1: Date Clustering
- **File**: `src/lib/enhanced-auto-scheduler.ts:329`
- **Code**: `candidates.sort((a, b) => b.score.total - a.score.total); const best = candidates[0]`
- **Problem**: Always picks highest score → earliest date with available capacity
- **Fix**: Add date distribution factor to scoring OR implement round-robin selection

### Issue #2: Capacity Map Not Initialized
- **File**: `src/lib/enhanced-auto-scheduler.ts:120-124`
- **Code**: `employeeCapacityMap.set(emp.employee_id, new Map())`
- **Problem**: Doesn't account for existing scheduled work orders
- **Fix**: Pre-populate map by iterating through existing work orders

### Issue #3: Basic Scheduler Favors Early Dates
- **File**: `src/lib/auto-scheduler.ts:274`
- **Code**: `return a.date.getTime() - b.date.getTime()`
- **Problem**: Explicitly sorts by earliest date first
- **Fix**: Sort by utilization first, then date

---

## 🔧 Quick Fixes

### Fix 1: Add Date Distribution to Scoring (Enhanced Scheduler)

```typescript
// In calculateSchedulingScore(), add new parameter and scoring factor:

function calculateSchedulingScore(
  workOrder: WorkOrder,
  employee: Employee,
  date: Date,
  // ... other params
  dayOffset: number,        // NEW
  totalTasksScheduled: number  // NEW
): SchedulingScore {
  // ... existing scoring ...
  
  // Encourage spreading tasks across the window
  const idealOffset = totalTasksScheduled * 2  // Spread by 2 days per task
  const dateDistribution = Math.max(0, 100 - Math.abs(idealOffset - dayOffset) * 3)
  
  const total = (
    skillMatch * 0.25 +
    areaMatch * 0.15 +
    workload * 0.20 +
    availability * 0.10 +
    priority * 0.10 +
    dateDistribution * 0.20  // NEW: 20% weight
  )
  
  return { 
    skillMatch, areaMatch, assetMatch, availability, 
    workload, priority, 
    dateDistribution,  // NEW
    total 
  }
}
```

### Fix 2: Pre-populate Capacity Map

```typescript
// In enhancedAutoSchedule(), after creating employeeCapacityMap:

const employeeCapacityMap = new Map<string, Map<string, number>>()
activeEmployees.forEach(emp => {
  const empMap = new Map<string, number>()
  const empName = `${emp.first_name} ${emp.last_name}`
  
  // Pre-load existing scheduled tasks
  workOrders
    .filter(wo => 
      wo.assigned_technician === empName && 
      wo.status !== 'Completed' && 
      wo.status !== 'Cancelled'
    )
    .forEach(wo => {
      const dateStr = format(new Date(wo.scheduled_date), 'yyyy-MM-dd')
      const current = empMap.get(dateStr) || 0
      empMap.set(dateStr, current + (wo.estimated_downtime_hours || 0))
    })
  
  employeeCapacityMap.set(emp.employee_id, empMap)
})
```

### Fix 3: Balanced Selection Instead of Greedy

```typescript
// In scheduleWorkOrder(), replace the simple sort:

// OLD:
// candidates.sort((a, b) => b.score.total - a.score.total)
// const best = candidates[0]

// NEW: Select from least-loaded dates
const candidatesByDate = new Map<string, ScoredEmployee[]>()
candidates.forEach(c => {
  const list = candidatesByDate.get(c.dateStr) || []
  list.push(c)
  candidatesByDate.set(c.dateStr, list)
})

// Find date with fewest assignments so far
const dateLoads = Array.from(candidatesByDate.entries())
  .map(([date, cands]) => ({
    date,
    assignmentCount: cands.reduce((sum, c) => sum + c.currentLoad, 0),
    bestCandidate: cands.sort((a, b) => b.score.total - a.score.total)[0]
  }))
  .sort((a, b) => a.assignmentCount - b.assignmentCount)

const best = dateLoads[0].bestCandidate
```

---

## 📊 Data Flow

```
User Click "Auto-Schedule"
        ↓
EnhancedAutoSchedulerDialog
        ↓
enhancedAutoSchedule(workOrders, employees, ...)
        ↓
┌─────────────────────────────────────────┐
│ For each work order:                    │
│   1. Build candidates (all dates)       │
│   2. Score each (skill+area+workload)   │
│   3. Pick best candidate ← BUG HERE     │
│   4. Assign to employee + date          │
│   5. Update capacity map                │
└─────────────────────────────────────────┘
        ↓
Return scheduledWorkOrders[]
        ↓
handleAutoScheduleComplete(scheduledWorkOrders)
        ↓
setWorkOrders() updates state
        ↓
Calendar/Timeline re-render
        ↓
ALL TASKS ON SAME DATE (visible bug)
```

---

## 🧪 Test Cases

### Test 1: Basic Distribution
```
Input: 12 tasks, 3 employees, 14-day window
Expected: 4 tasks per employee, ~1-2 tasks per day
Current Bug: 12 tasks on Day 0
```

### Test 2: Capacity Enforcement
```
Input: 10 tasks (2hr each), 2 employees (8hr limit)
Expected: 5 tasks per employee across 2+ days
Current Bug: 8 tasks on Day 0 (16 hours total), 2 on Day 1
```

### Test 3: Priority Spread
```
Input: 3 Critical, 3 High, 3 Medium, 3 Low
Expected: Critical on early days, Low on later days
Current Bug: All on Day 0 sorted only by score
```

---

## 🎨 UI Integration Points

### Calendar View
- **File**: `src/components/CalendarView.tsx`
- **Lines**: 70-77 (filters work orders by date)
- **Impact**: Shows all tasks in one calendar cell when they share scheduled_date

### Timeline View
- **File**: `src/components/TimelineView.tsx`
- **Lines**: 85-100 (calculates bar positions)
- **Impact**: All bars start at same X position (same date)

### Trigger Buttons
1. Dashboard overdue alert (`App.tsx:649`)
2. Work Orders tab button (`App.tsx:817`)
3. Calendar "Optimize Schedule" (`App.tsx:964`)

---

## 🚀 Implementation Priority

1. **Phase 1** (Critical - 4 hours)
   - Fix capacity map initialization
   - Add date distribution to scoring
   
2. **Phase 2** (High - 6 hours)
   - Implement balanced selection
   - Fix basic scheduler date logic
   
3. **Phase 3** (Medium - 4 hours)
   - Add distribution preview in UI
   - Add validation warnings
   - Add tests

**Total Effort**: ~14 hours (2 days)

---

## 📝 Key Files to Modify

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/enhanced-auto-scheduler.ts` | Fix scoring & selection | 🔴 Critical |
| `src/lib/auto-scheduler.ts` | Fix basic scheduler | 🔴 Critical |
| `src/components/EnhancedAutoSchedulerDialog.tsx` | Add warnings | 🟡 Medium |
| `src/App.tsx` | Add validation | 🟡 Medium |

---

## 💡 Quick Wins

**Immediate improvement** (30 min):
```typescript
// In enhanced-auto-scheduler.ts, line 329:
// Change from:
candidates.sort((a, b) => b.score.total - a.score.total)

// To:
candidates.sort((a, b) => {
  // Balance by current load first
  const loadDiff = a.currentLoad - b.currentLoad
  if (Math.abs(loadDiff) > 1) return loadDiff
  
  // Then by date to spread
  const dateDiff = a.date.getTime() - b.date.getTime()
  if (dateDiff !== 0) return dateDiff
  
  // Finally by score
  return b.score.total - a.score.total
})
```

This simple change will significantly improve distribution!

---

**End of Quick Reference**
