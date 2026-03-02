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
  scaleSymbol,
  snapToConnectionPoint
} from '@/lib/pid-utils'

interface PIDDrawingEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drawings: PIDDrawing[]
  onSave: (drawing: PIDDrawing) => void
  initialDrawing?: PIDDrawing
}

type Tool = 'select' | 'pan' | 'symbol' | 'line' | 'text'

type LineType = 'Process' | 'Utility' | 'Signal' | 'Electrical' | 'Hydraulic' | 'Pneumatic' | 'Mechanical'

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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [undoStack, setUndoStack] = useState<PIDDrawing[]>([])
  const [redoStack, setRedoStack] = useState<PIDDrawing[]>([])
  const [lineDrawingState, setLineDrawingState] = useState<{
    fromSymbol: PIDSymbol | null
    fromPointId: string | null
  }>({ fromSymbol: null, fromPointId: null })
  const [selectedLineType, setSelectedLineType] = useState<LineType>('Process')
  const [hoveredSymbol, setHoveredSymbol] = useState<PIDSymbol | null>(null)
  const [symbolCategory, setSymbolCategory] = useState<string>('All')
  const [symbolSearch, setSymbolSearch] = useState<string>('')
  
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
      
      if (e.key === 'F11') {
        e.preventDefault()
        setIsFullscreen(prev => !prev)
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
          return
        }
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
    } else if (activeTool === 'line') {
      // Line drawing mode - connect two symbols
      const symbol = getSymbolAtPosition(currentDrawing, x, y)
      
      if (symbol && symbol.connection_points.length > 0) {
        // Find the closest connection point
        const closestPoint = findClosestConnectionPoint(symbol, x, y)
        
        if (!lineDrawingState.fromSymbol) {
          // First click - select start point
          setLineDrawingState({
            fromSymbol: symbol,
            fromPointId: closestPoint.point_id
          })
        } else if (lineDrawingState.fromSymbol.symbol_id !== symbol.symbol_id) {
          // Second click - connect to end point
          pushToUndoStack()
          const updated = { ...currentDrawing }
          connectSymbols(
            updated,
            lineDrawingState.fromSymbol.symbol_id,
            lineDrawingState.fromPointId!,
            symbol.symbol_id,
            closestPoint.point_id,
            selectedLineType
          )
          setCurrentDrawing(updated)
          setLineDrawingState({ fromSymbol: null, fromPointId: null })
        } else {
          // Clicked same symbol - reset
          setLineDrawingState({ fromSymbol: null, fromPointId: null })
        }
      }
    }
  }
  
  // Find the closest connection point on a symbol
  const findClosestConnectionPoint = (symbol: PIDSymbol, clickX: number, clickY: number) => {
    let closest = symbol.connection_points[0]
    let minDist = Infinity
    
    for (const point of symbol.connection_points) {
      const pointX = symbol.x + point.x_offset
      const pointY = symbol.y + point.y_offset
      const dist = Math.sqrt(Math.pow(clickX - pointX, 2) + Math.pow(clickY - pointY, 2))
      
      if (dist < minDist) {
        minDist = dist
        closest = point
      }
    }
    
    return closest
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
      const rawX = (svgP.x - currentDrawing.pan_x) / zoomLevel - selectedDrawingSymbol.width / 2
      const rawY = (svgP.y - currentDrawing.pan_y) / zoomLevel - selectedDrawingSymbol.height / 2
      
      const updated = { ...currentDrawing }
      
      // Apply grid snap first
      let finalX = currentDrawing.snap_to_grid ? Math.round(rawX / updated.grid_size) * updated.grid_size : rawX
      let finalY = currentDrawing.snap_to_grid ? Math.round(rawY / updated.grid_size) * updated.grid_size : rawY
      
      // Then check snap to grip (connection point snapping)
      if (updated.snap_to_grip) {
        const gripResult = snapToConnectionPoint(updated, selectedDrawingSymbol.symbol_id, finalX, finalY)
        if (gripResult.snapped) {
          finalX = gripResult.x
          finalY = gripResult.y
        }
      }
      
      moveSymbol(updated, selectedDrawingSymbol.symbol_id, finalX, finalY, false)
      setCurrentDrawing(updated)
      
      const updatedSymbol = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
      if (updatedSymbol) {
        setSelectedDrawingSymbol(updatedSymbol)
      }
    } else if (activeTool === 'line' && svgRef.current) {
      // Update hovered symbol for connection point highlighting
      const svg = svgRef.current
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
      const x = (svgP.x - currentDrawing.pan_x) / zoomLevel
      const y = (svgP.y - currentDrawing.pan_y) / zoomLevel
      
      const symbol = getSymbolAtPosition(currentDrawing, x, y)
      setHoveredSymbol(symbol)
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

  const handleUpdateSymbolLabel = (newLabel: string) => {
    if (!selectedDrawingSymbol) return
    const updated = { ...currentDrawing }
    const sym = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
    if (sym) {
      sym.label = newLabel
      setCurrentDrawing(updated)
      setSelectedDrawingSymbol({ ...sym })
    }
  }

  const handleUpdateSymbolDescription = (newDesc: string) => {
    if (!selectedDrawingSymbol) return
    const updated = { ...currentDrawing }
    const sym = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
    if (sym) {
      sym.description = newDesc
      setCurrentDrawing(updated)
      setSelectedDrawingSymbol({ ...sym })
    }
  }

  const handleUpdateSymbolTag = (newTag: string) => {
    if (!selectedDrawingSymbol) return
    const updated = { ...currentDrawing }
    const sym = updated.symbols.find(s => s.symbol_id === selectedDrawingSymbol.symbol_id)
    if (sym) {
      sym.tag_number = newTag
      setCurrentDrawing(updated)
      setSelectedDrawingSymbol({ ...sym })
    }
  }
  
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
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
      <DialogContent className={`flex flex-col p-0 overflow-hidden gap-0 ${isFullscreen ? 'pid-editor-fullscreen' : 'max-w-[95vw] max-h-[95vh]'}`}>
        <DialogHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>P&amp;ID Drawing Editor</span>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setLeftSidebarOpen(prev => !prev)}
                size="sm"
                variant="ghost"
                title="Toggle left panel"
                aria-label={leftSidebarOpen ? 'Collapse tools and symbols panel' : 'Expand tools and symbols panel'}
              >
                {leftSidebarOpen ? '◀' : '▶'}
              </Button>
              <Button
                onClick={() => setRightSidebarOpen(prev => !prev)}
                size="sm"
                variant="ghost"
                title="Toggle right panel"
                aria-label={rightSidebarOpen ? 'Collapse properties panel' : 'Expand properties panel'}
              >
                {rightSidebarOpen ? '▶' : '◀'}
              </Button>
              <Button onClick={toggleFullscreen} size="sm" variant="ghost" title={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}>
                {isFullscreen ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {currentDrawing.drawing_title} - {currentDrawing.drawing_number} Rev {currentDrawing.revision}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
          {/* Left Sidebar - Tools and Symbols */}
          {leftSidebarOpen && (
          <nav aria-label="Tools and Symbols" className="w-56 flex flex-col gap-3 overflow-y-auto border-r p-3 shrink-0">
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
            
            {/* Line drawing options when line tool is active */}
            {activeTool === 'line' && (
              <>
                <div className="space-y-2">
                  <Label>Line Type</Label>
                  <select
                    value={selectedLineType}
                    onChange={(e) => setSelectedLineType(e.target.value as LineType)}
                    className="w-full border rounded-md p-2 text-sm"
                  >
                    <option value="Process">Process (Black)</option>
                    <option value="Utility">Utility (Blue)</option>
                    <option value="Signal">Signal (Red Dashed)</option>
                    <option value="Electrical">Electrical (Blue)</option>
                    <option value="Hydraulic">Hydraulic (Orange)</option>
                    <option value="Pneumatic">Pneumatic (Green)</option>
                    <option value="Mechanical">Mechanical (Brown)</option>
                  </select>
                  
                  {lineDrawingState.fromSymbol && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm">
                      <p className="font-medium text-green-800">Step 2:</p>
                      <p className="text-green-700 text-xs mt-1">
                        Click on another symbol to connect
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => setLineDrawingState({ fromSymbol: null, fromPointId: null })}
                      >
                        Cancel Connection
                      </Button>
                    </div>
                  )}
                  
                  {!lineDrawingState.fromSymbol && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      <p className="font-medium text-blue-800">Step 1:</p>
                      <p className="text-blue-700 text-xs mt-1">
                        Click on a symbol to start connecting
                      </p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}
            
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
              <input
                type="text"
                placeholder="Search symbols..."
                value={symbolSearch}
                onChange={e => setSymbolSearch(e.target.value)}
                className="w-full border rounded-md p-1 text-xs mb-2"
              />
              <select
                value={symbolCategory}
                onChange={e => setSymbolCategory(e.target.value)}
                className="w-full border rounded-md p-1 text-xs mb-2"
              >
                <option value="All">All Categories</option>
                {Array.from(new Set(standardSymbolLibrary.map(s => s.category))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {standardSymbolLibrary
                    .filter(sym =>
                      (symbolCategory === 'All' || sym.category === symbolCategory) &&
                      (symbolSearch === '' || sym.symbol_name.toLowerCase().includes(symbolSearch.toLowerCase()))
                    )
                    .map(symbol => (
                      <Button
                        key={symbol.library_id}
                        variant={selectedSymbol?.library_id === symbol.library_id ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-xs h-9 gap-1.5"
                        title={symbol.description}
                        onClick={() => {
                          setSelectedSymbol(symbol)
                          setActiveTool('symbol')
                        }}
                      >
                        {/* Mini SVG preview of the symbol */}
                        <svg
                          width="22"
                          height="22"
                          viewBox={`0 0 ${symbol.default_width} ${symbol.default_height}`}
                          className="shrink-0 overflow-visible"
                          aria-hidden="true"
                        >
                          <path
                            d={symbol.svg_path}
                            fill="var(--background, white)"
                            stroke="currentColor"
                            strokeWidth={Math.max(1.5, symbol.default_width / 20)}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="truncate">{symbol.symbol_name}</span>
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </nav>
          )}
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden p-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
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
            <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
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
                    const isHovered = hoveredSymbol?.symbol_id === symbol.symbol_id
                    const isLineStart = lineDrawingState.fromSymbol?.symbol_id === symbol.symbol_id
                    
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
                        
                        {/* Line mode start symbol highlight */}
                        {isLineStart && (
                          <rect
                            x={-3}
                            y={-3}
                            width={symbol.width + 6}
                            height={symbol.height + 6}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={2 / zoomLevel}
                            strokeDasharray="3,3"
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
                        
                        {/* Instrument / element code inside the symbol body (e.g. PI, PT, LT) */}
                        {symbol.properties.code && (
                          <text
                            x={symbol.width / 2}
                            // Vertically centre text: SVG text y is the baseline, so shift down by ~35% of font size
                            y={symbol.height / 2 + Math.min(10, symbol.width * 0.22) * 0.35 / zoomLevel}
                            textAnchor="middle"
                            fontSize={Math.min(10, symbol.width * 0.22) / zoomLevel}
                            fontWeight="bold"
                            fill="#000000"
                            pointerEvents="none"
                          >
                            {String(symbol.properties.code)}
                          </text>
                        )}
                        
                        {/* Connection points - show in line mode or when hovered */}
                        {(activeTool === 'line' || isHovered) && symbol.connection_points.map(point => (
                          <circle
                            key={point.point_id}
                            cx={point.x_offset}
                            cy={point.y_offset}
                            r={4 / zoomLevel}
                            fill={isLineStart ? '#10b981' : '#3b82f6'}
                            stroke="#ffffff"
                            strokeWidth={1 / zoomLevel}
                            opacity={0.8}
                          />
                        ))}
                        
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
          {rightSidebarOpen && (
          <aside aria-label="Drawing Properties" className="w-56 flex flex-col gap-3 overflow-y-auto border-l p-3 shrink-0">
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentDrawing.snap_to_grip}
                    onChange={(e) =>
                      setCurrentDrawing({ ...currentDrawing, snap_to_grip: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label className="text-sm">Snap to Grip</Label>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Selected Symbol Properties */}
            {selectedDrawingSymbol && (
              <>
                <div>
                  <Label className="font-semibold text-sm">Symbol Properties</Label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name / Label</Label>
                      <Input
                        value={selectedDrawingSymbol.label}
                        onChange={e => handleUpdateSymbolLabel(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tag Number</Label>
                      <Input
                        value={selectedDrawingSymbol.tag_number}
                        onChange={e => handleUpdateSymbolTag(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <textarea
                        value={selectedDrawingSymbol.description || ''}
                        onChange={e => handleUpdateSymbolDescription(e.target.value)}
                        className="w-full border rounded-md p-1 text-xs h-16 resize-none"
                        placeholder="Enter description..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <div className="text-xs font-medium py-1">{selectedDrawingSymbol.symbol_type}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <div className="text-xs text-muted-foreground">
                        X: {Math.round(selectedDrawingSymbol.x)}, Y: {Math.round(selectedDrawingSymbol.y)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rotation</Label>
                      <div className="text-xs text-muted-foreground">{selectedDrawingSymbol.rotation}°</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Scale</Label>
                      <div className="text-xs text-muted-foreground">
                        {(selectedDrawingSymbol.scale * 100).toFixed(0)}%
                      </div>
                    </div>
                    {Object.entries(selectedDrawingSymbol.properties)
                      .filter(([k]) => k !== 'description')
                      .map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          <Input
                            value={String(value)}
                            onChange={e => {
                              const updated = { ...currentDrawing }
                              const sym = updated.symbols.find(
                                s => s.symbol_id === selectedDrawingSymbol.symbol_id
                              )
                              if (sym) {
                                sym.properties = { ...sym.properties, [key]: e.target.value }
                                setCurrentDrawing(updated)
                                setSelectedDrawingSymbol({ ...sym })
                              }
                            }}
                            className="h-7 text-xs"
                          />
                        </div>
                      ))}
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Tips:</strong></div>
              <div>• F11 - Toggle fullscreen</div>
              <div>• Esc - Select tool / Exit fullscreen</div>
              <div>• Delete - Remove selected</div>
              <div>• Ctrl+Z - Undo</div>
              <div>• Ctrl+Y - Redo</div>
              <div>• Mouse wheel - Zoom</div>
              <div>• Drag in Pan mode - Move canvas</div>
              <div>• Drag symbol in Select mode - Move it</div>
            </div>
          </aside>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
