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
  Save,
  Download,
  Upload,
  Plus,
  Hand,
  Cursor,
  Path,
  TextT,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus
} from '@phosphor-icons/react'
import type { PIDDrawing, SymbolLibraryItem } from '@/lib/types'
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
  rotateSymbol
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
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    if (initialDrawing) {
      setCurrentDrawing(initialDrawing)
    } else if (!open) {
      // Reset to blank when dialog closes and no initial drawing
      setCurrentDrawing(createBlankPIDDrawing())
    }
  }, [open, initialDrawing])
  
  useEffect(() => {
    renderDrawing()
  }, [currentDrawing, zoomLevel])
  
  const renderDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply zoom and pan
    ctx.save()
    ctx.scale(zoomLevel, zoomLevel)
    ctx.translate(currentDrawing.pan_x, currentDrawing.pan_y)
    
    // Draw grid
    if (currentDrawing.show_grid) {
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 0.5
      const gridSize = currentDrawing.grid_size
      
      for (let x = 0; x < currentDrawing.canvas_width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, currentDrawing.canvas_height)
        ctx.stroke()
      }
      
      for (let y = 0; y < currentDrawing.canvas_height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(currentDrawing.canvas_width, y)
        ctx.stroke()
      }
    }
    
    // Draw connections
    currentDrawing.connections.forEach(conn => {
      ctx.strokeStyle = conn.style.stroke_color
      ctx.lineWidth = conn.style.stroke_width
      ctx.globalAlpha = conn.style.opacity
      
      if (conn.style.dash_array) {
        ctx.setLineDash(conn.style.dash_array)
      } else {
        ctx.setLineDash([])
      }
      
      ctx.beginPath()
      if (conn.path_points.length > 0) {
        ctx.moveTo(conn.path_points[0].x, conn.path_points[0].y)
        for (let i = 1; i < conn.path_points.length; i++) {
          ctx.lineTo(conn.path_points[i].x, conn.path_points[i].y)
        }
      }
      ctx.stroke()
      
      // Draw arrow at end if needed
      if (conn.style.arrow_end && conn.path_points.length >= 2) {
        const last = conn.path_points[conn.path_points.length - 1]
        const prev = conn.path_points[conn.path_points.length - 2]
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
        
        ctx.save()
        ctx.translate(last.x, last.y)
        ctx.rotate(angle)
        ctx.fillStyle = conn.style.stroke_color
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-10, -5)
        ctx.lineTo(-10, 5)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    })
    
    // Draw symbols
    currentDrawing.symbols.forEach(symbol => {
      ctx.save()
      ctx.translate(symbol.x + symbol.width / 2, symbol.y + symbol.height / 2)
      ctx.rotate((symbol.rotation * Math.PI) / 180)
      ctx.scale(symbol.scale, symbol.scale)
      ctx.translate(-symbol.width / 2, -symbol.height / 2)
      
      // Draw symbol rectangle (placeholder for actual symbol)
      ctx.fillStyle = symbol.style.fill_color
      ctx.strokeStyle = symbol.style.stroke_color
      ctx.lineWidth = symbol.style.stroke_width
      ctx.globalAlpha = symbol.style.opacity
      
      ctx.fillRect(0, 0, symbol.width, symbol.height)
      ctx.strokeRect(0, 0, symbol.width, symbol.height)
      
      // Draw label
      ctx.fillStyle = '#000000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(symbol.label, symbol.width / 2, -5)
      
      // Draw tag number
      ctx.font = 'bold 10px Arial'
      ctx.fillText(symbol.tag_number, symbol.width / 2, symbol.height + 15)
      
      ctx.restore()
    })
    
    // Draw annotations
    currentDrawing.annotations.forEach(ann => {
      ctx.fillStyle = ann.color
      ctx.font = `${ann.font_size}px ${ann.font_family}`
      ctx.fillText(ann.text, ann.x, ann.y)
      
      if (ann.border && ann.background_color) {
        const metrics = ctx.measureText(ann.text)
        ctx.fillStyle = ann.background_color
        ctx.fillRect(ann.x - 5, ann.y - ann.font_size - 2, metrics.width + 10, ann.font_size + 8)
      }
    })
    
    ctx.restore()
  }
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoomLevel - currentDrawing.pan_x
    const y = (e.clientY - rect.top) / zoomLevel - currentDrawing.pan_y
    
    if (activeTool === 'symbol' && selectedSymbol) {
      const updated = { ...currentDrawing }
      addSymbolToDrawing(updated, selectedSymbol, { x, y })
      setCurrentDrawing(updated)
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        const updated = { ...currentDrawing }
        addAnnotation(updated, { x, y }, text)
        setCurrentDrawing(updated)
      }
    } else if (activeTool === 'select') {
      const symbol = getSymbolAtPosition(currentDrawing, x, y)
      if (symbol) {
        // Symbol selected - could show properties panel
        console.log('Selected symbol:', symbol)
      }
    }
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>P&ID Drawing Editor</DialogTitle>
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
                >
                  <Cursor className="h-4 w-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={activeTool === 'pan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('pan')}
                >
                  <Hand className="h-4 w-4 mr-1" />
                  Pan
                </Button>
                <Button
                  variant={activeTool === 'symbol' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('symbol')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Symbol
                </Button>
                <Button
                  variant={activeTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('line')}
                >
                  <Path className="h-4 w-4 mr-1" />
                  Line
                </Button>
                <Button
                  variant={activeTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('text')}
                  className="col-span-2"
                >
                  <TextT className="h-4 w-4 mr-1" />
                  Text
                </Button>
              </div>
            </div>
            
            <Separator />
            
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
            <div className="flex items-center gap-2">
              <Button onClick={zoomOut} size="sm" variant="outline">
                <MagnifyingGlassMinus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">
                {(zoomLevel * 100).toFixed(0)}%
              </span>
              <Button onClick={zoomIn} size="sm" variant="outline">
                <MagnifyingGlassPlus className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-1" />
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
            
            {/* Canvas */}
            <div className="flex-1 border rounded-lg overflow-auto bg-white">
              <canvas
                ref={canvasRef}
                width={currentDrawing.canvas_width}
                height={currentDrawing.canvas_height}
                onClick={handleCanvasClick}
                className="cursor-crosshair"
              />
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
                    onValueChange={(value: any) =>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
