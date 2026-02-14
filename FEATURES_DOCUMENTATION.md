# MaintenancePro CMMS - Feature Documentation

## Overview

This document describes the major features in MaintenancePro CMMS:

1. **Global Search** - Unified search across all system entities
2. **Customizable Dashboard** - Personalized workspace with configurable widgets
3. **Role-Based Permissions** - Granular access control system
4. **ML-Powered Root Cause Analysis** - Pattern detection and failure analysis (NEW)

---

## 1. Global Search

### Features

- **Universal Search Bar**: Search across work orders, employees, assets, parts, SOPs, forms, and submissions
- **Keyboard Shortcut**: Quick access with `Cmd/Ctrl + K`
- **Real-time Results**: Intelligent relevance scoring with instant filtering
- **Type Filtering**: Filter results by entity type (Work Orders, Employees, etc.)
- **Contextual Highlighting**: Shows matching text snippets
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select

### Search Capabilities

The global search indexes and searches:
- **Work Orders**: ID, equipment/area, task description, comments, technician, terminal
- **Employees**: Name, email, phone, position, department, certifications
- **Assets**: Name, type, manufacturer, model, serial number
- **Parts**: Part number, name, description, manufacturer, compatible equipment
- **SOPs**: Title, purpose, scope, procedure summary
- **Form Templates**: Template name, description, category, tags
- **Form Submissions**: Template name, submitter, notes

### Usage

1. Click the search bar in the header or press `Cmd/Ctrl + K`
2. Start typing your query
3. Results appear instantly with relevance scores
4. Use arrow keys or mouse to select
5. Press Enter or click to open the selected item

### Technical Implementation

- **Location**: `/src/components/GlobalSearch.tsx`
- **Utilities**: `/src/lib/search-utils.ts`
- **Algorithm**: Multi-field relevance scoring with weighted priorities
- **Performance**: Debounced search (300ms) for optimal performance

---

## 2. Customizable Dashboard

### Features

- **Widget-Based Layout**: Modular dashboard with draggable widgets
- **Customization Mode**: Toggle edit mode to show/hide widgets
- **Persistent Configuration**: Dashboard layout saved per user
- **Real-time Updates**: Auto-refreshing data displays
- **Role-Aware Content**: Widgets adapt based on user permissions

### Available Widgets

1. **Quick Statistics**
   - Total work orders
   - In-progress tasks
   - Completed tasks
   - Overdue count
   - Personal task count

2. **My Assignments**
   - User's active work orders
   - Priority indicators
   - Quick access to details
   - Scheduled dates

3. **Overdue Tasks**
   - Critical overdue items
   - Priority badges
   - Due date warnings
   - Quick actions

4. **Certification Status**
   - Expiring certifications
   - Days until expiry
   - Employee assignments
   - Critical alerts

5. **Parts Inventory Alerts**
   - Low stock warnings
   - Out of stock items
   - Reorder notifications
   - Quantity indicators

### Customization

1. Click **"Customize"** button on dashboard
2. Toggle widgets on/off with visibility buttons
3. Widget preferences auto-save
4. Click **"Done Customizing"** to exit

### Technical Implementation

- **Location**: `/src/components/CustomizableDashboard.tsx`
- **Storage**: User preferences stored in KV store
- **State Management**: Real-time widget visibility and layout
- **Responsive**: Adapts to different screen sizes

---

## 3. Role-Based Permissions

### User Roles

The system supports five hierarchical roles:

#### Admin
- **Full Access**: All features and data
- **Permissions**: Create, read, update, delete, execute on all resources
- **Special Access**: User management, system configuration
- **Visible Tabs**: All tabs

#### Manager
- **Broad Access**: All operational features
- **Permissions**: CRUD on work orders, employees, assets, parts, forms
- **Restrictions**: Cannot manage users or configure system
- **Approvals**: Can approve forms and submissions

#### Supervisor
- **Operational Access**: Core maintenance features
- **Permissions**: Create/update work orders, view reports
- **Restrictions**: Cannot delete major entities or manage users
- **Approvals**: Can approve forms

#### Technician
- **Task-Focused Access**: Work orders, parts, forms, SOPs
- **Permissions**: Update assigned work orders, use parts, submit forms
- **Restrictions**: Cannot create work orders or manage employees
- **View Only**: Cannot modify schedules or analytics

#### Viewer
- **Read-Only Access**: View work orders, reports, schedules
- **Permissions**: Read-only on most entities
- **Restrictions**: No create, update, or delete actions
- **Purpose**: Observers, auditors, external stakeholders

### Permission System

#### Resource-Based Permissions

Each role has specific permissions for resources:
- `work-orders`: CRUD operations on maintenance tasks
- `employees`: Manage workforce data
- `assets`: Equipment and facility management
- `parts`: Inventory management
- `sops`: Standard operating procedures
- `forms`: Forms and inspections
- `analytics`: Reports and dashboards
- `schedules`: Work scheduling

#### Action Types

Five action types control granular access:
- **create**: Add new entities
- **read**: View existing data
- **update**: Modify existing data
- **delete**: Remove entities
- **execute**: Run operations (auto-scheduler, bulk actions)

### Tab Visibility

Tabs are dynamically shown/hidden based on role:

| Tab | Admin | Manager | Supervisor | Technician | Viewer |
|-----|-------|---------|------------|------------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tracking | ✓ | ✓ | ✓ | ✓ | ✓ |
| Timeline | ✓ | ✓ | ✓ | - | ✓ |
| Resources | ✓ | ✓ | ✓ | - | - |
| Capacity | ✓ | ✓ | ✓ | - | - |
| Calendar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Employees | ✓ | ✓ | ✓ | - | - |
| Assets | ✓ | ✓ | ✓ | - | - |
| Parts | ✓ | ✓ | ✓ | ✓ | - |
| Forms | ✓ | ✓ | ✓ | ✓ | - |
| Certifications | ✓ | ✓ | ✓ | ✓ | - |
| SOPs | ✓ | ✓ | ✓ | ✓ | - |
| Analytics | ✓ | ✓ | ✓ | - | ✓ |

### User Profile Menu

Located in the top-right header:
- **Avatar Display**: User photo and initials
- **Role Badge**: Current role with color coding
- **Quick Role Switch**: Change roles for testing (development only)
- **Settings Access**: User preferences and configuration
- **Sign Out**: Session termination

### Usage

1. **Default Role**: New users assigned "Technician" role
2. **Admin Override**: Workspace owners automatically get "Admin" role
3. **Role Switching**: Click profile menu → "Change Role"
4. **Permission Checks**: UI elements hide/disable based on permissions

### Technical Implementation

- **Types**: `/src/lib/types.ts` - UserRole, Permission, UserProfile
- **Logic**: `/src/lib/permissions.ts` - Permission checking functions
- **UI**: `/src/components/UserProfileMenu.tsx` - User interface
- **Integration**: Permissions checked throughout App.tsx

### Permission Helper Functions

```typescript
// Check if user can perform action on resource
hasPermission(userRole, 'work-orders', 'create')

// Check if user can view a tab
canViewTab(userRole, 'employees')

// Check if user can edit data
canEditData(userRole, isOwnData)

// Get all available tabs for role
getAvailableTabs(userRole)
```

---

## Integration Points

### App.tsx Integration

The main App component now includes:

1. **User Profile State**: Tracks current user and role
2. **Permission Guards**: Conditional rendering based on permissions
3. **Global Search**: Keyboard shortcut handler and dialog
4. **Dashboard Tab**: New default landing page
5. **Role-Aware UI**: Dynamic button visibility

### State Management

All features use the `useKV` hook for persistence:
- `user-profile`: User account and preferences
- `dashboard-widgets`: Dashboard configuration
- Search results are ephemeral (not persisted)

### Data Flow

```
User Action
    ↓
Permission Check
    ↓
Component Render / Action
    ↓
State Update (if allowed)
    ↓
KV Store Persistence
```

---

## 4. ML-Powered Root Cause Analysis

### Overview

The Root Cause Analysis (RCA) system uses machine learning algorithms to analyze historical work order data and identify common failure patterns, equipment relationships, and recurring maintenance issues. This proactive approach helps teams understand **why** failures occur, not just when.

### Key Features

#### Pattern Recognition
- **Automatic Detection**: ML algorithms identify recurring failure patterns
- **Keyword Extraction**: NLP-based analysis of task descriptions and comments
- **Similarity Clustering**: Groups related failures using advanced algorithms
- **Trend Analysis**: Tracks if patterns are increasing, decreasing, or stable
- **Confidence Scoring**: Indicates reliability of each pattern (0-100%)

#### Failure Clustering
- **Equipment-Specific Analysis**: Groups failures by equipment
- **Symptom Identification**: Extracts common symptoms from work order text
- **Root Cause Hypothesis**: AI-generated theories about failure causes
- **Recurring Interval Detection**: Identifies if failures happen on a schedule
- **Prevention Strategies**: Actionable recommendations to prevent future failures

#### Causal Relationships
- **Cascading Failure Detection**: Identifies when one equipment failure leads to another
- **Correlation Strength**: Measures how strongly two equipment areas are linked
- **Time Lag Analysis**: Calculates typical delay between cause and effect
- **Example Tracking**: Provides concrete work order examples of relationships

#### Timeline Analysis
- **Failure Acceleration Warning**: Detects when time between failures is decreasing
- **Critical Period Identification**: Highlights time windows with multiple failures
- **Interval Tracking**: Monitors time since last failure for each equipment
- **Visual Timeline**: Chronological view of all failures per equipment

#### Task Complexity Analysis
- **Complexity Scoring**: Evaluates difficulty of maintenance tasks (0-100%)
- **Completion Time Tracking**: Monitors how long tasks typically take
- **Failure Rate Calculation**: Identifies tasks that often need rework
- **Improvement Recommendations**: Suggests procedure changes, training needs

### Pattern Types Detected

The system automatically recognizes these failure categories:

**Mechanical Failures**
- Keywords: wear, broken, crack, bearing, seal
- Causes: Component wear, improper lubrication, excessive load
- Prevention: Reduce operating hours, improve lubrication, use premium parts

**Fluid System Issues**
- Keywords: leak, oil, hydraulic, pressure
- Causes: Seal degradation, fitting looseness, thermal cycling
- Prevention: Upgrade seals, weekly inspections, proper torque

**Electrical Problems**
- Keywords: electrical, circuit, voltage, power
- Causes: Connection corrosion, loose terminals, insulation breakdown
- Prevention: Thermographic inspections, corrosion protection, grounding

**Calibration Drift**
- Keywords: calibrate, adjust, alignment, drift
- Causes: Component aging, environmental factors, mechanical wear
- Prevention: Increase calibration frequency, control environment

### Usage

1. **Navigate to RCA**
   - Go to "Predictive ML" tab
   - Select "Root Cause Analysis" sub-tab
   
2. **View Overview Dashboard**
   - Total patterns identified
   - Failure clusters detected
   - Causal relationships found
   - Equipment with accelerating failures

3. **Analyze Patterns**
   - Click on any pattern to expand details
   - Review contributing factors
   - Implement prevention strategies
   - View related work orders

4. **Investigate Clusters**
   - Examine equipment-specific failure groups
   - Read AI-generated root cause hypotheses
   - Follow recommended prevention strategies
   - Track total downtime impact

5. **Explore Relationships**
   - Identify cascading failures between equipment
   - Plan coordinated maintenance
   - Prevent secondary failures

6. **Monitor Timelines**
   - Watch for failure acceleration warnings (red flag)
   - Investigate critical periods
   - Adjust PM schedules based on actual intervals

7. **Review Task Complexity**
   - Identify tasks needing better procedures
   - Plan technician training
   - Pre-stage parts for complex tasks

### Minimum Data Requirements

For meaningful analysis:
- **Minimum**: 5+ work orders total
- **Pattern Detection**: 3+ similar work orders
- **Timeline Analysis**: 2+ occurrences per equipment
- **Optimal**: 50+ work orders, 6+ months history

### Confidence Scores

- **90-100%**: Very high confidence - strong, consistent pattern
- **70-89%**: High confidence - reliable pattern
- **50-69%**: Moderate confidence - emerging pattern
- **30-49%**: Low confidence - insufficient data
- **<30%**: Very low confidence - more data needed

### Technical Implementation

- **Location**: `/src/components/RootCauseAnalysis.tsx`
- **Algorithms**: `/src/lib/root-cause-analysis.ts`
- **Integration**: Embedded in Predictive Maintenance Dashboard
- **Performance**: Client-side analysis, 200-500ms for 100 work orders

### Algorithms Used

1. **Text Similarity**: Jaccard coefficient for keyword matching
2. **Clustering**: Density-based clustering with similarity thresholds
3. **Time Series**: Interval analysis with trend detection
4. **Correlation**: Temporal correlation analysis with lag detection
5. **NLP**: Keyword extraction and stop word filtering

### Best Practices

✅ **Do:**
- Provide detailed task descriptions
- Include symptoms and root causes in comments
- Update completion times accurately
- Mark work orders completed when done

❌ **Don't:**
- Use generic descriptions like "fix equipment"
- Leave fields blank
- Create duplicate work orders
- Cancel without reason

### Data Quality Impact

**High Quality Data → Better Analysis:**
- Detailed descriptions = Better pattern recognition
- Complete dates = Accurate interval analysis
- Consistent terminology = Stronger clustering
- Thorough comments = More accurate root cause theories

### Integration Points

- **Predictive Maintenance**: Patterns feed into failure predictions
- **Work Orders**: Click through to view related work orders
- **Parts Inventory**: Prevention strategies suggest spare parts needs
- **Employee Training**: Task complexity identifies training requirements

### Performance Characteristics

- Analysis runs entirely in browser (no server required)
- Results cached until data changes
- Scales well to 1000+ work orders
- All data processed locally for privacy

### Future Enhancements

Planned improvements:
1. **LLM Integration**: AI-powered natural language insights
2. **Seasonal Analysis**: Detect seasonal failure patterns
3. **Cost Impact**: Calculate financial impact of failures
4. **Automatic Actions**: Auto-create work orders for high-risk patterns
5. **Team Collaboration**: Share insights and confirm root causes

### Documentation

For complete details, see: **ROOT_CAUSE_ANALYSIS.md**

---

## Future Enhancements

### Planned Features

1. **Advanced Search**
   - Saved searches
   - Search filters (date range, status, priority)
   - Search history
   - Export search results

2. **Dashboard Improvements**
   - Drag-and-drop widget positioning
   - Widget resizing
   - Custom widget creation
   - Dashboard templates
   - Multiple dashboard profiles

3. **Enhanced Permissions**
   - Custom role creation
   - Field-level permissions
   - Department-based access
   - Approval workflows
   - Audit logging

4. **User Management**
   - User invitation system
   - Bulk user import
   - Team management
   - Permission groups
   - Access request workflow

---

## Testing

### Testing Search

1. Load sample data
2. Press `Cmd+K` to open search
3. Type "pump" to find pump-related items
4. Verify results show work orders, SOPs, parts
5. Test type filtering (click "Work Order" tab)
6. Test keyboard navigation

### Testing Dashboard

1. Navigate to Dashboard tab
2. Click "Customize" button
3. Toggle widgets off
4. Verify widgets hide
5. Toggle back on
6. Click "Done Customizing"
7. Refresh page - verify settings persist

### Testing Permissions

1. Click profile menu in top-right
2. Switch to "Viewer" role
3. Verify tabs are hidden
4. Verify buttons are disabled
5. Switch to "Admin" role
6. Verify all features accessible
7. Test each role systematically

---

## Troubleshooting

### Search Not Working
- Check browser console for errors
- Verify data is loaded
- Clear browser cache
- Check keyboard shortcut conflicts

### Dashboard Not Saving
- Verify KV store is working
- Check browser localStorage
- Try clearing and reconfiguring
- Check console for errors

### Permissions Not Applied
- Refresh page after role change
- Verify user profile is loaded
- Check role assignment
- Clear KV store and re-login

---

## API Reference

### Search API

```typescript
globalSearch(
  query: string,
  data: {
    workOrders?: WorkOrder[]
    employees?: Employee[]
    // ... other entities
  },
  filters?: SearchFilters,
  limit?: number
): SearchResult[]
```

### Permission API

```typescript
hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
): boolean
```

### Dashboard API

```typescript
// Get user's dashboard configuration
const [widgets, setWidgets] = useKV<DashboardWidget[]>('dashboard-widgets', defaultWidgets)

// Update widget visibility
setWidgets(current =>
  current.map(w => w.widget_id === id ? { ...w, visible: !w.visible } : w)
)
```

---

## Security Considerations

1. **Client-Side Only**: Permissions are UI-only, not enforced server-side
2. **Data Visibility**: All data loaded to client regardless of role
3. **Production Use**: Implement server-side authorization for production
4. **Audit Trail**: No audit logging currently implemented
5. **Session Management**: No automatic session timeout

---

## Performance

- **Search**: Optimized with debouncing and relevance scoring
- **Dashboard**: Widgets lazy-load and use memoization
- **Permissions**: Cached role configurations
- **State**: Minimal re-renders with proper React patterns

---

## Accessibility

- **Keyboard Navigation**: Full keyboard support in search
- **Screen Readers**: Semantic HTML and ARIA labels
- **Focus Management**: Proper focus trapping in dialogs
- **Color Contrast**: WCAG AA compliant color schemes

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Credits

Built with:
- React 19
- TypeScript
- shadcn/ui components
- Tailwind CSS
- Phosphor Icons
