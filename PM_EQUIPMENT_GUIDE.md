# PM Equipment Management Guide

## Overview

The PM Equipment Management section is a comprehensive system for tracking and maintaining industrial process equipment. It provides specialized tools for managing:

- **Pumps** - Centrifugal, positive displacement, and specialized pump types
- **Valves** - Thousands of valves organized in hierarchical structures
- **Electric Motors** - AC/DC motors with detailed specifications
- **Gearboxes** - Speed reduction and transmission equipment
- **Instrumentation** - Pressure gauges, thermometers, level transmitters, and process controllers
- **P&ID Drawings** - Piping and Instrumentation Diagrams for visual documentation

## Key Features

### 1. Equipment Inventory Management

Track comprehensive details for each piece of equipment:

- **Asset Information**: Manufacturer, model, serial number, purchase date
- **Operational Data**: Status, criticality rating, operating parameters
- **Maintenance History**: Last maintenance, next scheduled maintenance, downtime tracking
- **Technical Specifications**: Equipment-specific parameters (flow rates, pressures, temperatures, etc.)

### 2. Hierarchical Valve Organization

Valves are organized in a six-level hierarchy for complex industrial systems:

```
System (Plant-wide)
  └─ Process Area (Production units)
      └─ Section (Facility zones)
          └─ Header (Distribution lines)
              └─ Manifold (Valve groups)
                  └─ Valve (Individual components)
```

**Benefits:**
- Track thousands of valves efficiently
- Organize by location and function
- Quick navigation through expandable tree view
- Understand system dependencies

### 3. P&ID Drawing Editor

Create and maintain Piping and Instrumentation Diagrams directly in the application:

**Drawing Tools:**
- **Select Tool**: Click and select symbols for editing
- **Pan Tool**: Navigate large drawings
- **Symbol Tool**: Add equipment symbols from the library
- **Line Tool**: Connect equipment with pipes and signal lines
- **Text Tool**: Add annotations and labels

**Symbol Library Includes:**
- Valves (Gate, Ball, Globe, Check, Control, etc.)
- Pumps (Centrifugal, Positive Displacement)
- Vessels and Tanks
- Instruments (Pressure, Temperature, Level, Flow)
- Motors and Compressors
- Heat Exchangers

**Drawing Features:**
- Grid and snap-to-grid for alignment
- Zoom controls (30% - 300%)
- Export to JSON format
- Drawing metadata (status, revision, approvals)
- Multiple drawing management

## Getting Started

### Loading Sample Data

1. Navigate to the **PM Equipment** tab
2. Click **Load Sample Data** button
3. Sample equipment will be populated:
   - 10 Pumps
   - 100 Valves (organized in hierarchy)
   - 20 Electric Motors
   - 15 Gearboxes
   - 90 Instruments (gauges, transmitters, controllers)

### Equipment List View

**Search and Filter:**
- Use the search bar to find equipment by name, manufacturer, model, or serial number
- Filter by equipment type using the type buttons
- View stats cards showing equipment counts by category

**Equipment Table:**
- **Tag/Name**: Equipment identifier
- **Type**: PM equipment category
- **Manufacturer**: Equipment manufacturer
- **Model**: Model number
- **Status**: Operational, Under Maintenance, Out of Service, Decommissioned
- **Criticality**: Low, Medium, High, Critical
- **Next Maintenance**: Scheduled maintenance date

**Actions:**
- Click any row to view detailed equipment information
- View equipment-specific specifications
- Check maintenance history and schedule

### Valve Hierarchy View

1. Switch to the **Valve Hierarchy** tab
2. Click **Expand All** to see the complete hierarchy
3. Navigate through the tree:
   - System level (top) - Critical infrastructure
   - Process Area - Operating units
   - Section - Facility zones
   - Header - Distribution piping
   - Manifold - Valve groups
   - Valve level (bottom) - Individual valves
4. Click any valve to see detailed information

### Creating P&ID Drawings

1. Navigate to the **P&ID Drawings** tab
2. Click **New Drawing** or the **P&ID Editor** button
3. Set drawing properties:
   - Title
   - Drawing number
   - Status (Draft, In Review, Approved, etc.)
4. Add symbols:
   - Select a symbol from the library (left sidebar)
   - Click **Symbol** tool
   - Click on canvas to place
5. Connect equipment:
   - Select **Line** tool
   - Click on connection points to create pipes
6. Add annotations:
   - Select **Text** tool
   - Click where you want text
   - Enter your annotation
7. Save the drawing:
   - Click **Save** to store in the database
   - Click **Export** to download JSON

## Equipment Types

### Pumps

**Tracked Information:**
- Pump type (Centrifugal, Positive Displacement, Submersible, Diaphragm, Peristaltic)
- Flow rate (GPM)
- Head (feet)
- Power (HP)
- Materials (impeller, casing)
- Seal and bearing types
- Connection sizes (suction/discharge)

**Use Cases:**
- Process fluid transfer
- Coolant circulation
- Chemical dosing
- Wastewater handling

### Valves

**Tracked Information:**
- Valve type (Gate, Globe, Ball, Butterfly, Check, Control, etc.)
- Size (inches)
- Actuation (Manual, Pneumatic, Electric, Hydraulic, Solenoid)
- Materials (body, seat)
- Pressure and temperature ratings
- Flow coefficient (Cv)
- Fail position (for automated valves)
- Hierarchical location

**Use Cases:**
- Flow control
- Isolation
- Pressure regulation
- Safety shutoff

### Electric Motors

**Tracked Information:**
- Motor type (AC Induction, DC, Synchronous, Servo, Stepper)
- Horsepower
- Voltage and current
- Phase (1-phase, 3-phase)
- RPM
- Frame size
- Enclosure type (TEFC, ODP, Explosion Proof)
- Efficiency class

**Use Cases:**
- Pump drivers
- Compressor power
- Fan and blower operation
- Conveyor systems

### Gearboxes

**Tracked Information:**
- Gearbox type (Spur, Helical, Bevel, Worm, Planetary)
- Gear ratio
- Input/output RPM
- Torque rating
- Lubrication type
- Oil capacity
- Mounting type

**Use Cases:**
- Speed reduction
- Torque multiplication
- Direction change
- Power transmission

### Instrumentation

#### Pressure Gauges
- Gauge type (Bourdon Tube, Diaphragm, Digital, Capsule)
- Pressure range
- Accuracy
- Connection size
- Calibration tracking

#### Thermometers
- Type (Bimetallic, RTD, Thermocouple, Digital, Infrared)
- Temperature range
- Accuracy
- Probe length
- Calibration tracking

#### Radar Transmitters
- Type (Guided Wave, Non-Contact, Pulse)
- Measurement range
- Frequency (GHz)
- Output signal (4-20mA, HART, Profibus, Modbus)
- Tank application

#### Process Controllers
- Controller type (Level, Temperature, Pressure, Flow)
- Control algorithm (PID, On-Off, Fuzzy Logic, Cascade)
- Input/output types
- Setpoint range
- Communication protocol
- Alarm outputs

## Maintenance Integration

### Linking to Work Orders

PM Equipment can be linked to maintenance work orders:

1. Equipment maintenance history is tracked
2. Next maintenance dates are scheduled
3. Downtime is accumulated year-to-date
4. Critical equipment is prioritized

### Criticality Ratings

Equipment criticality affects maintenance priority:

- **Critical**: Essential to operations, immediate response required
- **High**: Important equipment, priority maintenance
- **Medium**: Standard equipment, normal scheduling
- **Low**: Non-critical, deferred maintenance acceptable

### Status Tracking

- **Operational**: Equipment is running normally
- **Under Maintenance**: Currently being serviced
- **Out of Service**: Not operational, scheduled for repair
- **Decommissioned**: Retired from service

## Best Practices

### Equipment Naming

Use consistent tag numbering:
- Pumps: P-001, P-002, etc.
- Valves: V-0001, V-0002, etc.
- Motors: M-001, M-002, etc.
- Instruments: PG-001 (pressure gauge), TT-001 (temperature transmitter), etc.

### Valve Hierarchy

- Keep hierarchy depth consistent
- Use descriptive names for manifolds, headers, and sections
- Document valve locations in P&IDs
- Regular audits to ensure accuracy

### P&ID Drawings

- Start with a template for consistency
- Use standard symbols from the library
- Include drawing number, revision, and approval information
- Keep drawings up-to-date with field changes
- Export backups regularly

### Data Maintenance

- Update maintenance dates after service
- Record downtime accurately
- Keep calibration dates current for instruments
- Review and update criticality ratings periodically
- Archive decommissioned equipment rather than deleting

## Troubleshooting

### No Equipment Showing

**Solution**: Click "Load Sample Data" to populate the system with example equipment.

### Valve Hierarchy Empty

**Solution**: Load sample data, which creates a complete hierarchy structure.

### P&ID Drawing Won't Save

**Solution**: Ensure drawing has a title and drawing number. Check that the drawing has at least one symbol or annotation.

### Equipment Search Not Working

**Solution**: Clear search filter and check equipment type filter. Ensure equipment exists in the database.

## Technical Notes

### Data Storage

All PM equipment data is stored in the Spark KV store:
- `pm-equipment-pumps`: Pump inventory
- `pm-equipment-valves`: Valve inventory
- `pm-equipment-motors`: Motor inventory
- `pm-equipment-gearboxes`: Gearbox inventory
- `pm-equipment-instruments`: Instrument inventory
- `pm-valve-manifolds`: Manifold hierarchy
- `pm-valve-headers`: Header hierarchy
- `pm-valve-sections`: Section hierarchy
- `pm-process-areas`: Process area hierarchy
- `pm-process-systems`: System hierarchy
- `pm-pid-drawings`: P&ID drawing collection

### Performance

The system can efficiently manage:
- Thousands of valves in hierarchical structures
- Hundreds of pumps, motors, and other equipment
- Multiple P&ID drawings with complex symbol arrangements
- Real-time search and filtering across all equipment

### Future Enhancements

Planned improvements:
- Link equipment to specific areas and locations
- Integration with global search
- Equipment QR code generation for mobile scanning
- Photo attachments for equipment
- Advanced P&ID features (layers, templates, collaboration)
- Import/export to industry-standard formats (DWG, PDF)
- Automated P&ID generation from equipment lists

## Support

For questions or issues with PM Equipment Management:
1. Review this guide thoroughly
2. Check the main README for general application information
3. Consult the P&ID Drawing Guide for detailed drawing instructions
4. Review equipment type definitions in the codebase types documentation
