# MaintenancePro CMMS - Repository Analysis

**Generated**: 2024  
**Purpose**: Comprehensive analysis to support feature enhancements  
**Focus Areas**: PID Editor, PM Equipment, Component Architecture

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [PID Editor Deep Dive](#pid-editor-deep-dive)
4. [PM Equipment Deep Dive](#pm-equipment-deep-dive)
5. [Existing Components](#existing-components)
6. [Reusable UI Components](#reusable-ui-components)
7. [Build Infrastructure](#build-infrastructure)
8. [Module Integration](#module-integration)
9. [Enhancement Recommendations](#enhancement-recommendations)

---

## Technology Stack

### Core Framework
```json
{
  "frontend": "React 19 (latest)",
  "language": "TypeScript 5.7",
  "styling": "Tailwind CSS v4 + shadcn/ui v4",
  "build": "Vite 7 with SWC transpiler",
  "runtime": "Spark Runtime with KV API"
}
```

### Key Dependencies
| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| UI Components | Radix UI | Latest | Accessible primitives |
| Icons | Phosphor Icons | 2.1.7 | Icon system |
| Forms | React Hook Form + Zod | Latest | Form validation |
| Animation | Framer Motion | 12.6.2 | UI animations |
| Charts | Recharts + D3.js | Latest | Data visualization |
| State | React Hooks + Spark KV | - | Persistent storage |
| Utilities | uuid, date-fns, marked, xlsx | - | Common utilities |

### Build Tools
- **Vite**: Dev server with HMR, SWC transpilation
- **TypeScript**: Strict mode, ES2020 target
- **Tailwind**: PostCSS with v4 features, container queries
- **ESLint**: React hooks, refresh plugins

---

## Project Structure

```
/home/runner/work/maintenancepro-enter/maintenancepro-enter/
├── src/
│   ├── components/           # 60+ React components
│   │   ├── ui/              # 25+ shadcn/ui primitives
│   │   ├── wizards/         # 4 creation wizards
│   │   ├── PIDDrawingEditor.tsx        ⭐ PID Editor (300+ lines)
│   │   ├── PMEquipmentManagement.tsx   ⭐ PM Equipment (250+ lines)
│   │   ├── PMEquipmentDetailDialog.tsx ⭐ Equipment Details (150+ lines)
│   │   ├── ValveHierarchyView.tsx      ⭐ Hierarchy Tree (200+ lines)
│   │   ├── PartsInventory.tsx          # Parts management
│   │   ├── SOPLibrary.tsx              # Procedures
│   │   ├── FormsInspections.tsx        # Forms system
│   │   ├── WorkOrderDetail.tsx         # Task management
│   │   └── [40+ other components]
│   │
│   ├── lib/                  # Business logic & utilities
│   │   ├── types.ts          ⭐ 1,217 lines - ALL type definitions
│   │   ├── pid-utils.ts      ⭐ 400 lines - PID operations
│   │   ├── pm-equipment-utils.ts ⭐ 600 lines - PM generators
│   │   ├── excel-parser.ts   # Import/export engine
│   │   ├── auto-scheduler.ts # AI scheduling
│   │   ├── spark-hooks.ts    # KV state wrapper
│   │   └── [10+ other utilities]
│   │
│   ├── hooks/                # Custom React hooks
│   ├── App.tsx               # Main orchestrator (800+ lines)
│   ├── main.tsx              # Entry point + PWA
│   └── styles/               # CSS and themes
│
├── public/                   # Static assets
├── package.json              # Dependencies & scripts
├── vite.config.ts           # Build configuration
├── tsconfig.json            # TypeScript settings
├── tailwind.config.js       # Tailwind theme
└── [20+ documentation files]
```

### File Size Reference
| File | Lines | Critical Info |
|------|-------|---------------|
| `types.ts` | 1,217 | All TypeScript definitions |
| `App.tsx` | 800+ | Main app orchestration |
| `pm-equipment-utils.ts` | 600+ | PM sample data generators |
| `pid-utils.ts` | 400+ | PID drawing operations |
| `PIDDrawingEditor.tsx` | 300+ | Canvas-based editor |
| `PMEquipmentManagement.tsx` | 250+ | PM main container |

---

## PID Editor Deep Dive

### Location
- **Component**: `/src/components/PIDDrawingEditor.tsx` (300+ lines)
- **Utilities**: `/src/lib/pid-utils.ts` (400+ lines)
- **Types**: `/src/lib/types.ts` (lines 1042-1217)
- **Storage Key**: `pm-pid-drawings`

### Implementation Architecture

#### Rendering Technology
```typescript
// ❌ NOT SVG-based
// ✅ HTML5 Canvas 2D Context
const ctx = canvasRef.current.getContext('2d');

// Zoom/Pan Implementation
ctx.scale(zoomLevel, zoomLevel);
ctx.translate(panOffset.x, panOffset.y);

// Render Pipeline (per frame)
1. Clear canvas
2. Draw grid (if enabled)
3. Render connections (lines/pipes)
4. Render symbols (equipment)
5. Render annotations (text/labels)
6. Highlight selected elements
```

#### Key Features

**✅ Symbol Management**
- 20+ standard P&ID symbols
- Categories: Valves (10 types), Pumps, Motors, Vessels, Instruments
- Auto-generated tag numbering (V-001, P-001, TK-001)
- Properties: width, height, rotation (0-360°)
- Connection points (left/right/top/bottom)

**✅ Drawing Operations**
- Tools: Select, Pan, Symbol Placement, Line Drawing, Text Annotation
- Mouse interactions: drag-to-pan, click-to-place
- Zoom controls (+/- buttons, configurable levels)
- Grid system with snap-to-grid option

**✅ Connections**
- Line types: Process (black solid), Utility (blue solid), Signal (red dashed), Electrical (blue solid)
- Flow direction: Forward, Reverse, Bidirectional arrows
- Path routing: Orthogonal or straight-line with waypoints
- Auto-generated line numbers

**✅ Annotations**
- Text labels, dimensions, notes, callouts
- Configurable font, color, background
- Leader lines for callouts

### Data Model

```typescript
// Core Structure
PIDDrawing {
  drawing_id: UUID
  drawing_number: string
  drawing_title: string
  revision: number
  canvas_width: number        // Default: 1200px
  canvas_height: number       // Default: 800px
  grid_size: number          // Default: 20px
  symbols: PIDSymbol[]       // Placed equipment
  connections: PIDConnection[] // Pipes/lines
  annotations: PIDAnnotation[] // Text/labels
  metadata: PIDMetadata      // Discipline, status, approval
}

// Symbol Definition
PIDSymbol {
  symbol_id: UUID
  symbol_type: 'Valve' | 'Pump' | 'Motor' | 'Vessel' | 'Tank' | 
               'Instrument' | 'HeatExchanger' | 'Compressor' | ...
  x, y: number               // Canvas coordinates
  width, height: number
  rotation: number           // 0-360 degrees
  label: string              // Display name
  tag_number: string         // V-001, P-001, etc.
  asset_id?: string         // Link to PM Equipment
  properties: Record<string, any>
  connection_points: ConnectionPoint[]
  style: SymbolStyle
}

// Connection/Line
PIDConnection {
  connection_id: UUID
  line_type: 'Process' | 'Utility' | 'Signal' | 'Electrical'
  from_symbol_id: UUID
  to_symbol_id: UUID
  from_point_id: UUID
  to_point_id: UUID
  path_points: {x: number, y: number}[]  // Routing waypoints
  line_number: string                     // Auto-generated
  flow_direction: 'forward' | 'reverse' | 'bidirectional'
  line_size?: string
  material?: string
  service?: string
}
```

### Symbol Library (20+ Symbols)

```typescript
// Available in pid-utils.ts
Valves (10):
  - Gate, Ball, Control, Check, Globe
  - Butterfly, Safety Relief, Needle, Diaphragm, Plug

Pumps (2):
  - Centrifugal, Positive Displacement

Motors:
  - Electric Motor

Vessels (2):
  - Vertical Tank, Horizontal Vessel

Instruments (4):
  - Pressure Gauge, Temperature Element
  - Level Transmitter, Flow Indicator

Heat Transfer:
  - Heat Exchanger

Other:
  - Compressor, Accumulator, Relief Valve

Each symbol includes:
  - SVG path data for rendering
  - Default dimensions
  - Connection points with offsets
  - Default properties
  - Category classification
```

### Key Functions (pid-utils.ts)

```typescript
// Drawing Management
createBlankPIDDrawing(title: string, number: string): PIDDrawing
exportDrawingToJSON(drawing: PIDDrawing): string
importDrawingFromJSON(json: string): PIDDrawing

// Symbol Operations
addSymbolToDrawing(drawing, libraryItem, position): PIDDrawing
moveSymbol(drawing, symbolId, newPosition): PIDDrawing
rotateSymbol(drawing, symbolId, degrees): PIDDrawing
deleteSymbol(drawing, symbolId): PIDDrawing
updateSymbolProperties(drawing, symbolId, properties): PIDDrawing

// Connection Operations
connectSymbols(drawing, fromId, toId, lineType): PIDDrawing
updateConnectionPath(drawing, connectionId, waypoints): PIDDrawing
deleteConnection(drawing, connectionId): PIDDrawing

// Annotation Operations
addAnnotation(drawing, text, position, style): PIDDrawing
updateAnnotation(drawing, annotationId, updates): PIDDrawing
deleteAnnotation(drawing, annotationId): PIDDrawing

// Utilities
generateTagNumber(symbolType: string, index: number): string
  // Examples: V-001, P-003, TK-012, I-045
getSymbolAtPosition(drawing, x, y): PIDSymbol | null
getConnectionsForSymbol(drawing, symbolId): PIDConnection[]
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                 │
│ [Save] [Download] [Upload] │ [Select] [Pan] [Symbol] [Line] │
│ [Text] │ [Valve ▼] [Pump ▼] │ [+] [-] │ [Grid] [Snap]      │
└─────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────────────┐
│ Left     │ Canvas Area (1200x800px default)               │
│ Panel    │                                                 │
│          │ • Rendered grid                                 │
│ • Props  │ • Symbols with labels/tags                      │
│ • Meta   │ • Connections with flow arrows                  │
│ • Layers │ • Annotations                                   │
│ • List   │ • Selection highlight                           │
│          │                                                 │
│          │ Mouse: Click-to-place, Drag-to-pan             │
│          │ Zoom: Scale transform                           │
└──────────┴─────────────────────────────────────────────────┘
```

### Current Limitations
- ❌ No SVG export (canvas-based only)
- ❌ No DXF/DWG import/export
- ❌ No layer system
- ❌ No undo/redo history
- ❌ No collaborative editing
- ❌ No 3D or isometric views
- ❌ Limited print/PDF capabilities

---

## PM Equipment Deep Dive

### Location
- **Main Container**: `/src/components/PMEquipmentManagement.tsx` (250+ lines)
- **Detail Dialog**: `/src/components/PMEquipmentDetailDialog.tsx` (150+ lines)
- **Hierarchy View**: `/src/components/ValveHierarchyView.tsx` (200+ lines)
- **Utilities**: `/src/lib/pm-equipment-utils.ts` (600+ lines)
- **Types**: `/src/lib/types.ts` (lines 321-512)

### Supported Equipment Types (8 Categories)

#### 1. **Pump**
```typescript
Pump extends Asset {
  pump_type: 'Centrifugal' | 'Positive Displacement' | 
             'Submersible' | 'Diaphragm' | 'Peristaltic'
  flow_rate_gpm: number
  head_feet: number
  power_hp: number
  impeller_material: string
  casing_material: string
  seal_type: string
  bearing_type: string
  suction_size: string
  discharge_size: string
}
```

#### 2. **Valve** (with 6-level hierarchy)
```typescript
Valve extends Asset {
  valve_type: 'Gate' | 'Globe' | 'Ball' | 'Butterfly' | 
              'Check' | 'Plug' | 'Needle' | 'Diaphragm' | 
              'Safety Relief' | 'Control'
  valve_size: number          // inches
  actuation_type: 'Manual' | 'Pneumatic' | 'Electric' | 
                  'Hydraulic' | 'Solenoid'
  body_material: string
  seat_material: string
  pressure_rating: string
  temperature_rating: string
  flow_coefficient_cv: number
  position_indicator: boolean
  fail_position: 'Open' | 'Closed' | 'As-Is'
  valve_tag: string           // Identifier
  manifold_id: UUID           // Hierarchy link
}
```

#### 3. **Gearbox**
```typescript
Gearbox extends Asset {
  gearbox_type: 'Spur' | 'Helical' | 'Bevel' | 'Worm' | 'Planetary'
  gear_ratio: string
  input_rpm: number
  output_rpm: number
  torque_rating: number
  lubrication_type: string
  oil_capacity: number
  mounting_type: string
}
```

#### 4. **Electric Motor**
```typescript
ElectricMotor extends Asset {
  motor_type: 'AC Induction' | 'DC' | 'Synchronous' | 
              'Servo' | 'Stepper'
  horsepower: number
  voltage: number
  current_amps: number
  phase: '1-Phase' | '3-Phase'
  rpm: number
  frame_size: string
  enclosure_type: string
  efficiency_class: string
  service_factor: number
}
```

#### 5. **Pressure Gauge**
```typescript
PressureGauge extends Asset {
  gauge_type: 'Bourdon Tube' | 'Diaphragm' | 'Digital' | 'Capsule'
  pressure_range: {min: number, max: number}
  accuracy_percent: number
  connection_size: string
  dial_size: number
  pressure_unit: 'PSI' | 'Bar' | 'kPa' | 'MPa'
  calibration_due_date: Date
}
```

#### 6. **Thermometer**
```typescript
Thermometer extends Asset {
  thermometer_type: 'Bimetallic' | 'RTD' | 'Thermocouple' | 
                    'Digital' | 'Infrared'
  temperature_range: {min: number, max: number}
  accuracy: number
  probe_length: number
  connection_type: string
  temperature_unit: '°F' | '°C' | 'K'
  calibration_due_date: Date
}
```

#### 7. **Radar Transmitter**
```typescript
RadarTransmitter extends Asset {
  transmitter_type: 'Guided Wave' | 'Non-Contact' | 'Pulse'
  measurement_range: number
  frequency_ghz: number
  beam_angle: number
  process_connection: string
  output_signal: '4-20mA' | 'HART' | 'Profibus' | 'Modbus'
  display_type: string
  tank_application: string
}
```

#### 8. **Process Controller**
```typescript
ProcessController extends Asset {
  controller_type: 'Level' | 'Temperature' | 'Pressure' | 'Flow'
  control_algorithm: 'PID' | 'On-Off' | 'Fuzzy Logic' | 'Cascade'
  input_type: string
  output_type: string
  setpoint_range: {min: number, max: number}
  control_accuracy: number
  communication_protocol: string
  display_features: string[]
  alarm_outputs: number
}
```

### Base Asset Interface (All Equipment)

```typescript
Asset {
  // Identity
  asset_id: UUID
  asset_name: string
  asset_type: 'Pump' | 'Valve' | 'Motor' | 'Gearbox' | 'Instrument'
  
  // Status
  status: 'Operational' | 'Under Maintenance' | 
          'Out of Service' | 'Decommissioned'
  
  // Vendor Info
  manufacturer: string
  model: string
  serial_number: string
  
  // Lifecycle
  purchase_date: Date
  warranty_expiry: Date
  last_maintenance_date: Date
  next_maintenance_date: Date
  
  // Performance
  downtime_hours_ytd: number
  
  // Organization
  criticality_rating: 'Low' | 'Medium' | 'High' | 'Critical'
  assigned_employee_ids: string[]
  required_skill_ids: string[]
  
  // Links
  maintenance_task_ids: string[]
  linked_sop_ids: string[]
  
  // Monitoring
  meter_readings: MeterReading[]
  availability_windows: AvailabilityWindow[]
}
```

### Hierarchical Valve Organization (6 Levels)

```
ProcessSystem (Level 1)
  └─ tag: "SYS-001"
  └─ system_name: "Cooling Water System"
  └─ description: "Primary cooling water distribution"
      │
      └─ ProcessArea (Level 2)
          └─ tag: "AREA-01"
          └─ area_name: "North Cooling Tower"
          └─ parent_system_id: UUID
              │
              └─ ValveSection (Level 3)
                  └─ tag: "SEC-A1"
                  └─ section_name: "Distribution Header A1"
                  └─ parent_area_id: UUID
                      │
                      └─ ValveHeader (Level 4)
                          └─ tag: "HDR-MAIN-01"
                          └─ header_name: "Main Supply Header"
                          └─ parent_section_id: UUID
                              │
                              └─ ValveManifold (Level 5)
                                  └─ tag: "MFD-01-A"
                                  └─ manifold_name: "Distribution Manifold 1A"
                                  └─ parent_header_id: UUID
                                      │
                                      └─ Valve (Level 6) × multiple
                                          └─ valve_tag: "V-001", "V-002", ...
                                          └─ manifold_id: UUID

Example Full Path:
SYS-001 / AREA-01 / SEC-A1 / HDR-MAIN-01 / MFD-01-A / V-001
```

### Data Persistence (Spark KV Keys)

```typescript
// Equipment Storage
'pm-equipment-pumps': Pump[]
'pm-equipment-valves': Valve[]
'pm-equipment-motors': ElectricMotor[]
'pm-equipment-gearboxes': Gearbox[]
'pm-equipment-instruments': (PressureGauge | Thermometer | 
                              RadarTransmitter | ProcessController)[]

// Hierarchy Storage
'pm-valve-manifolds': ValveManifold[]
'pm-valve-headers': ValveHeader[]
'pm-valve-sections': ValveSection[]
'pm-process-areas': ProcessArea[]
'pm-process-systems': ProcessSystem[]

// Drawing Storage
'pm-pid-drawings': PIDDrawing[]
```

### UI Components

#### PMEquipmentManagement (Main Container)
```typescript
// Tab Structure
tabs: [
  "Equipment List",    // Searchable grid with filters
  "Valve Hierarchy",   // 6-level tree view
  "P&ID Drawings"      // Drawing list
]

// Features
- Search: Name, tag, serial number
- Filter: Equipment type dropdown
- Status badges: Operational, Under Maintenance, etc.
- Criticality indicators: Low, Medium, High, Critical
- Quick actions: View details, edit, delete
- Sample data loader: Populates test equipment
- Equipment count display
- Click row → Opens PMEquipmentDetailDialog
```

#### PMEquipmentDetailDialog (Modal)
```typescript
// Sections
1. Header
   - Asset name + type badge
   - Status + criticality badges
   
2. Basic Information
   - Serial number, model, manufacturer
   - Purchase date, warranty expiry
   
3. Operating Parameters
   - Equipment-specific specs (pump GPM, motor HP, etc.)
   - Capacity, pressure, temperature, flow rate
   - Efficiency, power consumption
   
4. Maintenance
   - Last maintenance date
   - Next maintenance date
   - Maintenance history list
   
5. Assignments
   - Assigned employees
   - Required skills
   - Related work orders
   
6. Meter Readings
   - Reading history chart
   - Latest values
```

#### ValveHierarchyView (Tree Component)
```typescript
// Features
- Expandable/collapsible tree nodes
- 6 organizational levels with icons
- Count indicators (e.g., "10 valves in manifold")
- Search/filter within hierarchy
- Click any level → View details
- Visual criticality indicators
- Equipment type icons

// Node Structure
System
  ├─ [+] Area 1 (12 valves)
  │   ├─ [+] Section A (5 valves)
  │   │   ├─ [+] Header Main (5 valves)
  │   │   │   └─ [+] Manifold 1 (5 valves)
  │   │   │       ├─ V-001 [High]
  │   │   │       ├─ V-002 [Medium]
  │   │   │       └─ ...
  │   └─ [+] Section B (7 valves)
  └─ [+] Area 2 (20 valves)
```

### Sample Data Generators (pm-equipment-utils.ts)

```typescript
// Available Functions
generateSamplePumps(count = 10): Pump[]
  - Random pump types (Centrifugal 60%, PD 30%, Submersible 10%)
  - Random manufacturers (Grundfos, Flowserve, ITT Goulds, KSB, Sulzer)
  - Calculated parameters based on type
  - 90% Operational, 10% Under Maintenance
  - Random criticality (50% Medium, 30% High, 15% Low, 5% Critical)

generateSampleValves(count = 100): Valve[]
  - 10 valve types evenly distributed
  - 5 actuation types
  - Random materials (SS316, CF8M, Bronze, etc.)
  - Size range: 0.5" to 24"
  - Auto-generated valve tags (V-001 to V-100)
  - Organized into hierarchies

generateSampleMotors(count = 20): ElectricMotor[]
  - AC Induction (60%), DC (20%), Synchronous (15%), Servo (5%)
  - Power range: 0.5 HP to 200 HP
  - Voltages: 120V, 240V, 480V, 600V
  - Calculated RPM, efficiency

generateSampleGearboxes(count = 15): Gearbox[]
  - 5 gearbox types
  - Gear ratios: 3:1 to 100:1
  - RPM calculations

generateSampleInstruments(count = 90): Instrument[]
  - 25% Pressure Gauges
  - 25% Thermometers
  - 25% Radar Transmitters
  - 25% Process Controllers
  - Random ranges and specifications
```

---

## Existing Components

### 1. Manuals/SOP Management

**Component**: `/src/components/SOPLibrary.tsx`  
**Storage**: `sop-library` KV key

```typescript
SOP {
  sop_id: UUID
  title: string
  revision: string
  effective_date: Date
  purpose: string
  scope: string
  procedure_summary: string
  loto_ppe_hazards: string
  pm_frequencies_included: MaintenanceFrequency[]
  records_required: string
  version_history: SOPVersion[]
  linked_work_orders: string[]
}

MaintenanceFrequency {
  task_name: string
  frequency_type: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 
                  'Semi-Annually' | 'Annually'
  duration_minutes: number
  required_skills: string[]
  tools_required: string[]
  parts_required: string[]
  safety_notes: string
}
```

**Features**:
- Search SOPs by ID, title, purpose
- Display SOP metadata (revision, effective date)
- Generate work orders from PM frequencies
- LOTO/PPE information display
- Revision tracking with version history
- Linked work orders reference

---

### 2. Tasks/Work Orders Management

**Components**:
- `/src/components/WorkOrderDetail.tsx` - Sheet-based detail view
- `/src/components/WorkOrderGrid.tsx` - Table grid with inline editing
- `/src/components/NewWorkOrderDialog.tsx` - Creation dialog
- `/src/components/WorkOrderTemplates.tsx` - Template management

**Storage**: `maintenance-work-orders` KV key

```typescript
WorkOrder {
  work_order_id: UUID
  work_order_number: string
  title: string
  description: string
  
  // Scheduling
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  scheduled_date: Date
  due_date: Date
  completed_date?: Date
  
  // Assignment
  assigned_technician: string
  assigned_employee_ids: string[]
  required_skills: Skill[]
  
  // Links
  required_asset_ids: string[]
  area_id?: string
  linked_sop_ids: string[]
  
  // Resources
  estimated_hours: number
  actual_hours?: number
  parts_required: string[]
  attachments: WorkOrderAttachment[]
  
  // Workflow
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  dependencies: string[]          // Other WO IDs
  verification_required: boolean
  verified_by?: string
  verified_at?: Date
}
```

**Features**:
- Create, read, update, delete operations
- Inline grid editing
- Status workflow (Scheduled → In Progress → Completed)
- Priority levels with overdue detection
- Technician assignment
- SOP linking
- Asset/area linking
- Skills matching
- Attachment management
- Recurring task support
- Dependency tracking
- Verification workflow
- Work order templates

---

### 3. Readings/Measurements

**Data Type**: Embedded in `Asset.meter_readings`

```typescript
MeterReading {
  reading_id: UUID
  meter_type: 'Hours' | 'Cycles' | 'Distance' | 'Production' | 'Custom'
  reading_value: number
  reading_unit: string
  recorded_at: Date
  recorded_by: string  // Employee ID
  notes?: string
}

// Usage in Asset
Asset {
  meter_readings: MeterReading[]
}
```

**Features**:
- Track hours, cycles, distance, production units
- Timestamp and user tracking
- Notes for context
- Integration with maintenance history
- Displayed in equipment detail dialog

---

### 4. Drawings (P&ID)

**Component**: `/src/components/PIDDrawingEditor.tsx`  
**Storage**: `pm-pid-drawings` KV key

```typescript
PIDDrawing {
  drawing_id: UUID
  drawing_number: string
  drawing_title: string
  revision: number
  canvas_width: number
  canvas_height: number
  symbols: PIDSymbol[]
  connections: PIDConnection[]
  annotations: PIDAnnotation[]
  metadata: {
    discipline: 'Process' | 'Mechanical' | 'Electrical' | 'Instrumentation'
    status: 'Draft' | 'In Review' | 'Approved'
    created_by: string
    created_at: Date
    approved_by?: string
    approved_at?: Date
  }
}
```

**Features**:
- Canvas-based editor (1200×800px default)
- 20+ symbol library
- Connection/line drawing
- Text annotations
- JSON export/import
- Revision tracking
- Approval workflow
- Link symbols to PM equipment (asset_id)

---

### 5. Photos/Images Management

**Data Types**:

```typescript
// Work Order Attachments
WorkOrderAttachment {
  attachment_id: UUID
  file_name: string
  file_type: 'photo' | 'document' | 'video' | 'pdf' | 'other'
  file_size_bytes: number
  file_url: string
  thumbnail_url?: string
  uploaded_by: string
  uploaded_at: Date
  description?: string
}

// Form Attachments
FormAttachment {
  attachment_id: UUID
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_by: string
  uploaded_at: Date
}
```

**Integration**:
- Attached to work orders
- Attached to form submissions
- File URLs are stored (no actual file storage in browser)
- Thumbnail support for photos
- Type filtering (photo, document, video, PDF)

**Current Limitation**:
- ❌ No backend file storage
- ❌ No cloud upload integration
- ✅ URL references only (would need backend API)

---

### 6. Forms & Inspections

**Components**:
- `/src/components/FormsInspections.tsx` - Main container
- `/src/components/FormTemplateCard.tsx` - Template display
- `/src/components/FormSubmissionList.tsx` - Submission list
- `/src/components/FormWizardDialog.tsx` - Template builder
- `/src/components/FormSubmissionDialog.tsx` - Form filler
- `/src/components/FormAnalyticsDashboard.tsx` - Analytics

**Storage**: `form-templates`, `form-submissions` KV keys

```typescript
FormTemplate {
  template_id: UUID
  template_name: string
  template_type: 'Job Hazard Analysis' | 'Equipment Inspection' | 
                 'Safety Inspection' | 'Quality Check' | 
                 'Environmental Audit' | 'Custom'
  category: string
  description: string
  sections: FormSection[]
  created_by: string
  created_at: Date
  is_active: boolean
}

FormSection {
  section_id: UUID
  section_title: string
  section_description?: string
  fields: FormField[]
  conditional_display?: {
    depends_on_field_id: UUID
    required_value: any
  }
}

FormField {
  field_id: UUID
  field_label: string
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'time' |
              'checkbox' | 'radio' | 'select' | 'signature' |
              'photo' | 'file' | 'rating' | 'hazard-level'
  required: boolean
  options?: string[]           // For select/radio
  default_value?: any
  validation_rules?: {
    min?: number
    max?: number
    pattern?: string
  }
  help_text?: string
}

FormSubmission {
  submission_id: UUID
  template_id: UUID
  submitted_by: string
  submitted_at: Date
  status: 'Draft' | 'In Progress' | 'Completed' | 'Approved'
  responses: Record<field_id, value>
  attachments: FormAttachment[]
  signatures: {
    employee_signature?: string  // Base64 image
    supervisor_signature?: string
  }
  work_order_id?: string
  asset_id?: string
  area_id?: string
  hazard_assessment?: {
    hazard_level: 'Low' | 'Medium' | 'High' | 'Extreme'
    control_measures: string[]
  }
}
```

**Features**:
- 7 premade templates (JHA, Inspection, Safety, Quality, Audit, Custom)
- Template builder with drag-and-drop sections
- 14 field types including signature, photo, hazard assessment
- Conditional field display logic
- Required field validation
- Submission workflow (Draft → In Progress → Completed → Approved)
- Hazard assessment (Low/Medium/High/Extreme)
- Photo/file attachments
- Digital signatures
- Approval workflows
- Form analytics dashboard (completion rates, response charts)

---

### 7. Parts Inventory

**Components**:
- `/src/components/PartsInventory.tsx` - Main grid
- `/src/components/PartDetailDialog.tsx` - Detail view
- `/src/components/AddPartDialog.tsx` - Create part
- `/src/components/PartTransactionDialog.tsx` - Inventory moves

**Storage**: `parts-inventory`, `part-transactions` KV keys

```typescript
Part {
  part_id: UUID
  part_number: string
  part_name: string
  description: string
  category: 'Electrical' | 'Mechanical' | 'Hydraulic' | 
            'Pneumatic' | 'Consumable' | 'Safety' | 'Tool'
  
  // Inventory
  quantity_on_hand: number
  min_stock_level: number
  reorder_quantity: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 
          'On Order' | 'Discontinued'
  
  // Vendor
  manufacturer: string
  vendor: string
  unit_cost: number
  
  // Links
  compatible_equipment_ids: string[]
  linked_sop_ids: string[]
  
  // Tracking
  location: string
  shelf_life_days?: number
  last_ordered_date?: Date
}

PartTransaction {
  transaction_id: UUID
  part_id: UUID
  transaction_type: 'Purchase' | 'Use' | 'Return' | 
                    'Adjustment' | 'Transfer'
  quantity: number
  transaction_date: Date
  performed_by: string
  notes?: string
  work_order_id?: string
  cost?: number
}

InventoryAlert {
  alert_id: UUID
  alert_type: 'Low Stock' | 'Out of Stock' | 'Expiring Soon' | 
              'Slow Moving' | 'Overstocked'
  part_id: UUID
  severity: 'Info' | 'Warning' | 'Critical'
  message: string
  created_at: Date
  acknowledged: boolean
}
```

**Features**:
- Part catalog with categories
- Inventory tracking (quantity, min stock, reorder point)
- Part status (In Stock, Low Stock, Out of Stock, On Order)
- Transaction history (Purchase, Use, Return, Adjustment, Transfer)
- Equipment linking
- SOP linking
- Inventory alerts (Low Stock, Out of Stock, Expiring, Slow Moving)
- Cost tracking (unit cost, total value)
- Usage analytics
- Vendor management
- Location tracking

---

## Reusable UI Components

### shadcn/ui Components (25+ in `/src/components/ui/`)

#### Layout & Structure
- `card.tsx` - Card container
- `sidebar.tsx` - Sidebar navigation
- `sheet.tsx` - Slide-out panel
- `dialog.tsx` - Modal dialog
- `drawer.tsx` - Drawer panel
- `tabs.tsx` - Tabbed interface
- `accordion.tsx` - Collapsible sections
- `resizable.tsx` - Resizable panels

#### Forms & Input
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line text
- `button.tsx` - Button with variants
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio buttons
- `select.tsx` - Dropdown select
- `toggle.tsx` - Toggle button
- `toggle-group.tsx` - Toggle group
- `form.tsx` - Form wrapper (React Hook Form)
- `label.tsx` - Form label
- `input-otp.tsx` - OTP input

#### Display
- `badge.tsx` - Badge/tag
- `alert.tsx` - Alert box
- `skeleton.tsx` - Loading skeleton
- `carousel.tsx` - Image carousel
- `avatar.tsx` - User avatar
- `progress.tsx` - Progress bar
- `slider.tsx` - Range slider
- `chart.tsx` - Chart wrapper (Recharts)

#### Navigation & Menus
- `dropdown-menu.tsx` - Dropdown menu
- `context-menu.tsx` - Right-click menu
- `navigation-menu.tsx` - Nav menu
- `menubar.tsx` - Menu bar
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Page pagination
- `command.tsx` - Command palette (Cmd+K)

#### Utilities
- `tooltip.tsx` - Tooltip
- `popover.tsx` - Popover
- `hover-card.tsx` - Hover card
- `scroll-area.tsx` - Scrollable area
- `separator.tsx` - Divider
- `confirm-dialog.tsx` - Confirmation dialog
- `aspect-ratio.tsx` - Aspect ratio container

**All components**:
- ✅ Fully accessible (WCAG AA)
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Dark mode ready
- ✅ Tailwind CSS styled
- ✅ TypeScript typed

---

### Custom Components

#### Notifications
- `NotificationBell.tsx` - Icon with unread count
- `NotificationCenter.tsx` - Full notification panel
- `NotificationToastManager.tsx` - Toast queue handler

#### User Interface
- `UserProfileMenu.tsx` - Profile dropdown
- `GlobalSearch.tsx` - Ctrl+K search modal
- `KeyboardShortcutsDialog.tsx` - Keyboard reference
- `SystemStatus.tsx` - Connectivity indicator

#### Onboarding
- `InteractiveTour.tsx` - Feature tour
- `PWAInstallBanner.tsx` - Install prompt
- `WelcomeDialog.tsx` - First-time greeting

#### Specialized
- `AnalyticsDashboard.tsx` - Charts & metrics
- `CustomizableDashboard.tsx` - Personalized widgets
- `CalendarView.tsx` - Month/week calendar
- `TimelineView.tsx` - Gantt chart
- `ResourceAllocationView.tsx` - Technician workload heatmap
- `CapacityPlanning.tsx` - Capacity configuration
- `SkillBasedRecommendations.tsx` - Technician suggestions

---

## Build Infrastructure

### Build Scripts (package.json)

```bash
# Development
npm run dev        # Vite dev server on port 5000 with --host

# Production
npm run build      # TypeScript check → Vite build

# Quality
npm run lint       # ESLint check

# Utilities
npm run preview    # Preview production build
npm run optimize   # Vite dependency pre-bundling
npm run kill       # Kill process on port 5000 (fuser -k 5000/tcp)
```

### Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sparkPlugin()
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5000,
    host: true
  }
});
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom theme extensions
    }
  },
  plugins: []
};
```

### Testing Infrastructure

**Current Status**: ❌ **No testing framework configured**

- No test runner (Jest, Vitest, etc.)
- No test files (*.test.ts, *.spec.ts)
- Only runtime error handling via `ErrorBoundary`

**Available for Testing**:
- ✅ TypeScript strict mode (compile-time type safety)
- ✅ ESLint (code quality)
- ✅ ErrorBoundary (runtime error catching)

**Recommendation**: Add Vitest + React Testing Library

### Development Workflow

1. **Hot Module Reloading**: Vite HMR for instant updates
2. **Error Handling**: React ErrorBoundary + ErrorFallback UI
3. **Linting**: ESLint with React hooks, refresh plugins
4. **Type Checking**: TypeScript strict mode
5. **PWA Support**: Service worker auto-registers on startup

---

## Module Integration

### State Management Architecture

```
App.tsx (Root Orchestrator)
│
├─ useKV<WorkOrder[]>('maintenance-work-orders')
├─ useKV<Employee[]>('employees')
├─ useKV<SOP[]>('sop-library')
├─ useKV<SkillMatrixEntry[]>('skill-matrix')
├─ useKV<FormTemplate[]>('form-templates')
├─ useKV<Part[]>('parts-inventory')
├─ useKV<UserProfile>('user-profile')
├─ useKV<Notification[]>('notifications')
└─ [15+ other Spark KV stores]
    │
    ├─→ PMEquipmentManagement
    │   ├─ useKV<Valve[]>('pm-equipment-valves')
    │   ├─ useKV<Pump[]>('pm-equipment-pumps')
    │   ├─ useKV<ElectricMotor[]>('pm-equipment-motors')
    │   ├─ useKV<Gearbox[]>('pm-equipment-gearboxes')
    │   ├─ useKV<Instrument[]>('pm-equipment-instruments')
    │   ├─ useKV<ValveManifold[]>('pm-valve-manifolds')
    │   ├─ useKV<ValveHeader[]>('pm-valve-headers')
    │   ├─ useKV<ValveSection[]>('pm-valve-sections')
    │   ├─ useKV<ProcessArea[]>('pm-process-areas')
    │   ├─ useKV<ProcessSystem[]>('pm-process-systems')
    │   └─ useKV<PIDDrawing[]>('pm-pid-drawings')
    │       │
    │       ├─→ PIDDrawingEditor (Canvas-based editor)
    │       ├─→ PMEquipmentDetailDialog (Equipment details)
    │       └─→ ValveHierarchyView (Tree view)
    │
    ├─→ WorkOrderGrid + WorkOrderDetail
    │   ├─ Employee assignment logic
    │   ├─ SOP linking
    │   ├─ Asset linking
    │   └─ Attachment handling
    │
    ├─→ FormsInspections
    │   ├─ FormWizardDialog (Template builder)
    │   ├─ FormSubmissionDialog (Form filler)
    │   └─ FormAnalyticsDashboard (Analytics)
    │
    ├─→ PartsInventory
    │   ├─ PartDetailDialog (Part details)
    │   ├─ AddPartDialog (Create parts)
    │   └─ PartTransactionDialog (Inventory moves)
    │
    ├─→ EmployeeManagement
    │   ├─ SkillMatrix entries
    │   ├─ Certifications
    │   └─ Schedule tracking
    │
    └─→ [15+ other modules]
```

### Data Persistence Flow

```
User Action (e.g., "Save Equipment")
    ↓
Component State Update
    setState(newEquipment)
    ↓
useKV Hook Triggered
    setEquipment([...equipment, newEquipment])
    ↓
Spark KV API Call
    await spark.kv.set('pm-equipment-pumps', equipment)
    ↓
Browser Storage (IndexedDB/LocalStorage)
    Persistent storage maintained
    ↓
Data Available on Reload
    useKV automatically restores state
```

### Tab-Based Routing (19 Tabs)

```typescript
// App.tsx activeTab state
const tabs = [
  'dashboard',        // CustomizableDashboard
  'tracking',         // WorkOrderGrid
  'timeline',         // TimelineView (Gantt)
  'resources',        // ResourceAllocationView
  'capacity',         // CapacityPlanning
  'calendar',         // CalendarView
  'employees',        // EmployeeManagement
  'assets',           // AssetsAreasManagement
  'pm-equipment',     // PMEquipmentManagement ⭐
  'parts',            // PartsInventory
  'forms',            // FormsInspections
  'certifications',   // CertificationReminders
  'sops',             // SOPLibrary
  'analytics',        // AnalyticsDashboard
  'predictive',       // PredictiveMaintenanceDashboard
  'database',         // DatabaseManagement
  'pm-schedules',     // PMScheduleManagement
  'templates'         // WorkOrderTemplates
];

// Navigation
setActiveTab('pm-equipment');  // No router, simple state
```

### Key Integration Points

#### 1. Work Order ↔ Asset/Equipment Link
```typescript
// Bidirectional relationship
WorkOrder {
  required_asset_ids: string[]  // Links to Equipment
  area_id: string | null
  linked_sop_ids: string[]
}

Asset {
  maintenance_task_ids: string[]  // Links to WorkOrders
  linked_sop_ids: string[]
}

// Usage
const workOrder = workOrders.find(wo => 
  wo.required_asset_ids.includes(pump.asset_id)
);
```

#### 2. Employee ↔ Skill Matching
```typescript
// SkillBasedRecommendations component
function matchTechnicianToWorkOrder(wo: WorkOrder) {
  const matches = employees
    .filter(emp => emp.is_active)
    .map(emp => {
      const skillMatch = calculateSkillScore(
        wo.required_skills,
        emp.skills
      );
      const availability = checkAvailability(
        emp.schedule,
        wo.scheduled_date
      );
      return { emp, score: skillMatch * availability };
    })
    .sort((a, b) => b.score - a.score);
  
  return matches[0]?.emp;
}
```

#### 3. Equipment ↔ Maintenance Schedule
```typescript
// PMScheduleManagement component
function generateRecurringWorkOrders(asset: Asset) {
  const sops = asset.linked_sop_ids
    .map(id => sops.find(s => s.sop_id === id));
  
  sops.forEach(sop => {
    sop.pm_frequencies_included.forEach(freq => {
      const workOrders = generateWorkOrdersForFrequency(
        freq,
        asset,
        startDate,
        endDate
      );
      workOrders.forEach(wo => {
        wo.required_asset_ids = [asset.asset_id];
        saveWorkOrder(wo);
      });
    });
  });
  
  // Update asset
  asset.last_maintenance_date = new Date();
  asset.next_maintenance_date = calculateNextDate(freq);
}
```

#### 4. Forms ↔ Work Orders
```typescript
FormSubmission {
  work_order_id?: string  // Optional link
  asset_id?: string       // Direct asset link
  area_id?: string        // Area context
}

// Usage: Create inspection from work order
function createInspectionForm(workOrder: WorkOrder) {
  const submission: FormSubmission = {
    template_id: 'equipment-inspection-template',
    work_order_id: workOrder.work_order_id,
    asset_id: workOrder.required_asset_ids[0],
    status: 'Draft'
  };
}
```

#### 5. Parts ↔ Work Orders
```typescript
// WorkOrderDetail component shows linked parts
function getRequiredParts(workOrder: WorkOrder): Part[] {
  const sopParts = workOrder.linked_sop_ids
    .flatMap(sopId => {
      const sop = sops.find(s => s.sop_id === sopId);
      return sop?.pm_frequencies_included
        .flatMap(freq => freq.parts_required) || [];
    });
  
  return sopParts.map(partName =>
    parts.find(p => p.part_name === partName)
  );
}
```

### Notification Flow

```
Auto-Scheduler / Skill Matcher
    ↓
Generate WorkOrderNotification[]
{
  notification_id: UUID,
  type: 'skill_matched_work_order',
  employee_id: string,
  work_order_id: string,
  match_score: number,
  message: "You are a 95% match for WO-12345"
}
    ↓
Store in notifications KV
await spark.kv.set('notifications', [...notifications, newNotif])
    ↓
NotificationCenter / NotificationBell
Display unread count, list notifications
    ↓
User accepts/rejects
if (accept) {
  workOrder.assigned_technician = employee_id;
  workOrder.status = 'Scheduled';
  notification.acknowledged = true;
}
```

### Data Import/Export Flow

```
Excel File Upload (ExcelImport.tsx)
    ↓
Parse Workbook
const workbook = XLSX.read(fileBuffer);
const workOrdersSheet = workbook.Sheets['Work Orders'];
const sopsSheet = workbook.Sheets['SOPs'];
const sparesSheet = workbook.Sheets['Spares/Labor'];
    ↓
Convert to JSON
const workOrdersData = XLSX.utils.sheet_to_json(workOrdersSheet);
    ↓
Validate with Zod
workOrdersData.forEach(row => {
  const validated = WorkOrderSchema.parse(row);
});
    ↓
Store in Spark KV
await spark.kv.set('maintenance-work-orders', workOrders);
await spark.kv.set('sop-library', sops);
await spark.kv.set('parts-inventory', parts);
    ↓
Generate Notifications
workOrders.forEach(wo => {
  if (wo.assigned_technician) {
    createNotification('new_work_order_assigned', ...);
  }
});
```

---

## Enhancement Recommendations

### High-Impact Enhancements

#### 1. Backend Integration
**Current**: All data in browser storage (Spark KV)  
**Enhancement**: REST/GraphQL API with PostgreSQL/MongoDB  
**Benefits**:
- Multi-user support
- Data backup and recovery
- Scalability
- Real-time sync
- File storage (S3/Azure Blob)

#### 2. Testing Framework
**Current**: No tests  
**Enhancement**: Vitest + React Testing Library  
**Coverage**:
- Unit tests for utilities (pid-utils, pm-equipment-utils)
- Component tests (PIDDrawingEditor, PMEquipmentManagement)
- Integration tests (work order → equipment flow)
- E2E tests with Playwright

#### 3. PID Editor Enhancements
**Current**: Canvas-based, basic features  
**Enhancements**:
- SVG export for scalability
- DXF/DWG import/export
- Layer system
- Undo/redo history (Command pattern)
- Collaborative editing (WebSocket)
- 3D isometric views
- Auto-routing for connections
- Symbol library expansion (50+ symbols)
- Advanced annotations (dimensions, callouts, tables)

#### 4. PM Equipment Features
**Current**: 8 equipment types, 6-level hierarchy  
**Enhancements**:
- Equipment genealogy (parent-child relationships)
- Predictive maintenance ML models
- Equipment health scoring
- Failure mode tracking (FMEA)
- Condition monitoring integration
- Criticality analysis (RCM)
- Equipment cost tracking (TCO)
- Asset performance metrics (OEE)

---

### Medium-Impact Enhancements

#### 5. Mobile Optimization
**Current**: Responsive but not optimized  
**Enhancement**: React Native mobile app  
**Features**:
- Offline-first architecture
- QR code scanning for asset identification
- Camera integration for photos
- GPS for location tracking
- Push notifications
- Digital signature capture
- Voice notes

#### 6. Reporting & Analytics
**Current**: Basic dashboard charts  
**Enhancement**: Advanced reporting engine  
**Features**:
- PDF generation (jsPDF, Puppeteer)
- Custom report builder
- Scheduled reports
- Email distribution
- Data export (Excel, CSV, JSON)
- KPI dashboards
- Trend analysis
- Benchmarking

#### 7. Photo/File Management
**Current**: URL references only  
**Enhancement**: Cloud storage integration  
**Features**:
- AWS S3 / Azure Blob upload
- Image optimization/compression
- Thumbnail generation
- OCR for text extraction
- Image annotation tools
- Version control
- Gallery view

#### 8. Advanced Scheduling
**Current**: Basic date assignment  
**Enhancement**: Intelligent scheduling  
**Features**:
- Resource leveling
- Constraint-based scheduling
- What-if scenarios
- Optimization algorithms
- Drag-and-drop calendar
- Recurring task automation
- Conflict detection

---

### Polish & UX Enhancements

#### 9. Internationalization (i18n)
**Enhancement**: Multi-language support  
**Libraries**: react-i18next  
**Languages**: English, Spanish, French, German, Chinese

#### 10. Advanced Visualizations
**Enhancement**: 3D equipment models  
**Libraries**: Three.js, React Three Fiber  
**Features**:
- 3D asset viewer
- Exploded view diagrams
- Interactive maintenance guides

#### 11. AI Assistant
**Enhancement**: Chatbot for maintenance guidance  
**Features**:
- Natural language queries
- Troubleshooting wizard
- SOP recommendations
- Spare parts lookup
- Maintenance history analysis

#### 12. Real-Time Collaboration
**Enhancement**: Multi-user editing  
**Technology**: WebSocket, Yjs CRDT  
**Features**:
- Live cursor tracking
- Conflict resolution
- Activity feed
- User presence indicators

---

## Summary

### Strengths
✅ Modern tech stack (React 19, TypeScript 5.7, Tailwind 4)  
✅ Comprehensive type system (1,217 lines)  
✅ 60+ well-organized components  
✅ Rich PM features (8 equipment types, 6-level hierarchy)  
✅ Canvas-based PID editor with 20+ symbols  
✅ Persistent browser storage (Spark KV)  
✅ PWA support (offline capability)  
✅ Accessibility (Radix UI)  

### Current Limitations
⚠️ No backend (all data in browser)  
⚠️ No testing framework  
⚠️ Canvas-only PID (no SVG/DXF export)  
⚠️ No file upload/storage  
⚠️ No multi-user collaboration  
⚠️ Limited mobile optimization  

### Enhancement Priorities
1. **Backend API + Database** (enables multi-user, file storage)
2. **Testing Framework** (quality assurance)
3. **PID Editor Improvements** (SVG export, layers, undo/redo)
4. **Advanced Equipment Features** (predictive maintenance, genealogy)
5. **Mobile App** (React Native)
6. **Reporting Engine** (PDF generation)

---

**This analysis provides a complete foundation for planning and implementing enhancements to the MaintenancePro CMMS application.**
