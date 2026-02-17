# P&ID Drawing Guide

## Introduction

Piping and Instrumentation Diagrams (P&IDs) are essential engineering documents that show the interconnection of process equipment and the instrumentation used to control the process. MaintenancePro's P&ID Editor provides a comprehensive tool for creating, editing, and maintaining these critical diagrams.

## What is a P&ID?

A P&ID is a detailed schematic illustration that shows:
- **Process Equipment**: Pumps, vessels, tanks, heat exchangers, compressors
- **Piping**: Process lines, utility lines, signal lines
- **Instrumentation**: Sensors, transmitters, controllers, indicators
- **Control Systems**: Control loops, interlocks, safety systems
- **Connections**: How equipment is interconnected
- **Flow Direction**: Direction of process flow through the system

## Getting Started

### Opening the P&ID Editor

1. Navigate to the **PM Equipment** tab
2. Click the **P&ID Drawings** sub-tab
3. Click **New Drawing** or **P&ID Editor** button

### Editor Interface Overview

The editor consists of three main sections:

**Left Sidebar - Tools & Symbol Library**
- Drawing tools (Select, Pan, Symbol, Line, Text)
- Complete symbol library organized by category

**Center Canvas**
- Main drawing area
- Grid for alignment (can be toggled)
- Zoom and pan controls

**Right Sidebar - Properties**
- Drawing metadata (title, number, status)
- Grid settings
- Selected object properties (future enhancement)

## Drawing Tools

### Select Tool (Cursor)

**Purpose**: Select and manipulate existing symbols

**Usage:**
1. Click the **Select** tool
2. Click on any symbol to select it
3. Selected symbols can be:
   - Moved (future enhancement)
   - Rotated (future enhancement)
   - Deleted (future enhancement)
   - Edited (properties in right panel)

**Keyboard Shortcut**: `Esc` to activate select tool

### Pan Tool (Hand)

**Purpose**: Navigate around large drawings

**Usage:**
1. Click the **Pan** tool
2. Click and drag to move the canvas view
3. Use mouse wheel to zoom in/out

**Keyboard Shortcut**: `Space + drag` (future enhancement)

### Symbol Tool (Plus)

**Purpose**: Add equipment symbols to the drawing

**Usage:**
1. Select a symbol from the library (left sidebar)
2. Click the **Symbol** tool (auto-selected when choosing a symbol)
3. Click on the canvas where you want to place it
4. Symbol appears with:
   - Default size from library
   - Auto-generated tag number
   - Connection points for piping

**Tips:**
- Snap to grid is enabled by default for clean alignment
- Symbols can be placed anywhere on the canvas
- Tag numbers increment automatically (V-001, V-002, etc.)

### Line Tool (Path)

**Purpose**: Connect symbols with pipes or signal lines

**Usage:**
1. Click the **Line** tool
2. Click on a connection point of the first symbol
3. Click on a connection point of the second symbol
4. A line is drawn connecting them with:
   - Automatic routing between points
   - Flow direction arrow
   - Line number assignment

**Line Types:**
- **Process**: Black solid line (material flow)
- **Utility**: Blue solid line (air, water, steam)
- **Signal**: Red dashed line (instrumentation signals)
- **Electrical**: Blue solid line (power connections)

**Tips:**
- Lines snap to connection points automatically
- Flow direction can be indicated with arrows
- Lines can have intermediate points (future enhancement)

### Text Tool (T)

**Purpose**: Add annotations, labels, and notes

**Usage:**
1. Click the **Text** tool
2. Click on the canvas where you want text
3. Enter your text in the prompt
4. Text appears with:
   - Standard font and size
   - Black color
   - Editable properties (future enhancement)

**Common Uses:**
- Equipment labels
- Line numbers
- Process notes
- Operating conditions
- Safety warnings

## Symbol Library

### Valves

#### Gate Valve
- **Symbol**: Rectangle with X
- **Use**: On/off service, full flow when open
- **Common Sizes**: 2", 3", 4", 6", 8"
- **Tag Prefix**: V-

#### Ball Valve
- **Symbol**: Circle in rectangle
- **Use**: Quick shutoff, tight seal
- **Common Sizes**: 0.5" to 12"
- **Tag Prefix**: V-

#### Globe Valve
- **Symbol**: Globe shape
- **Use**: Throttling service, flow regulation
- **Tag Prefix**: V-

#### Check Valve
- **Symbol**: Triangle pointing flow direction
- **Use**: Prevent backflow
- **Tag Prefix**: V-

#### Control Valve
- **Symbol**: Diamond with actuator symbol
- **Use**: Automated flow control
- **Tag Prefix**: FCV-, PCV-, LCV-, TCV-
- **Variants**: Fail-open (FO), Fail-closed (FC)

### Pumps

#### Centrifugal Pump
- **Symbol**: Circle with impeller lines
- **Use**: General purpose liquid transfer
- **Tag Prefix**: P-
- **Connection Points**: Suction (bottom/side), Discharge (top/side)

#### Positive Displacement Pump
- **Symbol**: Circle with inner circle
- **Use**: High-pressure, viscous fluids
- **Tag Prefix**: P-

### Vessels & Tanks

#### Vertical Tank
- **Symbol**: Vertical rectangle
- **Use**: Storage, day tanks, surge vessels
- **Tag Prefix**: TK-, V-
- **Shows**: Level indication, nozzles

#### Horizontal Vessel
- **Symbol**: Horizontal ellipse
- **Use**: Pressure vessels, reactors, separators
- **Tag Prefix**: V-, R-

### Instruments

#### Pressure Gauge (Local)
- **Symbol**: Circle with PI
- **Use**: Local pressure indication
- **Tag**: PI-xxx (Pressure Indicator)
- **Mounting**: Typically on equipment or pipe

#### Pressure Transmitter
- **Symbol**: Circle with PT
- **Use**: Remote pressure measurement, control
- **Tag**: PT-xxx (Pressure Transmitter)
- **Output**: 4-20mA, HART, etc.

#### Temperature Element
- **Symbol**: Circle with TE or TT
- **Use**: Temperature measurement
- **Tag**: TE-xxx (Element), TT-xxx (Transmitter)
- **Types**: RTD, Thermocouple

#### Level Transmitter
- **Symbol**: Circle with LT
- **Use**: Tank/vessel level measurement
- **Tag**: LT-xxx (Level Transmitter)
- **Types**: Radar, ultrasonic, differential pressure

#### Flow Transmitter
- **Symbol**: Circle with FT, often with flow element
- **Use**: Flow measurement and control
- **Tag**: FT-xxx (Flow Transmitter)

### Motors

#### Electric Motor
- **Symbol**: Circle with M
- **Tag**: M-xxx
- **Shows**: Power connection, driven equipment
- **Typical**: 1-100+ HP

### Heat Exchangers

#### Shell and Tube
- **Symbol**: Rectangle with tube bundle lines
- **Tag**: E-xxx
- **Shows**: Hot side, cold side, flow direction

## Drawing Workflow

### Creating a New Drawing

1. **Set Up Drawing**
   - Enter drawing title (e.g., "Cooling Water System")
   - Assign drawing number (e.g., "PID-001")
   - Set initial status to "Draft"
   - Choose appropriate scale (typically "NTS" - Not To Scale)

2. **Add Major Equipment**
   - Start with largest equipment (tanks, vessels)
   - Position centrally with good spacing
   - Add pumps, compressors, heat exchangers
   - Leave room for piping and instrumentation

3. **Add Piping**
   - Connect equipment with process lines
   - Show main process flow clearly
   - Add utility connections (steam, water, air)
   - Include bypass lines if applicable

4. **Add Valves**
   - Isolation valves on equipment
   - Control valves in process lines
   - Check valves where needed
   - Safety relief valves

5. **Add Instrumentation**
   - Pressure gauges/transmitters at key points
   - Temperature measurement
   - Level indication on vessels
   - Flow measurement in main lines

6. **Add Control Loops** (Future Enhancement)
   - Connect transmitters to controllers
   - Show control valve outputs
   - Indicate setpoints

7. **Add Annotations**
   - Equipment names and descriptions
   - Line numbers and sizes
   - Operating conditions
   - Material specifications
   - Safety notes

8. **Review and Save**
   - Check for completeness
   - Verify all connections
   - Save the drawing
   - Export backup

### Drawing Standards

**Symbol Size:**
- Major equipment: 80x80 to 120x120 pixels
- Small equipment: 40x40 to 60x60 pixels
- Instruments: 40x40 pixels (standard)

**Spacing:**
- Minimum 40 pixels between symbols
- Use grid spacing (20 pixel grid) for alignment
- Leave clear paths for piping

**Line Widths:**
- Process lines: 3 pixels
- Utility lines: 2 pixels
- Signal lines: 2 pixels (dashed)

**Text:**
- Equipment tags: Bold, 10-12pt
- Annotations: Regular, 10pt
- Line numbers: Regular, 8-10pt

**Colors:**
- Process: Black
- Utilities: Blue
- Signals: Red
- Safety: Yellow/Red (future enhancement)

## Tag Numbering Standards

### Equipment Tags

Format: `[TYPE]-[NUMBER]`

**Prefixes:**
- **P**: Pump (P-001, P-002)
- **V**: Valve, Vessel (V-001, TK-001)
- **E**: Heat Exchanger (E-001)
- **K**: Compressor (K-001)
- **M**: Motor (M-001)
- **T**: Tank (TK-001)

### Instrument Tags

Format: `[FUNCTION][FUNCTION]-[NUMBER]`

**First Letter (Measured Variable):**
- **P**: Pressure
- **T**: Temperature
- **L**: Level
- **F**: Flow
- **A**: Analysis (pH, conductivity, etc.)

**Second Letter (Function):**
- **I**: Indicator (local)
- **T**: Transmitter (signal)
- **C**: Controller
- **S**: Switch
- **A**: Alarm
- **E**: Element (sensor)

**Examples:**
- PI-001: Pressure Indicator (gauge)
- PT-001: Pressure Transmitter
- TT-001: Temperature Transmitter
- LT-001: Level Transmitter
- FT-001: Flow Transmitter
- PCV-001: Pressure Control Valve
- TIC-001: Temperature Indicator Controller

### Line Numbers

Format: `[DRAWING]-L[NUMBER]`

Example: `PID-001-L001`, `PID-001-L002`

Or by service: `CW-001` (Cooling Water), `ST-001` (Steam)

## Zoom and Navigation

### Zoom Controls

- **Zoom In**: Click `+` button or mouse wheel up
- **Zoom Out**: Click `-` button or mouse wheel down
- **Zoom Range**: 30% to 300%
- **Zoom Display**: Shows current zoom percentage

### Pan Controls

- **Pan Tool**: Select Hand tool and drag canvas
- **Zoom to Fit** (Future): Show entire drawing
- **Reset View** (Future): Return to 100% zoom, centered

## Grid and Alignment

### Grid Settings

- **Show Grid**: Toggle grid visibility
- **Grid Size**: 20 pixels (standard)
- **Snap to Grid**: Automatically align symbols and points
- **Benefits**: Clean, professional appearance

### Alignment Tips

- Use grid for major equipment placement
- Align similar equipment vertically or horizontally
- Keep piping orthogonal (horizontal/vertical)
- Use consistent spacing between parallel lines

## Saving and Exporting

### Save Drawing

1. Click **Save** button in toolbar
2. Drawing is saved to database
3. Updated timestamp is recorded
4. Changes are immediately available
5. Drawing appears in P&ID Drawings list

### Export Options

**JSON Export:**
1. Click **Export** button
2. Drawing data saved as JSON file
3. Includes:
   - All symbols and their properties
   - All connections
   - Annotations
   - Drawing metadata
4. Can be imported later (future enhancement)

**Future Export Formats:**
- PDF for printing and distribution
- PNG/SVG for documentation
- DWG/DXF for CAD integration

## Drawing Management

### Drawing Properties

**Required Fields:**
- Drawing Title
- Drawing Number
- Revision Number

**Metadata:**
- Discipline (Process, Mechanical, Electrical, etc.)
- Unit Number
- Sheet Number / Total Sheets
- Scale
- Status (Draft, In Review, Approved, Superseded, Archived)
- Created By / Created Date
- Last Modified By / Modified Date

**Optional Fields:**
- Project Name
- Area ID (link to process area)
- System ID (link to process system)
- Approval Information
- Tags
- References to other drawings

### Revision Control

**Workflow:**
1. New drawing starts as Revision 1
2. Changes increment revision number
3. Track changes in version history (future)
4. Maintain approval records
5. Superseded drawings are archived

**Best Practices:**
- Document major changes in notes
- Update revision date
- Keep superseded revisions for reference
- Require approval for final revisions

## Advanced Features (Future)

### Planned Enhancements

- **Copy/Paste**: Duplicate symbols and groups
- **Undo/Redo**: Step backward/forward through changes
- **Layers**: Separate equipment, piping, instrumentation
- **Templates**: Start from standard layouts
- **Collaboration**: Multi-user editing
- **Symbol Editor**: Create custom symbols
- **Auto-routing**: Intelligent pipe routing
- **Validation**: Check for errors and omissions
- **Reports**: Equipment lists, valve lists, instrument lists
- **Integration**: Link symbols to equipment database
- **Import**: DWG, DXF, other P&ID formats

## Best Practices

### Before Starting

- Review existing P&IDs for consistency
- Understand the process thoroughly
- Gather equipment specifications
- Plan the layout on paper first

### During Drawing

- Work from general to specific
- Use standard symbols consistently
- Maintain clear flow paths
- Label everything clearly
- Save frequently
- Export backups periodically

### After Completion

- Review for completeness
- Check tag numbering sequence
- Verify all connections
- Get technical review
- Update status to "In Review"
- Archive upon approval

### Maintenance

- Update drawings when equipment changes
- Increment revision for major changes
- Keep drawings current with field
- Regular audits for accuracy
- Archive obsolete drawings

## Troubleshooting

### Can't Place Symbol

**Check:**
- Symbol is selected in library
- Symbol tool is active
- Clicking within canvas bounds

### Lines Won't Connect

**Check:**
- Both symbols have connection points
- Line tool is selected
- Clicking directly on connection points

### Drawing Not Saving

**Check:**
- Drawing has title and number
- Drawing has at least one element
- No browser console errors

### Zoom Issues

**Reset:**
- Use zoom buttons to adjust
- Reload page if zoom stuck
- Clear browser cache if persistent

## Keyboard Shortcuts (Future)

- `Ctrl+S`: Save drawing
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+C`: Copy selected
- `Ctrl+V`: Paste
- `Delete`: Delete selected
- `Esc`: Select tool
- `Space+Drag`: Pan
- `+/-`: Zoom in/out

## Support

For P&ID Drawing questions:
1. Review this guide
2. Check PM Equipment Guide
3. Consult the main README
4. Review symbol standards documentation
