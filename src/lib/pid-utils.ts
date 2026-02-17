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
  // Valves
  {
    library_id: uuidv4(),
    symbol_name: 'Gate Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    svg_path: 'M 20,0 L 20,40 M 0,20 L 40,20 M 15,15 L 15,25 L 25,25 L 25,15 Z',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', material: 'CS', pressure_rating: '150#' },
    description: 'Standard gate valve symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Ball Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    svg_path: 'M 20,0 L 20,40 M 0,20 L 40,20 M 20,20 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', material: 'SS', pressure_rating: '300#' },
    description: 'Ball valve symbol with circular element',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Control Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    svg_path: 'M 20,0 L 20,40 M 0,20 L 40,20 M 20,10 L 10,20 L 20,30 L 30,20 Z M 20,0 L 20,10',
    default_width: 40,
    default_height: 50,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' }
    ],
    default_properties: { size: '3"', cv: '50', fail_position: 'FC' },
    description: 'Control valve with actuator',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Check Valve',
    symbol_type: 'Valve',
    category: 'Valves',
    svg_path: 'M 20,0 L 20,40 M 0,20 L 40,20 M 15,10 L 25,20 L 15,30 Z',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 0, y_offset: 20, direction: 'left' },
      { x_offset: 40, y_offset: 20, direction: 'right' }
    ],
    default_properties: { size: '2"', type: 'Swing' },
    description: 'Check valve - allows one-way flow',
    is_standard: true
  },
  // Pumps
  {
    library_id: uuidv4(),
    symbol_name: 'Centrifugal Pump',
    symbol_type: 'Pump',
    category: 'Pumps',
    svg_path: 'M 30,30 m -25,0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0 M 20,30 L 40,30 M 30,20 L 30,40',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 5, y_offset: 30, direction: 'left' },
      { x_offset: 55, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'Centrifugal', power: '10 HP', flow: '100 GPM' },
    description: 'Centrifugal pump symbol',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Positive Displacement Pump',
    symbol_type: 'Pump',
    category: 'Pumps',
    svg_path: 'M 30,30 m -25,0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0 M 30,30 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0',
    default_width: 60,
    default_height: 60,
    connection_points: [
      { x_offset: 5, y_offset: 30, direction: 'left' },
      { x_offset: 55, y_offset: 30, direction: 'right' }
    ],
    default_properties: { type: 'PD', power: '5 HP', flow: '50 GPM' },
    description: 'Positive displacement pump symbol',
    is_standard: true
  },
  // Vessels and Tanks
  {
    library_id: uuidv4(),
    symbol_name: 'Vertical Tank',
    symbol_type: 'Tank',
    category: 'Vessels',
    svg_path: 'M 10,10 L 50,10 L 50,70 L 10,70 Z M 10,50 L 50,50',
    default_width: 60,
    default_height: 80,
    connection_points: [
      { x_offset: 30, y_offset: 80, direction: 'bottom' },
      { x_offset: 30, y_offset: 10, direction: 'top' },
      { x_offset: 10, y_offset: 40, direction: 'left' },
      { x_offset: 50, y_offset: 40, direction: 'right' }
    ],
    default_properties: { capacity: '1000 gal', design_pressure: '50 PSI' },
    description: 'Vertical storage tank',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Horizontal Vessel',
    symbol_type: 'Vessel',
    category: 'Vessels',
    svg_path: 'M 20,30 m -15,0 a 15,15 0 0,1 0,-30 L 70,0 a 15,15 0 0,1 0,30 Z',
    default_width: 90,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 30, direction: 'left' },
      { x_offset: 90, y_offset: 30, direction: 'right' },
      { x_offset: 45, y_offset: 0, direction: 'top' },
      { x_offset: 45, y_offset: 60, direction: 'bottom' }
    ],
    default_properties: { capacity: '500 gal', design_pressure: '150 PSI' },
    description: 'Horizontal pressure vessel',
    is_standard: true
  },
  // Instruments
  {
    library_id: uuidv4(),
    symbol_name: 'Pressure Gauge',
    symbol_type: 'Instrument',
    category: 'Instruments',
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,5 L 20,15 M 20,25 L 20,35',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-300 PSI', tag: 'PG-001' },
    description: 'Local pressure gauge',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Temperature Element',
    symbol_type: 'Instrument',
    category: 'Instruments',
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,12 L 28,28 M 12,28 L 28,12',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-500 F', tag: 'TE-001' },
    description: 'Temperature element',
    is_standard: true
  },
  {
    library_id: uuidv4(),
    symbol_name: 'Level Transmitter',
    symbol_type: 'Instrument',
    category: 'Instruments',
    svg_path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,10 L 20,30 M 10,20 L 30,20',
    default_width: 40,
    default_height: 40,
    connection_points: [
      { x_offset: 20, y_offset: 40, direction: 'bottom' }
    ],
    default_properties: { range: '0-100%', tag: 'LT-001', output: '4-20mA' },
    description: 'Level transmitter',
    is_standard: true
  },
  // Motors
  {
    library_id: uuidv4(),
    symbol_name: 'Electric Motor',
    symbol_type: 'Motor',
    category: 'Motors',
    svg_path: 'M 25,25 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0 M 25,25 L 40,25',
    default_width: 50,
    default_height: 50,
    connection_points: [
      { x_offset: 50, y_offset: 25, direction: 'right' }
    ],
    default_properties: { power: '10 HP', voltage: '460V', rpm: '1800' },
    description: 'Electric motor',
    is_standard: true
  },
  // Heat Exchangers
  {
    library_id: uuidv4(),
    symbol_name: 'Shell and Tube Heat Exchanger',
    symbol_type: 'Heat Exchanger',
    category: 'Heat Exchangers',
    svg_path: 'M 10,10 L 70,10 L 70,50 L 10,50 Z M 20,20 L 60,20 M 20,30 L 60,30 M 20,40 L 60,40',
    default_width: 80,
    default_height: 60,
    connection_points: [
      { x_offset: 0, y_offset: 25, direction: 'left' },
      { x_offset: 80, y_offset: 25, direction: 'right' },
      { x_offset: 20, y_offset: 0, direction: 'top' },
      { x_offset: 60, y_offset: 60, direction: 'bottom' }
    ],
    default_properties: { duty: '1 MMBTU/hr', area: '100 sqft' },
    description: 'Shell and tube heat exchanger',
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
    'Equipment': 'EQ',
    'Custom': 'X'
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
  lineType: 'Process' | 'Utility' | 'Signal' | 'Electrical' = 'Process'
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
      stroke_color: lineType === 'Process' ? '#000000' : lineType === 'Signal' ? '#FF0000' : '#0000FF',
      stroke_width: lineType === 'Process' ? 3 : 2,
      dash_array: lineType === 'Signal' ? [5, 5] : null,
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
