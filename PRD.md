# Planning Guide

An enterprise-level Computerized Maintenance Management System (CMMS-lite) that integrates Standard Operating Procedures (SOPs), maintenance work order tracking, spare parts intelligence, and labor forecasting for industrial facility management.

**Experience Qualities**:
1. **Professional** - Clean, data-dense interface that prioritizes information hierarchy and quick access to critical maintenance data
2. **Intelligent** - Proactive system that auto-detects patterns, suggests actions, and automates scheduling based on maintenance frequencies
3. **Efficient** - Streamlined workflows that minimize clicks, enable bulk operations, and provide instant visibility into facility-wide maintenance status

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-module enterprise system with sophisticated data relationships, automated scheduling logic, Excel import capabilities, analytics dashboards, and cross-referenced data structures including work orders, SOPs, and parts inventory.

## Essential Features

### Excel Import Engine
- **Functionality**: Parse and validate multi-sheet Excel files with three specific schemas (Maintenance Tracking, SOP Library, Spares & Labor)
- **Purpose**: Enable seamless migration from existing Excel-based workflows and support periodic bulk updates
- **Trigger**: User clicks "Import Excel" button and selects file
- **Progression**: Upload file → Validate sheet structure → Map columns → Preview data with validation errors → Confirm import → Show diff for re-imports → Save to KV store
- **Success criteria**: All three sheets parsed correctly, relationships auto-linked, validation errors clearly displayed, duplicate handling works

### Maintenance Work Order Grid
- **Functionality**: Virtual-scrolled, groupable, filterable grid showing all maintenance tasks with inline editing
- **Purpose**: Provide real-time visibility into facility maintenance status and enable rapid task management
- **Trigger**: Default landing view, auto-refreshes when data changes
- **Progression**: Load work orders → Apply filters/grouping → Select row → Edit inline or open detail panel → Save changes → Update related records
- **Success criteria**: Handles 1000+ records smoothly, grouping by equipment/status/terminal works, overdue calculation accurate, color coding clear

### SOP Library & PM Generator
- **Functionality**: Searchable repository of standard operating procedures with automatic preventive maintenance schedule generation
- **Purpose**: Centralize procedures and automate recurring maintenance task creation based on defined frequencies
- **Trigger**: User navigates to SOP Library tab
- **Progression**: Browse/search SOPs → View full procedure → Click "Generate PM Schedule" → Select frequency (Daily/Weekly/Monthly/etc) → Review generated work orders → Confirm creation
- **Success criteria**: SOPs fully searchable, PM frequencies parsed correctly, generated work orders pre-filled with LOTO/PPE/downtime data

### Spares & Labor Intelligence
- **Functionality**: Parse labor hours by frequency, suggest spare parts for equipment classes, calculate projected maintenance load
- **Purpose**: Optimize resource allocation and parts inventory based on maintenance patterns
- **Trigger**: Automatic when creating work order or viewing forecasting dashboard
- **Progression**: Select equipment area → System identifies class → Display recommended spares → Show typical labor hours → Calculate monthly/yearly projections
- **Success criteria**: Frequency parsing accurate (Daily 0.25h format), spare parts suggestions contextual, labor forecasts match actual patterns

### Analytics Dashboard
- **Functionality**: Visual analytics showing work order distribution, downtime trends, labor forecasting, and completion metrics
- **Purpose**: Enable data-driven maintenance planning and resource optimization
- **Trigger**: User navigates to Dashboard tab
- **Progression**: Load aggregated data → Render charts (status, priority, timeline) → Apply date filters → Export reports
- **Success criteria**: Charts update in real-time, Gantt timeline accurate, heatmap shows maintenance density, completion rate calculated correctly

### Drag-and-Drop Calendar View
- **Functionality**: Interactive calendar with month and week views, allowing drag-and-drop rescheduling of work orders
- **Purpose**: Provide visual timeline for maintenance scheduling and enable intuitive rescheduling through direct manipulation
- **Trigger**: User navigates to Calendar tab
- **Progression**: View calendar → Select month/week view → Drag work order card → Drop on target date → Confirm reschedule → Update scheduled date
- **Success criteria**: Smooth drag interaction, visual feedback during drag, work orders update correctly, calendar refreshes immediately, shows downtime totals per day

### Automation Rules Engine
- **Functionality**: Auto-mark overdue tasks, trigger notifications, auto-schedule recurring maintenance, stamp completion dates
- **Purpose**: Reduce manual tracking overhead and ensure maintenance compliance
- **Trigger**: Runs automatically on data changes and daily schedule check
- **Progression**: System evaluates rules → Identifies matching conditions → Executes actions → Logs automation events → Notifies relevant users
- **Success criteria**: Overdue detection real-time, recurring tasks auto-created on schedule, completed_at stamped accurately

## Edge Case Handling

- **Empty Excel Sheets**: Display clear message indicating which required sheets are missing, prevent partial imports
- **Invalid Date Formats**: Show validation errors with row numbers, suggest correct format (ISO 8601)
- **Orphaned References**: When technician ID doesn't exist, mark as "Unassigned" and flag for review
- **Duplicate Work Order IDs**: On re-import, show diff view and ask user to merge or create new versions
- **Missing Frequency Keywords**: If task description lacks frequency terms, don't auto-schedule but flag for manual review
- **Concurrent Edits**: Use optimistic locking with last-write-wins, show toast notification if data was modified
- **Large Datasets**: Implement virtual scrolling, lazy loading for SOP details, pagination for analytics

## Design Direction

The design should evoke **industrial precision and operational confidence** - a tool that maintenance managers trust for mission-critical facility operations. Think aerospace engineering dashboards, not consumer apps. The interface should feel authoritative, data-dense but organized, with clear visual hierarchies that guide users through complex workflows efficiently.

## Color Selection

**Industrial Engineering Aesthetic** - Deep blue representing reliability and technical precision, with bright amber/orange for alerts creating high contrast and immediate attention.

- **Primary Color**: `oklch(0.35 0.12 255)` - Deep Industrial Blue - Conveys reliability, technical precision, and operational stability
- **Secondary Colors**: 
  - `oklch(0.25 0.08 255)` - Darker slate blue for headers and grouping
  - `oklch(0.95 0.02 255)` - Very light blue-gray for cards and panels
- **Accent Color**: `oklch(0.72 0.18 55)` - Amber/Safety Orange - High-visibility color for critical actions and alerts
- **Status Colors**:
  - Scheduled: `oklch(0.60 0.15 240)` - Professional Blue
  - In Progress: `oklch(0.65 0.14 145)` - Active Teal
  - Completed: `oklch(0.62 0.17 145)` - Success Green
  - Overdue: `oklch(0.58 0.20 25)` - Alert Red
  - Critical Priority: `oklch(0.45 0.21 15)` - Urgent Red-Orange

**Foreground/Background Pairings**:
- Primary (Deep Blue `oklch(0.35 0.12 255)`): White text `oklch(1 0 0)` - Ratio 8.9:1 ✓
- Accent (Amber `oklch(0.72 0.18 55)`): Dark text `oklch(0.2 0 0)` - Ratio 9.2:1 ✓
- Background (Light Gray `oklch(0.98 0.005 255)`): Dark text `oklch(0.2 0.05 255)` - Ratio 14.1:1 ✓
- Muted (Light Blue-Gray `oklch(0.95 0.02 255)`): Medium text `oklch(0.45 0.08 255)` - Ratio 7.8:1 ✓

## Font Selection

Typography should communicate **technical authority and operational clarity** - legible at small sizes for data-dense grids, with strong hierarchy for section headers and distinct monospace treatment for IDs and technical codes.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Bold / 32px / -0.02em letter spacing / 1.2 line-height
  - H2 (Module Headers): Inter Semibold / 24px / -0.01em / 1.3
  - H3 (Section Headers): Inter Semibold / 18px / normal / 1.4
  - Body (Grid Text): Inter Regular / 14px / normal / 1.5
  - Small (Metadata): Inter Regular / 12px / normal / 1.4
  - Monospace (IDs, Codes): JetBrains Mono / 13px / normal / 1.4
  - Button Labels: Inter Medium / 14px / normal / 1.2

## Animations

Animations should reinforce **operational responsiveness and data state changes** - subtle transitions that confirm actions without slowing down power users. Priority status changes should feel immediate with quick color fades, while grid sorting and grouping operations should use smooth reordering. Modal dialogs should slide up with authority, and data refresh indicators should pulse gently.

- **Grid Operations**: 250ms ease-out for row reordering, 150ms for cell updates
- **Status Changes**: 200ms color transition with subtle scale (1.0 → 1.02) on priority badge
- **Modal Entry**: 300ms slide-up with ease-out, backdrop blur fade
- **Loading States**: Gentle pulse on skeleton loaders, no spinners
- **Hover States**: 100ms color transition on interactive elements
- **Toast Notifications**: Slide in from top-right with 250ms spring animation

## Component Selection

- **Components**:
  - **Data Grid**: Custom virtualized table with shadcn Table as base, enhanced with grouping headers, inline editing, and fixed columns
  - **Filters**: Combination of Select (equipment, status, terminal), Calendar (date range), Input (search)
  - **Modals**: Dialog for work order details, Sheet for SOP full view, AlertDialog for confirmations
  - **Form Fields**: Input, Textarea, Select with form validation (react-hook-form), Calendar for date picking
  - **Status Badges**: Badge component with variant mapping to status/priority
  - **Charts**: Recharts for bar/line charts, custom D3 implementation for Gantt timeline and heatmap
  - **Upload**: Custom drag-drop zone with progress indicator
  - **Navigation**: Tabs for main module switching (Tracking, SOPs, Analytics, Settings)
  - **Notifications**: Sonner toast for success/error feedback

- **Customizations**:
  - **Smart Grid Component**: Virtual scrolling with dynamic row height, grouping headers with collapse, inline edit mode with validation
  - **SOP Viewer**: Expandable accordion-style sections for procedure steps, with sticky header showing LOTO/PPE requirements
  - **Frequency Parser Display**: Visual timeline showing Daily→Weekly→Monthly→Yearly with labor hours inline
  - **Work Order Timeline**: Custom Gantt chart with drag-to-reschedule, color-coded by priority, grouped by equipment
  - **Drag-and-Drop Calendar**: Custom calendar grid with native HTML5 drag-and-drop, visual drop zones, color-coded work order cards with left border status indicators, responsive month/week view toggle

- **States**:
  - Buttons: Default solid primary, hover with brightness increase, active with slight scale down, disabled with reduced opacity
  - Grid Rows: Hover with background tint, selected with left border accent, editing with blue outline
  - Dropdowns: Open state with shadow elevation, keyboard navigation highlighted
  - Form Inputs: Focus with ring color matching priority level, error with red ring and shake animation
  - Cards: Hover with subtle lift (shadow increase), active panels with border accent

- **Icon Selection**:
  - Wrench (maintenance actions)
  - Calendar (scheduling)
  - CalendarBlank (calendar view)
  - ClipboardText (SOPs and procedures)
  - Warning (overdue and alerts)
  - CheckCircle (completion)
  - Funnel (filters)
  - UploadSimple (import)
  - ChartBar (analytics)
  - Lightning (automation rules)
  - Package (spare parts)
  - User (technician assignment)
  - Clock (time/downtime)
  - CaretLeft/CaretRight (navigation)
  - Rows (week view)

- **Spacing**:
  - Grid padding: 16px horizontal, 12px vertical
  - Card padding: 24px
  - Section gaps: 32px vertical
  - Form field gaps: 16px
  - Inline elements: 8px gap
  - Page margins: 24px on mobile, 48px on desktop

- **Mobile**:
  - Switch to stacked card layout for work orders instead of grid
  - Collapsible filter panel as drawer
  - Bottom sheet for work order details
  - Simplified chart views with horizontal scroll
  - Priority actions (Mark Complete, Assign) as floating action button menu
  - Tabs convert to horizontal scrollable list
  - SOP viewer becomes full-screen modal with scroll sections
  - Calendar view switches to vertical week-only view on mobile with touch-optimized drag interactions
