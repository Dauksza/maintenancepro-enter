import { v4 as uuidv4 } from 'uuid'
import type {
  PIDDrawing,
  PIDSymbol,
  PIDConnection,
  PIDAnnotation,
  PIDTemplate,
  SymbolLibraryItem,
  PIDSymbolType,
  ConnectionPoint
} from './types'

// Symbol library with standard P&ID symbols
export const standardSymbolLibrary: SymbolLibraryItem[] = [
  // ── Valves ───────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Gate Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Two triangles tip-to-tip (bowtie / hourglass) — ISO 10628-2 gate valve
    svg_path: 'M 0,20 L 20,6 L 20,34 Z M 40,20 L 20,6 L 20,34 Z',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', material: 'CS', pressure_rating: '150#' },
    description: 'Gate valve – full-bore on/off isolation',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Ball Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Circle (ball body) with short pipe stubs + diagonal bore-open line
    svg_path: 'M 0,20 L 8,20 M 32,20 L 40,20 M 20,20 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 11,29 L 29,11',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', material: 'SS', pressure_rating: '300#' },
    description: 'Ball valve – quick quarter-turn shutoff',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Globe Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Bowtie with a small globe (circle) overlaid at the pinch-point — visually distinct from gate valve
    svg_path: 'M 0,20 L 20,6 L 20,34 Z M 40,20 L 20,6 L 20,34 Z M 20,20 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', material: 'CS', pressure_rating: '150#' },
    description: 'Globe valve – throttling / flow regulation',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Butterfly Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Circle body with central shaft line + two curved disc wings
    svg_path: 'M 0,20 L 40,20 M 20,20 m -14,0 a 14,14 0 1,0 28,0 a 14,14 0 1,0 -28,0 M 20,7 L 20,33 M 9,13 Q 20,20 9,27 M 31,13 Q 20,20 31,27',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '4"', material: 'CS', pressure_rating: '150#' },
    description: 'Butterfly valve – low-pressure on/off or throttling',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Needle Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Bowtie with a tapered needle/stem pointing down into the body
    svg_path: 'M 0,20 L 20,8 L 20,32 Z M 40,20 L 20,8 L 20,32 Z M 20,8 L 20,0 M 17,3 L 20,8 L 23,3',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '0.5"', material: 'SS', cv: '0.1' },
    description: 'Needle valve – precise fine-flow metering',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Control Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Bowtie body + stem + rectangular diaphragm-actuator cap at top
    svg_path: 'M 0,20 L 20,10 L 20,30 Z M 40,20 L 20,10 L 20,30 Z M 20,10 L 20,4 M 10,4 L 30,4 L 30,0 L 10,0 Z',
    default_width: 40,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '3"', cv: '50', fail_position: 'FC' },
    description: 'Control valve – automated flow / pressure regulation',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Check Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Triangle (disc) pointing in flow direction + vertical backstop / seat line
    svg_path: 'M 0,20 L 40,20 M 10,8 L 28,20 L 10,32 Z M 28,8 L 28,32',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', type: 'Swing' },
    description: 'Check valve – prevents reverse flow',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Safety Relief Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    // Bowtie + stem + continuous spring-coil zigzag at top indicating spring-loaded mechanism
    svg_path: 'M 0,26 L 20,16 L 20,36 Z M 40,26 L 20,16 L 20,36 Z M 20,16 L 20,12 L 14,10 L 26,7 L 14,4 L 26,1 L 20,0',
    default_width: 40,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 26, direction: 'left' },
      { x_offset: 40, y_offset: 26, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '1"', set_pressure: '150 PSI', type: 'Spring-Loaded' },
    description: 'Safety / pressure relief valve – overpressure protection',
    is_standard: true
  },
  // ── Pumps ────────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Centrifugal Pump',
    symbol_type: 'Pump',
    category: 'Pumps',
    // Circle casing + three curved impeller vanes radiating from center
    svg_path: 'M 30,30 m -25,0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0 M 5,30 L 30,30 M 55,30 L 30,30 M 30,30 L 40,18 M 30,30 L 20,20 M 30,30 L 22,44',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 5, y_offset: 30, direction: 'left' },
      { x_offset: 55, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'Centrifugal', power: '10 HP', flow: '100 GPM' },
    description: 'Centrifugal pump – general liquid transfer',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Positive Displacement Pump',
    symbol_type: 'Pump',
    category: 'Pumps',
    // Circle casing + multiple straight reciprocating vanes (vs curved in centrifugal)
    svg_path: 'M 30,30 m -25,0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0 M 5,30 L 30,30 M 55,30 L 30,30 M 22,18 L 22,42 M 30,18 L 30,42 M 38,18 L 38,42',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 5, y_offset: 30, direction: 'left' },
      { x_offset: 55, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'PD', power: '5 HP', flow: '50 GPM' },
    description: 'Positive displacement pump – high-pressure/viscous fluids',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Compressor',
    symbol_type: 'Compressor',
    category: 'Pumps',
    // Circle casing + large triangle pointing toward discharge (compression direction)
    svg_path: 'M 30,30 m -25,0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0 M 5,30 L 30,30 M 55,30 L 30,30 M 16,20 L 16,40 L 44,30 Z',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 5, y_offset: 30, direction: 'left' },
      { x_offset: 55, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'Centrifugal', power: '50 HP', cfm: '500', pressure: '150 PSI' },
    description: 'Gas compressor – pressure / flow of compressible fluids',
    is_standard: true
  },
  // ── Vessels and Tanks ────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Vertical Tank',
    symbol_type: 'Tank',
    category: 'Vessels',
    // Vertical cylinder with elliptical top and bottom heads + level mark
    svg_path: 'M 10,10 L 50,10 L 50,72 L 10,72 Z M 10,10 Q 30,4 50,10 M 10,72 Q 30,78 50,72 M 10,50 L 50,50',
    default_width: 60,
    default_height: 80,
    connection_points: [
      { x_offset: 30, y_offset: 80, direction: 'bottom' },
      { x_offset: 30, y_offset: 10, direction: 'top' },
      { x_offset: 10, y_offset: 40, direction: 'left' },
      { x_offset: 50, y_offset: 40, direction: 'right' }
    ],
    default_properties: { capacity: '1000 gal', design_pressure: '50 PSI' },
    description: 'Vertical storage / process tank',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Horizontal Vessel',
    symbol_type: 'Vessel',
    category: 'Vessels',
    // Horizontal capsule with elliptical end-caps + internal head lines
    svg_path: 'M 20,5 L 70,5 L 70,55 L 20,55 Z M 20,5 Q 5,5 5,30 Q 5,55 20,55 M 70,5 Q 85,5 85,30 Q 85,55 70,55 M 20,5 Q 12,30 20,55 M 70,5 Q 78,30 70,55',
    default_width: 90,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 90, y_offset: 30, direction: 'right' },
      { x_offset: 45, y_offset: 0, direction: 'top' },
      { x_offset: 45, y_offset: 60, direction: 'bottom' }
    ],
    default_properties: { capacity: '500 gal', design_pressure: '150 PSI' },
    description: 'Horizontal pressure vessel / separator',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Agitator / Mixer',
    symbol_type: 'Tank',
    category: 'Vessels',
    // Vertical tank body + top-entry shaft + two propeller / impeller blades
    svg_path: 'M 10,20 L 50,20 L 50,72 L 10,72 Z M 10,72 Q 30,78 50,72 M 30,20 L 30,0 M 18,50 L 30,40 L 42,50 M 18,62 L 30,54 L 42,62',
    default_width: 60,
    default_height: 80,
    connection_points: [
      { x_offset: 30, y_offset: 80, direction: 'bottom' },
      { x_offset: 10, y_offset: 46, direction: 'left' },
      { x_offset: 50, y_offset: 46, direction: 'right' },
      { x_offset: 30, y_offset: 0, direction: 'top' }
    ],
    default_properties: { volume: '500 gal', impeller: 'Pitched Blade', rpm: '60' },
    description: 'Agitator / mixer – tank with mechanical mixing',
    is_standard: true
  },
  // ── Instruments ──────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Pressure Gauge',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Circle with a needle pointer + scale arc — local PI indicator
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 26,10 M 9,28 A 13,13 0 0,1 31,28',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-300 PSI', code: 'PI', tag: 'PI-001' },
    description: 'Pressure indicator – local pressure gauge',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Pressure Transmitter',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Double concentric circles — remote PT signal transmitter
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-300 PSI', code: 'PT', output: '4-20mA', tag: 'PT-001' },
    description: 'Pressure transmitter – remote 4-20 mA signal',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Temperature Element',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Circle with a rectangular thermowell extending downward
    svg_path: 'M 20,16 m -13,0 a 13,13 0 1,0 26,0 a 13,13 0 1,0 -26,0 M 17,28 L 17,40 L 23,40 L 23,28 M 20,37 L 20,40',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-500 F', code: 'TE', type: 'RTD', tag: 'TE-001' },
    description: 'Temperature element – RTD / thermocouple with thermowell',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Temperature Transmitter',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Double circles + shorter thermowell — TT remote transmitter
    svg_path: 'M 20,16 m -13,0 a 13,13 0 1,0 26,0 a 13,13 0 1,0 -26,0 M 20,16 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0 M 17,28 L 17,40 L 23,40 L 23,28',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-500 F', code: 'TT', output: '4-20mA', tag: 'TT-001' },
    description: 'Temperature transmitter – 4-20 mA remote signal',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Level Transmitter',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Circle with two horizontal wave lines — liquid surface indication
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 8,17 Q 12,13 16,17 Q 20,21 24,17 Q 28,13 32,17 M 8,23 Q 12,27 16,23 Q 20,19 24,23 Q 28,27 32,23',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-100%', code: 'LT', output: '4-20mA', tag: 'LT-001' },
    description: 'Level transmitter – radar / ultrasonic / DP type',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Flow Transmitter',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Circle with an arrow pointing right — flow measurement / FT
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 8,20 L 32,20 M 26,14 L 32,20 L 26,26',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-500 GPM', code: 'FT', output: '4-20mA', tag: 'FT-001' },
    description: 'Flow transmitter – flow measurement with remote output',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Flow Element (Orifice)',
    symbol_type: 'Instrument',
    category: 'Instruments',
    // Two close parallel vertical lines across the pipe — orifice plate FE
    svg_path: 'M 0,20 L 40,20 M 17,6 L 17,34 M 23,6 L 23,34',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { bore: '1.5"', beta: '0.65', code: 'FE', tag: 'FE-001' },
    description: 'Flow element – orifice plate primary measurement device',
    is_standard: true
  },
  // ── Motors ────────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Electric Motor',
    symbol_type: 'Motor',
    category: 'Motors',
    // Circle casing + shaft stub + "M"-shaped winding mark inside
    svg_path: 'M 25,25 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0 M 45,25 L 55,25 M 14,18 L 19,32 L 25,18 L 31,32 L 36,18',
    default_width: 55,
    default_height: 50,
    connection_points: [
      { x_offset: 55, y_offset: 25, direction: 'right' }
    ],
    default_properties: { power: '10 HP', voltage: '460V', rpm: '1800' },
    description: 'Electric motor – AC induction / DC drive',
    is_standard: true
  },
  // ── Heat Exchangers ───────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Shell and Tube Heat Exchanger',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    // Capsule shell with elliptical end caps + three tube bundle lines
    svg_path: 'M 18,8 L 62,8 L 62,52 L 18,52 Z M 18,8 Q 6,8 6,30 Q 6,52 18,52 M 62,8 Q 74,8 74,30 Q 74,52 62,52 M 22,20 L 58,20 M 22,30 L 58,30 M 22,40 L 58,40',
    default_width: 80,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 80, y_offset: 25, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 60, y_offset: 60, direction: 'bottom' }
    ],
    default_properties: { duty: '1 MMBTU/hr', area: '100 sqft' },
    description: 'Shell-and-tube heat exchanger',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Plate Heat Exchanger',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    // Alternating vertical plates (corrugated) between two end bars
    svg_path: 'M 5,5 L 5,55 M 75,5 L 75,55 M 20,5 L 20,55 M 30,5 L 30,55 M 40,5 L 40,55 M 50,5 L 50,55 M 60,5 L 60,55 M 5,5 L 75,5 M 5,55 L 75,55 M 0,20 L 5,20 M 75,40 L 80,40 M 0,40 L 5,40 M 75,20 L 80,20',
    default_width: 80,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 0, y_offset: 40, direction: 'left' },
      { x_offset: 80, y_offset: 20, direction: 'right' },
      { x_offset: 80, y_offset: 40, direction: 'right' }
    ],
    default_properties: { duty: '500 kBTU/hr', plates: '20', material: 'SS316' },
    description: 'Gasketed plate-and-frame heat exchanger',
    is_standard: true
  },

  {
    library_id: uuidv4(),
    symbol_name: 'Air Cooler (Fin Fan)',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    // Rectangle bundle with an X fan blade motif inside
    svg_path: 'M 5,5 L 75,5 L 75,55 L 5,55 Z M 40,30 m -18,0 a 18,18 0 1,0 36,0 a 18,18 0 1,0 -36,0 M 22,30 L 58,30 M 40,12 L 40,48 M 27,17 L 53,43 M 53,17 L 27,43 M 0,25 L 5,25 M 75,25 L 80,25 M 0,35 L 5,35 M 75,35 L 80,35',
    default_width: 80,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 0, y_offset: 35, direction: 'left' },
      { x_offset: 80, y_offset: 25, direction: 'right' },
      { x_offset: 80, y_offset: 35, direction: 'right' }
    ],
    default_properties: { duty: '2 MMBTU/hr', fans: '2', material: 'CS' },
    description: 'Air-cooled heat exchanger / fin-fan cooler',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Condenser',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    // Shell with tubes + vapor inlet top, condensate outlet bottom
    svg_path: 'M 15,10 L 65,10 L 65,50 L 15,50 Z M 15,10 Q 5,10 5,30 Q 5,50 15,50 M 65,10 Q 75,10 75,30 Q 75,50 65,50 M 20,20 L 60,20 M 20,30 L 60,30 M 20,40 L 60,40 M 30,0 L 30,10 M 50,50 L 50,60',
    default_width: 80,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 80, y_offset: 30, direction: 'right' },
      { x_offset: 30, y_offset: 0, direction: 'top' },
      { x_offset: 50, y_offset: 60, direction: 'bottom' }
    ],
    default_properties: { duty: '1.5 MMBTU/hr', area: '150 sqft', coolant: 'CW' },
    description: 'Condenser – vapor-to-liquid heat exchanger',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Reboiler',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    // Shell with U-tube bundle — kettle/thermosiphon style
    svg_path: 'M 10,5 L 70,5 L 70,55 L 10,55 Z M 10,5 Q 0,5 0,30 Q 0,55 10,55 M 70,5 Q 80,5 80,30 Q 80,55 70,55 M 25,5 L 25,35 Q 25,48 37,48 Q 50,48 50,35 L 50,5 M 37,5 L 37,35 Q 37,43 43,43 M 60,55 L 60,65 M 20,0 L 20,5',
    default_width: 80,
    default_height: 65,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 80, y_offset: 30, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 60, y_offset: 65, direction: 'bottom' }
    ],
    default_properties: { duty: '3 MMBTU/hr', area: '200 sqft', heating_medium: 'Steam' },
    description: 'Reboiler – bottom heat input for distillation',
    is_standard: true
  },

  // ── Pipes & Fittings ──────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Pipe Segment',
    symbol_type: 'Pipe',
    category: 'Pipes & Fittings',
    // Two parallel horizontal lines representing a pipe with its bore
    svg_path: 'M 0,13 L 80,13 M 0,27 L 80,27 M 0,13 L 0,27 M 80,13 L 80,27',
    default_width: 80,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 80, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '4"', schedule: '40', material: 'CS', length: '10 ft' },
    description: 'Generic pipe segment',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Concentric Reducer',
    symbol_type: 'Fitting',
    category: 'Pipes & Fittings',
    // Tapered solid shape transitioning from large bore to small bore
    svg_path: 'M 0,8 L 0,32 L 60,27 L 60,13 Z',
    default_width: 60,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 60, y_offset: 20, direction: 'right' }
    ],
    default_properties: { inlet_size: '6"', outlet_size: '4"', material: 'CS' },
    description: 'Concentric reducer fitting',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Equal Tee',
    symbol_type: 'Fitting',
    category: 'Pipes & Fittings',
    // T-shape: horizontal run with a vertical branch upward
    svg_path: 'M 0,22 L 60,22 M 0,32 L 60,32 M 25,0 L 25,22 M 35,0 L 35,22',
    default_width: 60,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 27, direction: 'left' },
      { x_offset: 60, y_offset: 27, direction: 'right' },
      { x_offset: 30, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '4"', material: 'CS' },
    description: 'Equal tee – three-way fitting',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Cross Fitting',
    symbol_type: 'Fitting',
    category: 'Pipes & Fittings',
    // Plus-sign: horizontal run with branches both up and down
    svg_path: 'M 0,22 L 60,22 M 0,32 L 60,32 M 25,0 L 25,22 M 35,0 L 35,22 M 25,32 L 25,55 M 35,32 L 35,55',
    default_width: 60,
    default_height: 55,
    connection_points: [
      { x_offset: 0, y_offset: 27, direction: 'left' },
      { x_offset: 60, y_offset: 27, direction: 'right' },
      { x_offset: 30, y_offset: 0, direction: 'top' },
      { x_offset: 30, y_offset: 55, direction: 'bottom' }
    ],
    default_properties: { size: '4"', material: 'CS' },
    description: 'Cross fitting – four-way junction',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Elbow 90°',
    symbol_type: 'Fitting',
    category: 'Pipes & Fittings',
    // Curved elbow: horizontal inlet transitioning to vertical outlet
    svg_path: 'M 0,22 L 18,22 Q 35,22 35,5 L 35,0 M 0,32 L 22,32 Q 45,32 45,5 L 45,0',
    default_width: 50,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 27, direction: 'left' },
      { x_offset: 40, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '4"', radius: 'LR', material: 'CS' },
    description: '90° long-radius elbow',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Elbow 45°',
    symbol_type: 'Fitting',
    category: 'Pipes & Fittings',
    // Diagonal line representing 45° change of direction
    svg_path: 'M 0,40 L 28,40 L 28,12 M 0,50 L 38,50 L 38,12',
    default_width: 50,
    default_height: 55,
    connection_points: [
      { x_offset: 0, y_offset: 45, direction: 'left' },
      { x_offset: 33, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '4"', material: 'CS' },
    description: '45° elbow fitting',
    is_standard: true
  },

  // ── Manifolds ─────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Distribution Manifold',
    symbol_type: 'Manifold',
    category: 'Manifolds',
    // Large header pipe (double line) with four branch outlets going down
    svg_path: 'M 0,12 L 100,12 M 0,22 L 100,22 M 0,12 Q -5,12 -5,17 Q -5,22 0,22 M 100,12 Q 105,12 105,17 Q 105,22 100,22 M 20,22 L 20,45 M 40,22 L 40,45 M 60,22 L 60,45 M 80,22 L 80,45',
    default_width: 100,
    default_height: 45,
    connection_points: [
      { x_offset: 0, y_offset: 17, direction: 'left' },
      { x_offset: 100, y_offset: 17, direction: 'right' },
      { x_offset: 20, y_offset: 45, direction: 'bottom' },
      { x_offset: 40, y_offset: 45, direction: 'bottom' },
      { x_offset: 60, y_offset: 45, direction: 'bottom' },
      { x_offset: 80, y_offset: 45, direction: 'bottom' }
    ],
    default_properties: { size: '8"', outlets: '4', material: 'CS', service: 'Process' },
    description: 'Distribution manifold – one inlet, multiple outlets',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Collection Manifold',
    symbol_type: 'Manifold',
    category: 'Manifolds',
    // Large header pipe (double line) with four branch inlets coming from above
    svg_path: 'M 0,32 L 100,32 M 0,42 L 100,42 M 0,32 Q -5,32 -5,37 Q -5,42 0,42 M 100,32 Q 105,32 105,37 Q 105,42 100,42 M 20,0 L 20,32 M 40,0 L 40,32 M 60,0 L 60,32 M 80,0 L 80,32',
    default_width: 100,
    default_height: 42,
    connection_points: [
      { x_offset: 0, y_offset: 37, direction: 'left' },
      { x_offset: 100, y_offset: 37, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 40, y_offset: 0, direction: 'top' },
      { x_offset: 60, y_offset: 0, direction: 'top' },
      { x_offset: 80, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '8"', inlets: '4', material: 'CS', service: 'Process' },
    description: 'Collection manifold – multiple inlets, one outlet',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Suction Manifold',
    symbol_type: 'Manifold',
    category: 'Manifolds',
    // Rounded-end header (capsule) with branch connections on top
    svg_path: 'M 15,15 L 85,15 M 15,25 L 85,25 M 15,15 Q 5,15 5,20 Q 5,25 15,25 M 85,15 Q 95,15 95,20 Q 95,25 85,25 M 30,0 L 30,15 M 50,0 L 50,15 M 70,0 L 70,15',
    default_width: 100,
    default_height: 25,
    connection_points: [
      { x_offset: 5, y_offset: 20, direction: 'left' },
      { x_offset: 95, y_offset: 20, direction: 'right' },
      { x_offset: 30, y_offset: 0, direction: 'top' },
      { x_offset: 50, y_offset: 0, direction: 'top' },
      { x_offset: 70, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '6"', connections: '3', material: 'CS', service: 'Suction' },
    description: 'Suction manifold – common suction header for multiple pumps',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Discharge Manifold',
    symbol_type: 'Manifold',
    category: 'Manifolds',
    // Rounded-end header (capsule) with branch connections on bottom
    svg_path: 'M 15,0 L 85,0 M 15,10 L 85,10 M 15,0 Q 5,0 5,5 Q 5,10 15,10 M 85,0 Q 95,0 95,5 Q 95,10 85,10 M 30,10 L 30,25 M 50,10 L 50,25 M 70,10 L 70,25',
    default_width: 100,
    default_height: 25,
    connection_points: [
      { x_offset: 5, y_offset: 5, direction: 'left' },
      { x_offset: 95, y_offset: 5, direction: 'right' },
      { x_offset: 30, y_offset: 25, direction: 'bottom' },
      { x_offset: 50, y_offset: 25, direction: 'bottom' },
      { x_offset: 70, y_offset: 25, direction: 'bottom' }
    ],
    default_properties: { size: '6"', connections: '3', material: 'CS', service: 'Discharge' },
    description: 'Discharge manifold – common discharge header for multiple pumps',
    is_standard: true
  },

  // ── Headers ───────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Supply Header',
    symbol_type: 'Header',
    category: 'Headers',
    // Long double-line pipe with multiple branch take-offs pointing down
    svg_path: 'M 0,10 L 120,10 M 0,20 L 120,20 M 0,10 Q -4,10 -4,15 Q -4,20 0,20 M 120,10 Q 124,10 124,15 Q 124,20 120,20 M 24,10 L 24,0 M 48,10 L 48,0 M 72,10 L 72,0 M 96,10 L 96,0',
    default_width: 120,
    default_height: 20,
    connection_points: [
      { x_offset: 0, y_offset: 15, direction: 'left' },
      { x_offset: 120, y_offset: 15, direction: 'right' },
      { x_offset: 24, y_offset: 0, direction: 'top' },
      { x_offset: 48, y_offset: 0, direction: 'top' },
      { x_offset: 72, y_offset: 0, direction: 'top' },
      { x_offset: 96, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '10"', material: 'CS', service: 'Supply', design_pressure: '150 PSI' },
    description: 'Supply header – main distribution pipe with branch take-offs',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Return Header',
    symbol_type: 'Header',
    category: 'Headers',
    // Long double-line pipe with multiple branch connections pointing up from bottom
    svg_path: 'M 0,0 L 120,0 M 0,10 L 120,10 M 0,0 Q -4,0 -4,5 Q -4,10 0,10 M 120,0 Q 124,0 124,5 Q 124,10 120,10 M 24,10 L 24,20 M 48,10 L 48,20 M 72,10 L 72,20 M 96,10 L 96,20',
    default_width: 120,
    default_height: 20,
    connection_points: [
      { x_offset: 0, y_offset: 5, direction: 'left' },
      { x_offset: 120, y_offset: 5, direction: 'right' },
      { x_offset: 24, y_offset: 20, direction: 'bottom' },
      { x_offset: 48, y_offset: 20, direction: 'bottom' },
      { x_offset: 72, y_offset: 20, direction: 'bottom' },
      { x_offset: 96, y_offset: 20, direction: 'bottom' }
    ],
    default_properties: { size: '10"', material: 'CS', service: 'Return', design_pressure: '150 PSI' },
    description: 'Return header – main collection pipe receiving branch returns',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Steam Header',
    symbol_type: 'Header',
    category: 'Headers',
    // Long double-line pipe with steam service indicator (diagonal hatching inside)
    svg_path: 'M 0,10 L 120,10 M 0,22 L 120,22 M 0,10 Q -4,10 -4,16 Q -4,22 0,22 M 120,10 Q 124,10 124,16 Q 124,22 120,22 M 20,10 L 30,22 M 40,10 L 50,22 M 60,10 L 70,22 M 80,10 L 90,22 M 100,10 L 110,22 M 24,0 L 24,10 M 64,0 L 64,10 M 104,0 L 104,10',
    default_width: 120,
    default_height: 22,
    connection_points: [
      { x_offset: 0, y_offset: 16, direction: 'left' },
      { x_offset: 120, y_offset: 16, direction: 'right' },
      { x_offset: 24, y_offset: 0, direction: 'top' },
      { x_offset: 64, y_offset: 0, direction: 'top' },
      { x_offset: 104, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '8"', material: 'CS', service: 'Steam', design_pressure: '300 PSI', temperature: '350°F' },
    description: 'Steam header – main steam distribution pipe',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Process Header',
    symbol_type: 'Header',
    category: 'Headers',
    // Long double-line pipe representing a generic process main
    svg_path: 'M 0,10 L 120,10 M 0,20 L 120,20 M 0,10 Q -4,10 -4,15 Q -4,20 0,20 M 120,10 Q 124,10 124,15 Q 124,20 120,20 M 20,0 L 20,10 M 40,0 L 40,10 M 60,0 L 60,10 M 80,0 L 80,10 M 100,0 L 100,10 M 20,20 L 20,30 M 60,20 L 60,30 M 100,20 L 100,30',
    default_width: 120,
    default_height: 30,
    connection_points: [
      { x_offset: 0, y_offset: 15, direction: 'left' },
      { x_offset: 120, y_offset: 15, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 60, y_offset: 0, direction: 'top' },
      { x_offset: 100, y_offset: 0, direction: 'top' },
      { x_offset: 20, y_offset: 30, direction: 'bottom' },
      { x_offset: 60, y_offset: 30, direction: 'bottom' },
      { x_offset: 100, y_offset: 30, direction: 'bottom' }
    ],
    default_properties: { size: '10"', material: 'CS', service: 'Process', design_pressure: '150 PSI' },
    description: 'Process header – main process piping header',
    is_standard: true
  },

  // ── Electrical ────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Transformer',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 20,30 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 50,30 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
    default_width: 70,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 70, y_offset: 30, direction: 'right' }
    ],
    default_properties: { kva: '100', primary_voltage: '480V', secondary_voltage: '120V' },
    description: 'Power transformer symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Circuit Breaker',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 0,20 L 15,20 M 15,20 L 25,5 M 25,5 L 35,20 L 45,20',
    default_width: 45,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 45, y_offset: 20, direction: 'right' }
    ],
    default_properties: { amperage: '100A', voltage: '480V' },
    description: 'Circuit breaker symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Disconnect Switch',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 0,20 L 15,20 M 15,18 L 35,5 M 35,20 L 45,20',
    default_width: 45,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 45, y_offset: 20, direction: 'right' }
    ],
    default_properties: { amperage: '60A', voltage: '480V' },
    description: 'Disconnect switch symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Fuse',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 0,20 L 10,20 M 10,10 L 35,10 L 35,30 L 10,30 Z M 35,20 L 45,20',
    default_width: 45,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 45, y_offset: 20, direction: 'right' }
    ],
    default_properties: { amperage: '20A', type: 'Class J' },
    description: 'Fuse element symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Motor Starter',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 20,20 m -18,0 a 18,18 0 1,0 36,0 a 18,18 0 1,0 -36,0 M 13,20 L 27,20 M 20,13 L 20,27 M 5,10 L 35,30',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { amperage: '30A', voltage: '460V', hp: '15' },
    description: 'Motor starter / contactor symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Ground',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 20,0 L 20,20 M 5,20 L 35,20 M 10,26 L 30,26 M 15,32 L 25,32',
    default_width: 40,
    default_height: 35,
    connection_points: [
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { type: 'Earth Ground' },
    description: 'Electrical ground / earth symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Power Supply',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 20,20 m -18,0 a 18,18 0 1,0 36,0 a 18,18 0 1,0 -36,0 M 15,13 L 15,27 M 22,13 L 22,27 M 20,2 L 20,8',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { voltage: '24VDC', amperage: '5A' },
    description: 'DC power supply symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Junction Box',
    symbol_type: 'Electrical',
    category: 'Electrical',
    svg_path: 'M 5,5 L 55,5 L 55,45 L 5,45 Z M 15,5 L 15,0 M 30,5 L 30,0 M 45,5 L 45,0 M 15,45 L 15,50 M 30,45 L 30,50 M 45,45 L 45,50',
    default_width: 60,
    default_height: 50,
    connection_points: [
      { x_offset: 15, y_offset: 0, direction: 'top' },
      { x_offset: 30, y_offset: 0, direction: 'top' },
      { x_offset: 45, y_offset: 0, direction: 'top' },
      { x_offset: 15, y_offset: 50, direction: 'bottom' },
      { x_offset: 30, y_offset: 50, direction: 'bottom' },
      { x_offset: 45, y_offset: 50, direction: 'bottom' }
    ],
    default_properties: { nema_rating: 'NEMA 4X', terminals: '12' },
    description: 'Electrical junction box',
    is_standard: true
  },

  // ── Hydraulic ─────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Hydraulic Pump',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 25,25 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0 M 25,25 L 15,15 L 15,35 Z M 25,5 L 25,12',
    default_width: 50,
    default_height: 50,
    connection_points: [
      { x_offset: 5, y_offset: 25, direction: 'left' },
      { x_offset: 45, y_offset: 25, direction: 'right' },
      { x_offset: 25, y_offset: 5, direction: 'top' }
    ],
    default_properties: { displacement: '2.5 cc/rev', pressure: '3000 PSI', flow: '10 GPM' },
    description: 'Fixed-displacement hydraulic pump',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Hydraulic Motor',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 25,25 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0 M 25,25 L 35,15 L 35,35 Z',
    default_width: 50,
    default_height: 50,
    connection_points: [
      { x_offset: 5, y_offset: 25, direction: 'left' },
      { x_offset: 45, y_offset: 25, direction: 'right' }
    ],
    default_properties: { displacement: '2.5 cc/rev', torque: '50 Nm' },
    description: 'Fixed-displacement hydraulic motor',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Hydraulic Cylinder',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 5,15 L 45,15 L 45,35 L 5,35 Z M 45,25 L 60,25 M 5,20 L 0,20 M 5,30 L 0,30 M 25,15 L 25,8',
    default_width: 60,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 60, y_offset: 25, direction: 'right' },
      { x_offset: 25, y_offset: 8, direction: 'top' }
    ],
    default_properties: { bore: '2"', stroke: '12"', pressure: '3000 PSI' },
    description: 'Double-acting hydraulic cylinder',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Hydraulic Accumulator',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 20,5 L 20,55 M 5,5 L 35,5 L 35,55 L 5,55 Z M 5,30 L 35,30',
    default_width: 40,
    default_height: 60,
    connection_points: [
      { x_offset: 20, y_offset: 60, direction: 'bottom' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { volume: '1 gal', precharge: '1500 PSI' },
    description: 'Hydraulic bladder accumulator',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Pressure Relief Valve',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 0,20 L 40,20 M 20,20 L 20,5 M 15,5 L 25,5 M 15,0 L 25,0 M 15,0 L 15,5 M 25,0 L 25,5',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { set_pressure: '3000 PSI', cracking_pressure: '2800 PSI' },
    description: 'Hydraulic pressure relief valve',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Hydraulic Filter',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 0,20 L 10,20 M 10,5 L 30,5 L 30,35 L 10,35 Z M 15,10 L 25,10 M 15,16 L 25,16 M 15,22 L 25,22 M 15,28 L 25,28 M 30,20 L 40,20',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { micron_rating: '10 micron', flow: '20 GPM' },
    description: 'Hydraulic line filter',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Flow Control Valve',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 0,20 L 40,20 M 20,20 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 12,12 L 28,28',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { flow_setting: '5 GPM', pressure_comp: 'Yes' },
    description: 'Pressure-compensated flow control valve',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Directional Control Valve 4/2',
    symbol_type: 'Hydraulic',
    category: 'Hydraulic',
    svg_path: 'M 5,10 L 35,10 L 35,30 L 5,30 Z M 40,10 L 60,10 L 60,30 L 40,30 Z M 35,20 L 40,20 M 20,10 L 20,5 M 20,30 L 20,35 M 50,10 L 50,5 M 50,30 L 50,35',
    default_width: 60,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 5, direction: 'top' },
      { x_offset: 50, y_offset: 5, direction: 'top' },
      { x_offset: 20, y_offset: 35, direction: 'bottom' },
      { x_offset: 50, y_offset: 35, direction: 'bottom' }
    ],
    default_properties: { configuration: '4/2', actuation: 'Solenoid', flow: '15 GPM' },
    description: '4-way 2-position directional control valve',
    is_standard: true
  },

  // ── Pneumatic ─────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Air Compressor',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 25,25 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0 M 25,25 L 15,15 L 15,35 Z M 10,10 L 5,5 M 10,40 L 5,45 M 40,10 L 45,5',
    default_width: 50,
    default_height: 50,
    connection_points: [
      { x_offset: 45, y_offset: 25, direction: 'right' },
      { x_offset: 25, y_offset: 5, direction: 'top' }
    ],
    default_properties: { cfm: '50', pressure: '125 PSI', hp: '10' },
    description: 'Reciprocating air compressor',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Pneumatic Actuator',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 10,5 L 40,5 L 40,25 L 10,25 Z M 25,25 L 25,45 M 15,45 L 35,45 M 25,5 L 25,0',
    default_width: 50,
    default_height: 50,
    connection_points: [
      { x_offset: 25, y_offset: 50, direction: 'bottom' },
      { x_offset: 25, y_offset: 0, direction: 'top' }
    ],
    default_properties: { bore: '2"', stroke: '6"', pressure: '80 PSI' },
    description: 'Spring-return pneumatic actuator',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'FRL Unit',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 5,10 L 55,10 L 55,40 L 5,40 Z M 20,40 L 20,50 M 20,50 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 35,10 L 35,5 M 35,5 m -4,0 L 39,5 M 0,25 L 5,25 M 55,25 L 60,25',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 60, y_offset: 25, direction: 'right' }
    ],
    default_properties: { filter_micron: '40', regulator_range: '0-125 PSI', lubricator: 'Yes' },
    description: 'Filter-Regulator-Lubricator unit',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Solenoid Valve',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 0,20 L 40,20 M 10,10 L 30,10 L 30,30 L 10,30 Z M 10,20 L 30,10 M 20,10 L 20,0 M 20,30 L 20,35',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { voltage: '24VDC', cv: '0.5', port_size: '1/4"' },
    description: 'Pneumatic solenoid valve',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Pneumatic Silencer',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 0,20 L 10,20 M 10,8 L 25,8 L 25,32 L 10,32 Z M 13,12 L 22,12 M 13,16 L 22,16 M 13,20 L 22,20 M 13,24 L 22,24 M 13,28 L 22,28 M 25,20 L 35,20',
    default_width: 35,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 35, y_offset: 20, direction: 'right' }
    ],
    default_properties: { port_size: '1/4"', db_reduction: '25 dB' },
    description: 'Pneumatic exhaust silencer / muffler',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Air Reservoir',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 20,30 m -15,0 a 15,15 0 0,1 0,-20 L 50,10 a 15,15 0 0,1 0,20 Z M 5,20 L 0,20 M 65,20 L 70,20',
    default_width: 70,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 70, y_offset: 20, direction: 'right' }
    ],
    default_properties: { volume: '10 gal', max_pressure: '150 PSI' },
    description: 'Compressed air receiver / reservoir',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Pressure Regulator',
    symbol_type: 'Pneumatic',
    category: 'Pneumatic',
    svg_path: 'M 0,25 L 10,25 M 10,10 L 30,10 L 30,40 L 10,40 Z M 25,10 L 25,3 M 18,3 L 32,3 M 15,25 L 25,15 L 25,35 Z M 30,25 L 40,25',
    default_width: 40,
    default_height: 45,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 40, y_offset: 25, direction: 'right' }
    ],
    default_properties: { inlet_max: '150 PSI', outlet_range: '0-125 PSI', cv: '1.2' },
    description: 'Pneumatic pressure regulator',
    is_standard: true
  },

  // ── Mechanical ────────────────────────────────────────────────────────────
  {
    library_id: uuidv4(),
    symbol_name: 'Gear Reducer',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 5,5 L 65,5 L 65,55 L 5,55 Z M 20,30 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 50,30 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 0,30 L 5,30 M 65,30 L 70,30',
    default_width: 70,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 70, y_offset: 30, direction: 'right' }
    ],
    default_properties: { ratio: '10:1', input_rpm: '1800', output_rpm: '180', hp: '5' },
    description: 'Parallel-shaft gear reducer',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Belt Drive',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 15,25 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 55,25 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 3,15 L 47,17 M 3,35 L 47,33',
    default_width: 70,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 70, y_offset: 25, direction: 'right' }
    ],
    default_properties: { belt_type: 'V-Belt', ratio: '3:1', center_distance: '18"' },
    description: 'V-belt drive assembly',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Chain Drive',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 15,25 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 55,25 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 3,15 L 47,17 M 3,35 L 47,33 M 8,13 L 14,13 M 20,13 L 26,13 M 32,13 L 38,13 M 8,37 L 14,37 M 20,37 L 26,37 M 32,37 L 38,37',
    default_width: 70,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 70, y_offset: 25, direction: 'right' }
    ],
    default_properties: { chain_pitch: '1"', ratio: '2:1', center_distance: '15"' },
    description: 'Roller chain drive assembly',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Coupling',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 0,20 L 15,20 M 15,10 L 15,30 M 25,10 L 25,30 M 15,10 L 25,10 M 15,30 L 25,30 M 25,20 L 40,20',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { type: 'Rigid', bore: '1.5"', torque: '200 Nm' },
    description: 'Rigid shaft coupling',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Bearing',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 20,20 m -18,0 a 18,18 0 1,0 36,0 a 18,18 0 1,0 -36,0 M 20,20 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 20,20 m -3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { type: 'Deep Groove Ball', bore: '25mm', load_rating: '10 kN' },
    description: 'Rolling element bearing (ball/roller)',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Shaft Seal',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 10,5 L 30,5 L 30,35 L 10,35 Z M 10,20 L 0,20 M 30,20 L 40,20 M 15,10 L 25,10 M 15,30 L 25,30',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { type: 'Lip Seal', shaft_dia: '1.5"', material: 'Nitrile' },
    description: 'Rotary shaft seal / oil seal',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Gearbox',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 5,10 L 65,10 L 65,50 L 5,50 Z M 20,30 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 45,30 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 30,30 L 35,30 M 0,30 L 5,30 M 65,30 L 70,30',
    default_width: 70,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 70, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'Helical', ratio: '5:1', efficiency: '98%' },
    description: 'Multi-stage enclosed gearbox',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Flexible Coupling',
    symbol_type: 'Mechanical',
    category: 'Mechanical',
    svg_path: 'M 0,20 L 15,20 M 15,10 L 15,30 M 25,10 L 25,30 M 18,10 L 22,10 M 18,30 L 22,30 M 17,15 L 23,15 M 17,25 L 23,25 M 25,20 L 40,20',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { type: 'Jaw/Spider', bore: '1.5"', misalignment: '1°' },
    description: 'Flexible jaw coupling with elastomer insert',
    is_standard: true
  }
]

// Create a new blank P&ID drawing
export function createBlankPIDDrawing(params?: {
  title?: string
  projectName?: string
  areaId?: string
}): PIDDrawing {
  return {
    drawing_id: uuidv4(),
    drawing_number: `PID-${Date.now().toString().substring(7)}`,
    drawing_title: params?.title || 'New P&ID Drawing',
    revision: 1,
    project_name: params?.projectName || 'MaintenancePro Project',
    area_id: params?.areaId || null,
    system_id: null,
    canvas_width: 1920,
    canvas_height: 1080,
    grid_size: 20,
    show_grid: true,
    snap_to_grid: true,
    snap_to_grip: true,
    zoom_level: 1.0,
    pan_x: 0,
    pan_y: 0,
    symbols: [],
    connections: [],
    annotations: [],
    metadata: {
      discipline: 'Process',
      unit_number: null,
      sheet_number: '1',
      total_sheets: 1,
      scale: 'NTS',
      approved_by: null,
      approved_date: null,
      status: 'Draft',
      tags: [],
      references: []
    },
    created_by: 'System',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_modified_by: 'System'
  }
}

// Add a symbol to a drawing
export function addSymbolToDrawing(
  drawing: PIDDrawing,
  libraryItem: SymbolLibraryItem,
  position: { x: number; y: number },
  customProperties?: Record<string, string | number | boolean>
): PIDSymbol {
  const symbol: PIDSymbol = {
    symbol_id: uuidv4(),
    drawing_id: drawing.drawing_id,
    symbol_type: libraryItem.symbol_type,
    x: position.x,
    y: position.y,
    width: libraryItem.default_width,
    height: libraryItem.default_height,
    rotation: 0,
    scale: 1.0,
    label: libraryItem.symbol_name,
    tag_number: generateTagNumber(libraryItem.symbol_type, drawing.symbols.length + 1),
    asset_id: null,
    properties: { ...libraryItem.default_properties, ...customProperties },
    connection_points: libraryItem.connection_points.map(cp => ({
      point_id: uuidv4(),
      x_offset: cp.x_offset,
      y_offset: cp.y_offset,
      direction: cp.direction,
      connected_to: null
    })),
    style: {
      fill_color: '#ffffff',
      stroke_color: '#000000',
      stroke_width: 2,
      opacity: 1.0,
      dash_array: null
    },
    z_index: drawing.symbols.length
  }
  
  drawing.symbols.push(symbol)
  drawing.updated_at = new Date().toISOString()
  
  return symbol
}

// Generate standard tag numbers based on symbol type
function generateTagNumber(symbolType: PIDSymbolType, index: number): string {
  const prefixes: Record<PIDSymbolType, string> = {
    'Valve': 'V',
    'Pump': 'P',
    'Motor': 'M',
    'Vessel': 'V',
    'Tank': 'TK',
    'Heat Exchanger': 'E',
    'Compressor': 'K',
    'Instrument': 'I',
    'Pipe': 'L',
    'Fitting': 'F',
    'Manifold': 'MF',
    'Header': 'HD',
    'Equipment': 'EQ',
    'Custom': 'X',
    'Electrical': 'EL',
    'Hydraulic': 'HYD',
    'Pneumatic': 'PNU',
    'Mechanical': 'MECH'
  }
  
  const prefix = prefixes[symbolType] || 'X'
  return `${prefix}-${String(index).padStart(3, '0')}`
}

// Connect two symbols with a pipe/line
export function connectSymbols(
  drawing: PIDDrawing,
  fromSymbolId: string,
  fromPointId: string,
  toSymbolId: string,
  toPointId: string,
  lineType: 'Process' | 'Utility' | 'Signal' | 'Electrical' | 'Hydraulic' | 'Pneumatic' | 'Mechanical' = 'Process'
): PIDConnection | null {
  const fromSymbol = drawing.symbols.find(s => s.symbol_id === fromSymbolId)
  const toSymbol = drawing.symbols.find(s => s.symbol_id === toSymbolId)
  
  if (!fromSymbol || !toSymbol) {
    return null
  }
  
  const fromPoint = fromSymbol.connection_points.find(p => p.point_id === fromPointId)
  const toPoint = toSymbol.connection_points.find(p => p.point_id === toPointId)
  
  if (!fromPoint || !toPoint) {
    return null
  }
  
  // Calculate absolute positions
  const fromX = fromSymbol.x + fromPoint.x_offset
  const fromY = fromSymbol.y + fromPoint.y_offset
  const toX = toSymbol.x + toPoint.x_offset
  const toY = toSymbol.y + toPoint.y_offset
  
  const connection: PIDConnection = {
    connection_id: uuidv4(),
    drawing_id: drawing.drawing_id,
    line_type: lineType,
    from_symbol_id: fromSymbolId,
    from_point_id: fromPointId,
    to_symbol_id: toSymbolId,
    to_point_id: toPointId,
    path_points: [
      { x: fromX, y: fromY },
      { x: toX, y: toY }
    ],
    line_number: `${drawing.drawing_number}-L${String(drawing.connections.length + 1).padStart(3, '0')}`,
    flow_direction: 'forward',
    line_size: 2,
    material: lineType === 'Process' ? 'CS' : null,
    service: null,
    style: {
      stroke_color: lineType === 'Process' ? '#000000' : 
                    lineType === 'Signal' ? '#FF0000' : 
                    lineType === 'Electrical' ? '#0000FF' :
                    lineType === 'Hydraulic' ? '#FF8C00' :
                    lineType === 'Pneumatic' ? '#008000' :
                    lineType === 'Mechanical' ? '#8B4513' :
                    '#0000FF',
      stroke_width: lineType === 'Process' ? 3 : 2,
      dash_array: lineType === 'Signal' ? [5, 5] :
                  lineType === 'Pneumatic' ? [8, 3] :
                  lineType === 'Mechanical' ? [5, 2, 1, 2] :
                  null,
      arrow_start: false,
      arrow_end: true,
      opacity: 1.0
    }
  }
  
  // Mark connection points as connected
  fromPoint.connected_to = toPointId
  toPoint.connected_to = fromPointId
  
  drawing.connections.push(connection)
  drawing.updated_at = new Date().toISOString()
  
  return connection
}

// Add annotation/text to drawing
export function addAnnotation(
  drawing: PIDDrawing,
  position: { x: number; y: number },
  text: string,
  type: 'Text' | 'Dimension' | 'Note' | 'Callout' | 'Arrow' = 'Text'
): PIDAnnotation {
  const annotation: PIDAnnotation = {
    annotation_id: uuidv4(),
    drawing_id: drawing.drawing_id,
    annotation_type: type,
    x: position.x,
    y: position.y,
    width: undefined,
    height: undefined,
    text: text,
    font_size: 12,
    font_family: 'Arial',
    color: '#000000',
    background_color: type === 'Note' ? '#FFFFE0' : null,
    border: type === 'Note',
    leader_line: null,
    z_index: drawing.annotations.length + 1000
  }
  
  drawing.annotations.push(annotation)
  drawing.updated_at = new Date().toISOString()
  
  return annotation
}

// Sample P&ID templates
export function generateSamplePIDTemplates(): PIDTemplate[] {
  return [
    {
      template_id: uuidv4(),
      template_name: 'Pump Station Layout',
      description: 'Standard pump station with motor, pump, valves, and instrumentation',
      category: 'Pumping',
      thumbnail_url: null,
      symbols: [],
      connections: [],
      annotations: [],
      is_public: true,
      created_by: 'System',
      created_at: new Date().toISOString(),
      usage_count: 0
    },
    {
      template_id: uuidv4(),
      template_name: 'Tank Farm',
      description: 'Storage tank with level control and overflow protection',
      category: 'Storage',
      thumbnail_url: null,
      symbols: [],
      connections: [],
      annotations: [],
      is_public: true,
      created_by: 'System',
      created_at: new Date().toISOString(),
      usage_count: 0
    },
    {
      template_id: uuidv4(),
      template_name: 'Heat Exchanger System',
      description: 'Heat exchanger with temperature control loop',
      category: 'Heat Transfer',
      thumbnail_url: null,
      symbols: [],
      connections: [],
      annotations: [],
      is_public: true,
      created_by: 'System',
      created_at: new Date().toISOString(),
      usage_count: 0
    }
  ]
}

// Export drawing to JSON
export function exportDrawingToJSON(drawing: PIDDrawing): string {
  return JSON.stringify(drawing, null, 2)
}

// Import drawing from JSON
export function importDrawingFromJSON(jsonString: string): PIDDrawing | null {
  try {
    const drawing = JSON.parse(jsonString) as PIDDrawing
    // Validate basic structure
    if (!drawing.drawing_id || !drawing.symbols || !drawing.connections) {
      return null
    }
    return drawing
  } catch (error) {
    console.error('Failed to import P&ID drawing:', error)
    return null
  }
}

// Get symbol at position (for selection)
export function getSymbolAtPosition(
  drawing: PIDDrawing,
  x: number,
  y: number
): PIDSymbol | null {
  // Check symbols in reverse order (highest z-index first)
  const sorted = [...drawing.symbols].sort((a, b) => b.z_index - a.z_index)
  
  for (const symbol of sorted) {
    if (
      x >= symbol.x &&
      x <= symbol.x + symbol.width &&
      y >= symbol.y &&
      y <= symbol.y + symbol.height
    ) {
      return symbol
    }
  }
  
  return null
}

// Move symbol to new position
export function moveSymbol(
  drawing: PIDDrawing,
  symbolId: string,
  newX: number,
  newY: number,
  snapToGrid: boolean = true
): boolean {
  const symbol = drawing.symbols.find(s => s.symbol_id === symbolId)
  if (!symbol) {
    return false
  }
  
  if (snapToGrid) {
    symbol.x = Math.round(newX / drawing.grid_size) * drawing.grid_size
    symbol.y = Math.round(newY / drawing.grid_size) * drawing.grid_size
  } else {
    symbol.x = newX
    symbol.y = newY
  }
  
  // Update connected lines
  updateConnectedLines(drawing, symbolId)
  
  drawing.updated_at = new Date().toISOString()
  return true
}

// Update connection paths when symbols move
function updateConnectedLines(drawing: PIDDrawing, symbolId: string): void {
  const symbol = drawing.symbols.find(s => s.symbol_id === symbolId)
  if (!symbol) return
  
  // Update all connections involving this symbol
  drawing.connections.forEach(conn => {
    if (conn.from_symbol_id === symbolId) {
      const point = symbol.connection_points.find(p => p.point_id === conn.from_point_id)
      if (point) {
        conn.path_points[0] = {
          x: symbol.x + point.x_offset,
          y: symbol.y + point.y_offset
        }
      }
    }
    
    if (conn.to_symbol_id === symbolId) {
      const point = symbol.connection_points.find(p => p.point_id === conn.to_point_id)
      if (point) {
        conn.path_points[conn.path_points.length - 1] = {
          x: symbol.x + point.x_offset,
          y: symbol.y + point.y_offset
        }
      }
    }
  })
}

// Delete symbol and its connections
export function deleteSymbol(drawing: PIDDrawing, symbolId: string): boolean {
  const index = drawing.symbols.findIndex(s => s.symbol_id === symbolId)
  if (index === -1) {
    return false
  }
  
  // Remove symbol
  drawing.symbols.splice(index, 1)
  
  // Remove all connections involving this symbol
  drawing.connections = drawing.connections.filter(
    conn => conn.from_symbol_id !== symbolId && conn.to_symbol_id !== symbolId
  )
  
  drawing.updated_at = new Date().toISOString()
  return true
}

// Rotate symbol
export function rotateSymbol(
  drawing: PIDDrawing,
  symbolId: string,
  degrees: number
): boolean {
  const symbol = drawing.symbols.find(s => s.symbol_id === symbolId)
  if (!symbol) {
    return false
  }
  
  symbol.rotation = (symbol.rotation + degrees) % 360
  drawing.updated_at = new Date().toISOString()
  return true
}

// Scale symbol
export function scaleSymbol(
  drawing: PIDDrawing,
  symbolId: string,
  scaleFactor: number
): boolean {
  const symbol = drawing.symbols.find(s => s.symbol_id === symbolId)
  if (!symbol) {
    return false
  }
  
  symbol.scale = Math.max(0.1, Math.min(5.0, symbol.scale * scaleFactor))
  drawing.updated_at = new Date().toISOString()
  return true
}

// Snap a moving symbol's connection points to nearby symbols' connection points
export function snapToConnectionPoint(
  drawing: PIDDrawing,
  movingSymbolId: string,
  proposedX: number,
  proposedY: number,
  snapDistance: number = 20
): { x: number; y: number; snapped: boolean } {
  const movingSymbol = drawing.symbols.find(s => s.symbol_id === movingSymbolId)
  if (!movingSymbol) return { x: proposedX, y: proposedY, snapped: false }

  // For each connection point on the moving symbol, check against all other symbols' connection points
  for (const movingPoint of movingSymbol.connection_points) {
    const movingAbsX = proposedX + movingPoint.x_offset
    const movingAbsY = proposedY + movingPoint.y_offset

    for (const otherSymbol of drawing.symbols) {
      if (otherSymbol.symbol_id === movingSymbolId) continue
      for (const otherPoint of otherSymbol.connection_points) {
        const otherAbsX = otherSymbol.x + otherPoint.x_offset
        const otherAbsY = otherSymbol.y + otherPoint.y_offset
        const dist = Math.sqrt(
          Math.pow(movingAbsX - otherAbsX, 2) + Math.pow(movingAbsY - otherAbsY, 2)
        )
        if (dist < snapDistance) {
          // Snap so that movingPoint aligns with otherPoint
          return {
            x: otherAbsX - movingPoint.x_offset,
            y: otherAbsY - movingPoint.y_offset,
            snapped: true
          }
        }
      }
    }
  }
  return { x: proposedX, y: proposedY, snapped: false }
}
