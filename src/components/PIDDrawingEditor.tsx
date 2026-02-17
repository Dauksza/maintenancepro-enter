import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FloppyDisk,
  Download,
  Upload,
  Plus,
  Hand,
  Cursor,
  Path,
  TextT,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
  ArrowsIn,
  ArrowClockwise,
  ArrowCounterClockwise,
  Trash
} from '@phosphor-icons/react'
import type { PIDDrawing, SymbolLibraryItem, PIDSymbol } from '@/lib/types'
import {
  createBlankPIDDrawing,
  addSymbolToDrawing,
  connectSymbols,
  addAnnotation,
  exportDrawingToJSON,
  standardSymbolLibrary,
  moveSymbol,
  getSymbolAtPosition,
  deleteSymbol,
  rotateSymbol,
  scaleSymbol
} from '@/lib/pid-utils'

interface PIDDrawingEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drawings: PIDDrawing[]
  onSave: (drawing: PIDDrawing) => void
  initialDrawing?: PIDDrawing
}

type Tool = 'select' | 'pan' | 'symbol' | 'line' | 'text'

export function PIDDrawingEditor({
  open,
  onOpenChange,
  drawings,
  onSave,
  initialDrawing
}: PIDDrawingEditorProps) {
  const [currentDrawing, setCurrentDrawing] = useState<PIDDrawing>(
    initialDrawing || createBlankPIDDrawing()
  )
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolLibraryItem | null>(null)
  const [selectedDrawingSymbol, setSelectedDrawingSymbol] = useState<PIDSymbol | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [undoStack, setUndoStack] = useState<PIDDrawing[]>([])
  const [redoStack, setRedoStack] = useState<PIDDrawing[]>([])
  
  useEffect(() => {
    if (initialDrawing) {
      setCurrentDrawing(initialDrawing)
    } else if (!open) {
      // Reset to blank when dialog closes and no initial drawing
      setCurrentDrawing(createBlankPIDDrawing())
    }
  }, [open, initialDrawing])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === 'Escape') {
        setActiveTool('select')
        setSelectedDrawingSymbol(null)
      } else if (e.key === 'Delete' && selectedDrawingSymbol) {
        handleDeleteSymbol()
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault()
          handleRedo()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedDrawingSymbol, undoStack, redoStack])
  
  const pushToUndoStack = () => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentDrawing))])
    setRedoStack([]) // Clear redo stack on new action
  }
  
  const handleUndo = () => {
    if (undoStack.length === 0) return
    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(currentDrawing))])
    setCurrentDrawing(previousState)
    setUndoStack(prev => prev.slice(0, -1))
  }
  
  const handleRedo = () => {
    if (redoStack.length === 0) return
    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentDrawing))])
    setCurrentDrawing(nextState)
    setRedoStack(prev => prev.slice(0, -1))
  }
  
  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const x = (svgP.x - currentDrawing.pan_x) / zoomLevel
    const y = (svgP.y - currentDrawing.pan_y) / zoomLevel
    
    if (activeTool === 'symbol' && selectedSymbol) {
      pushToUndoStack()
      const updated = { ...currentDrawing }
      addSymbolToDrawing(updated, selectedSymbol, { x, y })
      setCurrentDrawing(updated)
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        pushToUndoStack()
        const updated = { ...currentDrawing }
        addAnnotation(updated, { x, y }, text)
        setCurrentDrawing(updated)
      }
    } else if (activeTool === 'select') {
      const symbol = getSymbolAtPosition(currentDrawing, x, y)
      setSelectedDrawingSymbol(symbol)
    }
  }
  
  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'pan') {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (activeTool === 'select' && selectedDrawingSymbol) {
      setIsDragging(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }
  
  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x
      const dy = e.clientY - lastPanPoint.y
      
      setCurrentDrawing(prev => ({
        ...prev,
        pan_x: prev.pan_x + dx / zoomLevel,
        pan_y: prev.pan_y + dy / zoomLevel
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (isDragging && selectedDrawingSymbol && svgRef.current) {
      const svg = svgRef.current
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
      const x = (svgP.x - currentDrawing.pan_x) / zoomLevel
      const y = (svgP.y - currentDrawing.pan_y) / zoomLevel
      
      const updated = { ...currentDrawing }
      moveSymbol(updated, selectedDrawingSymbol.symbol_id, x - selectedDrawingSymbol.width / 2, y - selectedDrawingSymbol.height / 2, currentDrawing.snap_to_grid)
      setCurrentDrawing(updated)
      
      // Update selected symbol reference
      const updatedSymbol = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
      if (updatedSymbol) {
        setSelectedDrawingSymbol(updatedSymbol)
      }
    }
  }
  
  const handleSVGMouseUp = () => {
    if (isPanning || isDragging) {
      pushToUndoStack()
    }
    setIsPanning(false)
    setIsDragging(false)
  }
  
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(prev => Math.max(0.3, Math.min(3.0, prev + delta)))
  }
  
  const handleDeleteSymbol = () => {
    if (!selectedDrawingSymbol) return
    pushToUndoStack()
    const updated = { ...currentDrawing }
    deleteSymbol(updated, selectedDrawingSymbol.symbol_id)
    setCurrentDrawing(updated)
    setSelectedDrawingSymbol(null)
  }
  
  const handleRotateSymbol = () => {
    if (!selectedDrawingSymbol) return
    pushToUndoStack()
    const updated = { ...currentDrawing }
    rotateSymbol(updated, selectedDrawingSymbol.symbol_id, 90)
    setCurrentDrawing(updated)
    const updatedSymbol = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
    if (updatedSymbol) {
      setSelectedDrawingSymbol(updatedSymbol)
    }
  }
  
  const handleScaleSymbol = (factor: number) => {
    if (!selectedDrawingSymbol) return
    pushToUndoStack()
    const updated = { ...currentDrawing }
    scaleSymbol(updated, selectedDrawingSymbol.symbol_id, factor)
    setCurrentDrawing(updated)
    const updatedSymbol = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
    if (updatedSymbol) {
      setSelectedDrawingSymbol(updatedSymbol)
    }
  }
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }
  
  // Get SVG path for a symbol from the library
  const getSymbolSVGPath = (symbol: PIDSymbol): string => {
    const libraryItem = standardSymbolLibrary.find(
      item => item.symbol_name === symbol.label || item.symbol_type === symbol.symbol_type
    )
    return libraryItem?.svg_path || ''
  }
  
  const handleSave = () => {
    onSave(currentDrawing)
    onOpenChange(false)
  }
  
  const handleExportJSON = () => {
    const json = exportDrawingToJSON(currentDrawing)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentDrawing.drawing_number}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3.0))
  }
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3))
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`flex flex-col ${isFullscreen ? 'max-w-full max-h-full w-screen h-screen' : 'max-w-[95vw] max-h-[95vh]'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>P&ID Drawing Editor</span>
            <Button onClick={toggleFullscreen} size="sm" variant="ghost">
              {isFullscreen ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
            </Button>
          </DialogTitle>
          <DialogDescription>
            {currentDrawing.drawing_title} - {currentDrawing.drawing_number} Rev {currentDrawing.revision}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Sidebar - Tools and Symbols */}
          <div className="w-64 flex flex-col gap-4">
            {/* Tools */}
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('select')}
                  title="Select and move symbols (Esc)"
                >
                  <Cursor className="h-4 w-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={activeTool === 'pan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('pan')}
                  title="Pan the canvas"
                >
                  <Hand className="h-4 w-4 mr-1" />
                  Pan
                </Button>
                <Button
                  variant={activeTool === 'symbol' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('symbol')}
                  title="Add symbols to the drawing"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Symbol
                </Button>
                <Button
                  variant={activeTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('line')}
                  title="Connect symbols"
                >
                  <Path className="h-4 w-4 mr-1" />
                  Line
                </Button>
                <Button
                  variant={activeTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('text')}
                  className="col-span-2"
                  title="Add text annotations"
                >
                  <TextT className="h-4 w-4 mr-1" />
                  Text
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Symbol operations when a symbol is selected */}
            {selectedDrawingSymbol && (
              <>
                <div className="space-y-2">
                  <Label>Selected: {selectedDrawingSymbol.label}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRotateSymbol}
                      title="Rotate 90° clockwise"
                    >
                      <ArrowClockwise className="h-4 w-4 mr-1" />
                      Rotate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteSymbol}
                      title="Delete symbol (Delete key)"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScaleSymbol(1.2)}
                      title="Scale up 20%"
                    >
                      Scale +
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScaleSymbol(0.8)}
                      title="Scale down 20%"
                    >
                      Scale -
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Tag: {selectedDrawingSymbol.tag_number}</div>
                    <div>Rotation: {selectedDrawingSymbol.rotation}°</div>
                    <div>Scale: {(selectedDrawingSymbol.scale * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {/* Symbol Library */}
            <div className="flex-1 flex flex-col">
              <Label className="mb-2">Symbol Library</Label>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {standardSymbolLibrary.map(symbol => (
                    <Button
                      key={symbol.library_id}
                      variant={selectedSymbol?.library_id === symbol.library_id ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSymbol(symbol)
                        setActiveTool('symbol')
                      }}
                    >
                      <span className="truncate">{symbol.symbol_name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={zoomOut} size="sm" variant="outline" title="Zoom out">
                <MagnifyingGlassMinus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">
                {(zoomLevel * 100).toFixed(0)}%
              </span>
              <Button onClick={zoomIn} size="sm" variant="outline" title="Zoom in (or use mouse wheel)">
                <MagnifyingGlassPlus className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Button 
                onClick={handleUndo} 
                size="sm" 
                variant="outline"
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
              >
                <ArrowCounterClockwise className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button 
                onClick={handleRedo} 
                size="sm" 
                variant="outline"
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
              >
                <ArrowClockwise className="h-4 w-4 mr-1" />
                Redo
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Button onClick={handleSave} size="sm">
                <FloppyDisk className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button onClick={handleExportJSON} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline">
                  {currentDrawing.symbols.length} Symbols
                </Badge>
                <Badge variant="outline">
                  {currentDrawing.connections.length} Connections
                </Badge>
              </div>
            </div>
            
            {/* SVG Canvas */}
            <div className="flex-1 border rounded-lg overflow-hidden bg-white">
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${currentDrawing.canvas_width} ${currentDrawing.canvas_height}`}
                onClick={handleSVGClick}
                onMouseDown={handleSVGMouseDown}
                onMouseMove={handleSVGMouseMove}
                onMouseUp={handleSVGMouseUp}
                onMouseLeave={handleSVGMouseUp}
                onWheel={handleWheel}
                className="cursor-crosshair"
                style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair' }}
              >
                <defs>
                  {/* Define markers for arrows */}
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="black" />
                  </marker>
                </defs>
                
                <g transform={`translate(${currentDrawing.pan_x}, ${currentDrawing.pan_y}) scale(${zoomLevel})`}>
                  {/* Grid */}
                  {currentDrawing.show_grid && (
                    <g className="grid">
                      {Array.from({ length: Math.ceil(currentDrawing.canvas_width / currentDrawing.grid_size) }).map((_, i) => (
                        <line
                          key={`grid-v-${i}`}
                          x1={i * currentDrawing.grid_size}
                          y1={0}
                          x2={i * currentDrawing.grid_size}
                          y2={currentDrawing.canvas_height}
                          stroke="#e0e0e0"
                          strokeWidth={0.5 / zoomLevel}
                        />
                      ))}
                      {Array.from({ length: Math.ceil(currentDrawing.canvas_height / currentDrawing.grid_size) }).map((_, i) => (
                        <line
                          key={`grid-h-${i}`}
                          x1={0}
                          y1={i * currentDrawing.grid_size}
                          x2={currentDrawing.canvas_width}
                          y2={i * currentDrawing.grid_size}
                          stroke="#e0e0e0"
                          strokeWidth={0.5 / zoomLevel}
                        />
                      ))}
                    </g>
                  )}
                  
                  {/* Connections */}
                  {currentDrawing.connections.map(conn => (
                    <g key={conn.connection_id}>
                      <polyline
                        points={conn.path_points.map(p => `${p.x},${p.y}`).join(' ')}
                        stroke={conn.style.stroke_color}
                        strokeWidth={conn.style.stroke_width}
                        fill="none"
                        strokeDasharray={conn.style.dash_array?.join(',') || 'none'}
                        opacity={conn.style.opacity}
                        markerEnd={conn.style.arrow_end ? 'url(#arrowhead)' : ''}
                      />
                    </g>
                  ))}
                  
                  {/* Symbols */}
                  {currentDrawing.symbols.map(symbol => {
                    const svgPath = getSymbolSVGPath(symbol)
                    const isSelected = selectedDrawingSymbol?.symbol_id === symbol.symbol_id
                    
                    return (
                      <g
                        key={symbol.symbol_id}
                        transform={`translate(${symbol.x}, ${symbol.y})`}
                        className={isSelected ? 'selected-symbol' : ''}
                      >
                        {/* Selection highlight */}
                        {isSelected && (
                          <rect
                            x={-5}
                            y={-5}
                            width={symbol.width + 10}
                            height={symbol.height + 10}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2 / zoomLevel}
                            strokeDasharray="5,5"
                          />
                        )}
                        
                        {/* Symbol with rotation and scale */}
                        <g transform={`translate(${symbol.width / 2}, ${symbol.height / 2}) rotate(${symbol.rotation}) scale(${symbol.scale}) translate(${-symbol.width / 2}, ${-symbol.height / 2})`}>
                          {/* Authentic SVG symbol */}
                          {svgPath ? (
                            <path
                              d={svgPath}
                              fill={symbol.style.fill_color}
                              stroke={symbol.style.stroke_color}
                              strokeWidth={symbol.style.stroke_width}
                              opacity={symbol.style.opacity}
                            />
                          ) : (
                            // Fallback rectangle if no SVG path
                            <rect
                              width={symbol.width}
                              height={symbol.height}
                              fill={symbol.style.fill_color}
                              stroke={symbol.style.stroke_color}
                              strokeWidth={symbol.style.stroke_width}
                              opacity={symbol.style.opacity}
                            />
                          )}
                        </g>
                        
                        {/* Label */}
                        <text
                          x={symbol.width / 2}
                          y={-5}
                          textAnchor="middle"
                          fontSize={12 / zoomLevel}
                          fill="#000000"
                        >
                          {symbol.label}
                        </text>
                        
                        {/* Tag number */}
                        <text
                          x={symbol.width / 2}
                          y={symbol.height + 15}
                          textAnchor="middle"
                          fontSize={10 / zoomLevel}
                          fontWeight="bold"
                          fill="#000000"
                        >
                          {symbol.tag_number}
                        </text>
                      </g>
                    )
                  })}
                  
                  {/* Annotations */}
                  {currentDrawing.annotations.map(ann => (
                    <g key={ann.annotation_id}>
                      {ann.border && ann.background_color && (
                        <rect
                          x={ann.x - 5}
                          y={ann.y - ann.font_size - 2}
                          width={100}
                          height={ann.font_size + 8}
                          fill={ann.background_color}
                          stroke={ann.color}
                          strokeWidth={1}
                        />
                      )}
                      <text
                        x={ann.x}
                        y={ann.y}
                        fontSize={ann.font_size}
                        fontFamily={ann.font_family}
                        fill={ann.color}
                      >
                        {ann.text}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>
          
          {/* Right Sidebar - Properties */}
          <div className="w-64 flex flex-col gap-4">
            <div>
              <Label>Drawing Properties</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={currentDrawing.drawing_title}
                    onChange={(e) =>
                      setCurrentDrawing({ ...currentDrawing, drawing_title: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Drawing Number</Label>
                  <Input
                    value={currentDrawing.drawing_number}
                    onChange={(e) =>
                      setCurrentDrawing({ ...currentDrawing, drawing_number: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={currentDrawing.metadata.status}
                    onValueChange={(value: 'Draft' | 'In Review' | 'Approved' | 'Superseded' | 'Archived') =>
                      setCurrentDrawing({
                        ...currentDrawing,
                        metadata: { ...currentDrawing.metadata, status: value }
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Superseded">Superseded</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Grid Settings</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentDrawing.show_grid}
                    onChange={(e) =>
                      setCurrentDrawing({ ...currentDrawing, show_grid: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label className="text-sm">Show Grid</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentDrawing.snap_to_grid}
                    onChange={(e) =>
                      setCurrentDrawing({ ...currentDrawing, snap_to_grid: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label className="text-sm">Snap to Grid</Label>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Tips:</strong></div>
              <div>• Esc - Select tool</div>
              <div>• Delete - Remove selected</div>
              <div>• Ctrl+Z - Undo</div>
              <div>• Ctrl+Y - Redo</div>
              <div>• Mouse wheel - Zoom</div>
              <div>• Drag in Pan mode - Move canvas</div>
              <div>• Drag symbol in Select mode - Move it</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
