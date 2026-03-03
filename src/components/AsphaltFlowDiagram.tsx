import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  GitBranch, Play, Pause, Plus, Trash, PencilSimple,
  ArrowCounterClockwise, ArrowClockwise, Link, CursorClick,
  MagnifyingGlassMinus, MagnifyingGlassPlus, ArrowsOut,
  X, DownloadSimple, ArrowUUpLeft,
} from '@phosphor-icons/react'
import { v4 as uuidv4 } from 'uuid'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface FlowNode {
  id: string
  label: string
  sublabel: string
  x: number
  y: number
  w: number
  h: number
  color: string
  icon: string
}

interface Connection {
  id: string
  from: string
  to: string
  label: string
  color: string
  duration: number
}

type EditMode = 'view' | 'select' | 'connect' | 'delete' | 'addNode'

interface HistoryEntry {
  nodes: FlowNode[]
  connections: Connection[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Default layout (same as original diagram)
// ──────────────────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  railcar:  '#6366f1',
  pump:     '#f59e0b',
  tank:     '#3b82f6',
  hotmix:   '#ef4444',
  ptank:    '#10b981',
  manifold: '#8b5cf6',
  tanker:   '#0ea5e9',
}

const DEFAULT_NODES: FlowNode[] = [
  { id: 'railcar',  label: 'Rail Car',      sublabel: 'AC Receipt',   x: 20,  y: 55,  w: 90, h: 56, color: STAGE_COLORS.railcar,  icon: '🚃' },
  { id: 'pump1',    label: 'Pump',          sublabel: 'Unload',       x: 155, y: 67,  w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'tank1',    label: 'Storage Tank',  sublabel: 'AC Supply',    x: 262, y: 48,  w: 92, h: 72, color: STAGE_COLORS.tank,    icon: '🛢' },
  { id: 'pump2',    label: 'Pump',          sublabel: 'Transfer',     x: 408, y: 67,  w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'hotmix',   label: 'Hot Mix',       sublabel: 'Chamber',      x: 520, y: 50,  w: 96, h: 68, color: STAGE_COLORS.hotmix,  icon: '🔥' },
  { id: 'ptank',    label: 'Product Tank',  sublabel: 'Mixed AC',     x: 520, y: 210, w: 96, h: 72, color: STAGE_COLORS.ptank,   icon: '🛢' },
  { id: 'pump3',    label: 'Pump',          sublabel: 'Load',         x: 408, y: 228, w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'manifold', label: 'Manifold',      sublabel: 'Distribution', x: 262, y: 213, w: 92, h: 62, color: STAGE_COLORS.manifold, icon: '⊞' },
  { id: 'pump4',    label: 'Pump',          sublabel: 'Transfer',     x: 155, y: 228, w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'tanker',   label: 'Tanker',        sublabel: 'Loading',      x: 20,  y: 208, w: 90, h: 68, color: STAGE_COLORS.tanker,  icon: '🚛' },
]

const DEFAULT_CONNECTIONS: Connection[] = [
  { id: 'c1', from: 'railcar',  to: 'pump1',    label: 'Unloading',  color: STAGE_COLORS.railcar,  duration: 2.0 },
  { id: 'c2', from: 'pump1',    to: 'tank1',    label: 'Fill',       color: STAGE_COLORS.pump,    duration: 1.6 },
  { id: 'c3', from: 'tank1',    to: 'pump2',    label: 'Supply',     color: STAGE_COLORS.tank,    duration: 1.8 },
  { id: 'c4', from: 'pump2',    to: 'hotmix',   label: 'Inject',     color: STAGE_COLORS.pump,    duration: 1.5 },
  { id: 'c5', from: 'hotmix',   to: 'ptank',    label: 'Discharge',  color: STAGE_COLORS.hotmix,  duration: 2.2 },
  { id: 'c6', from: 'ptank',    to: 'pump3',    label: 'Transfer',   color: STAGE_COLORS.ptank,   duration: 1.6 },
  { id: 'c7', from: 'pump3',    to: 'manifold', label: 'Distribute', color: STAGE_COLORS.pump,    duration: 1.5 },
  { id: 'c8', from: 'manifold', to: 'pump4',    label: 'Route',      color: STAGE_COLORS.manifold, duration: 1.8 },
  { id: 'c9', from: 'pump4',    to: 'tanker',   label: 'Load',       color: STAGE_COLORS.tanker,  duration: 2.0 },
]

const VIEWBOX_W = 880
const VIEWBOX_H = 340

// ──────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ──────────────────────────────────────────────────────────────────────────────

function ncx(n: FlowNode) { return n.x + n.w / 2 }
function ncy(n: FlowNode) { return n.y + n.h / 2 }

function buildPath(a: FlowNode, b: FlowNode): string {
  const ax = ncx(a), ay = ncy(a), bx = ncx(b), by = ncy(b)
  if (Math.abs(ay - by) < 2) return `M ${ax} ${ay} L ${bx} ${by}`
  return `M ${ax} ${ay} L ${bx} ${ay} L ${bx} ${by}`
}

function pathMidpoint(d: string): { x: number; y: number } {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  if (nums.length >= 4) {
    return { x: (nums[0] + nums[nums.length - 2]) / 2, y: (nums[1] + nums[nums.length - 1]) / 2 }
  }
  return { x: 0, y: 0 }
}

// ──────────────────────────────────────────────────────────────────────────────
// Toolbar button helper
// ──────────────────────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  title,
  children,
  destructive,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        'flex items-center justify-center w-8 h-8 rounded-md text-sm transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : destructive
            ? 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'
            : 'hover:bg-accent text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export function AsphaltFlowDiagram() {
  // Core diagram state
  const [nodes, setNodes] = useState<FlowNode[]>(() => DEFAULT_NODES.map(n => ({ ...n })))
  const [connections, setConnections] = useState<Connection[]>(() => DEFAULT_CONNECTIONS.map(c => ({ ...c })))

  // Interaction modes
  const [mode, setMode] = useState<EditMode>('view')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'node' | 'connection' | null>(null)
  const [connectStart, setConnectStart] = useState<string | null>(null)
  const [running, setRunning] = useState(true)

  // Viewport
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Undo/redo history
  const [history, setHistory] = useState<HistoryEntry[]>([
    { nodes: DEFAULT_NODES.map(n => ({ ...n })), connections: DEFAULT_CONNECTIONS.map(c => ({ ...c })) }
  ])
  const [histIdx, setHistIdx] = useState(0)

  // Drag ref
  const dragRef = useRef<{
    nodeId: string
    startSvgX: number
    startSvgY: number
    origX: number
    origY: number
  } | null>(null)

  // Pan ref
  const panRef = useRef<{
    startClientX: number
    startClientY: number
    origPan: { x: number; y: number }
  } | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

  // Derived: selected objects
  const selectedNode = selectedType === 'node' ? nodes.find(n => n.id === selectedId) ?? null : null
  const selectedConn = selectedType === 'connection' ? connections.find(c => c.id === selectedId) ?? null : null

  // ── History ──────────────────────────────────────────────────────────────────

  const pushHistory = useCallback((newNodes: FlowNode[], newConns: Connection[]) => {
    const entry: HistoryEntry = {
      nodes: newNodes.map(n => ({ ...n })),
      connections: newConns.map(c => ({ ...c })),
    }
    setHistory(h => {
      const trimmed = h.slice(0, histIdx + 1)
      return [...trimmed, entry].slice(-50)
    })
    setHistIdx(i => Math.min(i + 1, 49))
  }, [histIdx])

  const undo = useCallback(() => {
    if (histIdx <= 0) return
    const prev = history[histIdx - 1]
    setNodes(prev.nodes.map(n => ({ ...n })))
    setConnections(prev.connections.map(c => ({ ...c })))
    setHistIdx(i => i - 1)
    setSelectedId(null)
  }, [history, histIdx])

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return
    const next = history[histIdx + 1]
    setNodes(next.nodes.map(n => ({ ...n })))
    setConnections(next.connections.map(c => ({ ...c })))
    setHistIdx(i => i + 1)
    setSelectedId(null)
  }, [history, histIdx])

  // ── Coordinate conversion ─────────────────────────────────────────────────────

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const vbX = -pan.x / zoom
    const vbY = -pan.y / zoom
    const vbW = VIEWBOX_W / zoom
    const vbH = VIEWBOX_H / zoom
    return {
      x: vbX + ((clientX - rect.left) / rect.width) * vbW,
      y: vbY + ((clientY - rect.top) / rect.height) * vbH,
    }
  }, [zoom, pan])

  const viewBox = `${-pan.x / zoom} ${-pan.y / zoom} ${VIEWBOX_W / zoom} ${VIEWBOX_H / zoom}`

  // ── Pointer events ────────────────────────────────────────────────────────────

  const handleNodePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation()

    if (mode === 'delete') {
      const newNodes = nodes.filter(n => n.id !== nodeId)
      const newConns = connections.filter(c => c.from !== nodeId && c.to !== nodeId)
      setNodes(newNodes)
      setConnections(newConns)
      pushHistory(newNodes, newConns)
      setSelectedId(null)
      return
    }

    if (mode === 'connect') {
      if (!connectStart) {
        setConnectStart(nodeId)
      } else if (connectStart !== nodeId) {
        const fromNode = nodes.find(n => n.id === connectStart)!
        const newConn: Connection = {
          id: uuidv4(),
          from: connectStart,
          to: nodeId,
          label: 'Flow',
          color: fromNode.color,
          duration: 1.8,
        }
        const newConns = [...connections, newConn]
        setConnections(newConns)
        pushHistory(nodes, newConns)
        setConnectStart(null)
      } else {
        setConnectStart(null)
      }
      return
    }

    // select / view — begin drag
    setSelectedId(nodeId)
    setSelectedType('node')
    const svgPt = clientToSvg(e.clientX, e.clientY)
    const n = nodes.find(nn => nn.id === nodeId)!
    dragRef.current = { nodeId, startSvgX: svgPt.x, startSvgY: svgPt.y, origX: n.x, origY: n.y }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [mode, nodes, connections, connectStart, clientToSvg, pushHistory])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      const svgPt = clientToSvg(e.clientX, e.clientY)
      const dx = svgPt.x - dragRef.current.startSvgX
      const dy = svgPt.y - dragRef.current.startSvgY
      setNodes(ns => ns.map(n =>
        n.id === dragRef.current!.nodeId
          ? { ...n, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy }
          : n
      ))
      return
    }
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startClientX
      const dy = e.clientY - panRef.current.startClientY
      setPan({ x: panRef.current.origPan.x + dx, y: panRef.current.origPan.y + dy })
    }
  }, [clientToSvg])

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    if (dragRef.current) {
      pushHistory(nodes, connections)
      dragRef.current = null
    }
    if (panRef.current) {
      panRef.current = null
    }
  }, [nodes, connections, pushHistory])

  const handleSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const tgt = e.target as Element
    if (tgt !== svgRef.current && !tgt.classList.contains('svg-bg')) return

    if (mode === 'addNode') {
      const svgPt = clientToSvg(e.clientX, e.clientY)
      const newNode: FlowNode = {
        id: uuidv4(),
        label: 'New Node',
        sublabel: 'Equipment',
        x: svgPt.x - 46,
        y: svgPt.y - 28,
        w: 92,
        h: 56,
        color: '#6366f1',
        icon: '📦',
      }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      pushHistory(newNodes, connections)
      setSelectedId(newNode.id)
      setSelectedType('node')
      setMode('select')
      return
    }

    if (mode === 'view' || mode === 'select') {
      panRef.current = { startClientX: e.clientX, startClientY: e.clientY, origPan: { ...pan } }
      setSelectedId(null)
    }
  }, [mode, clientToSvg, nodes, connections, pan, pushHistory])

  const handleConnectionClick = useCallback((e: React.MouseEvent, connId: string) => {
    e.stopPropagation()
    if (mode === 'delete') {
      const newConns = connections.filter(c => c.id !== connId)
      setConnections(newConns)
      pushHistory(nodes, newConns)
      setSelectedId(null)
      return
    }
    setSelectedId(connId)
    setSelectedType('connection')
  }, [mode, nodes, connections, pushHistory])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.max(0.3, Math.min(3, z + delta)))
  }, [])

  // ── Edit helpers ──────────────────────────────────────────────────────────────

  const updateNode = useCallback((field: keyof FlowNode, value: string | number) => {
    setNodes(ns => ns.map(n => n.id === selectedId ? { ...n, [field]: value } : n))
  }, [selectedId])

  const commitNodeEdit = useCallback(() => {
    pushHistory(nodes, connections)
  }, [nodes, connections, pushHistory])

  const updateConnection = useCallback((field: keyof Connection, value: string | number) => {
    setConnections(cs => cs.map(c => c.id === selectedId ? { ...c, [field]: value } : c))
  }, [selectedId])

  const commitConnEdit = useCallback(() => {
    pushHistory(nodes, connections)
  }, [nodes, connections, pushHistory])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    if (selectedType === 'node') {
      const newNodes = nodes.filter(n => n.id !== selectedId)
      const newConns = connections.filter(c => c.from !== selectedId && c.to !== selectedId)
      setNodes(newNodes)
      setConnections(newConns)
      pushHistory(newNodes, newConns)
    } else {
      const newConns = connections.filter(c => c.id !== selectedId)
      setConnections(newConns)
      pushHistory(nodes, newConns)
    }
    setSelectedId(null)
  }, [selectedId, selectedType, nodes, connections, pushHistory])

  const resetDiagram = useCallback(() => {
    const n = DEFAULT_NODES.map(x => ({ ...x }))
    const c = DEFAULT_CONNECTIONS.map(x => ({ ...x }))
    setNodes(n)
    setConnections(c)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedId(null)
    setMode('view')
    pushHistory(n, c)
  }, [pushHistory])

  // ── Zoom ──────────────────────────────────────────────────────────────────────

  const zoomIn    = () => setZoom(z => Math.min(3, +(z + 0.2).toFixed(1)))
  const zoomOut   = () => setZoom(z => Math.max(0.3, +(z - 0.2).toFixed(1)))
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // ── Export ────────────────────────────────────────────────────────────────────

  const exportSVG = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`)
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asphalt-flow-diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault(); redo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if (e.key === 'Escape') { setSelectedId(null); setConnectStart(null); setMode('view') }
      if (e.key === 'v') setMode('view')
      if (e.key === 's') setMode('select')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, deleteSelected])

  // ── Cursor ────────────────────────────────────────────────────────────────────

  const cursorStyle =
    mode === 'addNode' ? 'crosshair' :
    mode === 'delete'  ? 'not-allowed' :
    mode === 'connect' ? 'cell' :
    dragRef.current    ? 'grabbing' : 'grab'

  const animState = running ? 'running' : 'paused'

  // Unique colors needed for markers
  const allColors = Array.from(new Set([
    ...nodes.map(n => n.color),
    ...connections.map(c => c.color),
  ]))

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch size={28} className="text-slate-600" />
            Asphalt Process Flow
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Interactive editor — drag nodes to reposition, click to select and customize, connect equipment stages
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setRunning(r => !r)} className="gap-1.5">
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportSVG} className="gap-1.5">
            <DownloadSimple size={14} /> Export SVG
          </Button>
          <Button variant="outline" size="sm" onClick={resetDiagram} className="gap-1.5">
            <ArrowUUpLeft size={14} /> Reset
          </Button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <Card className="px-2 py-1.5">
        <div className="flex items-center gap-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium px-1.5 mr-0.5">Mode:</span>

          <ToolBtn active={mode === 'view'} onClick={() => { setMode('view'); setConnectStart(null) }} title="View / Pan — drag canvas to pan">
            <ArrowsOut size={15} />
          </ToolBtn>
          <ToolBtn active={mode === 'select'} onClick={() => { setMode('select'); setConnectStart(null) }} title="Select & Move — drag nodes to reposition (S)">
            <CursorClick size={15} />
          </ToolBtn>
          <ToolBtn active={mode === 'addNode'} onClick={() => { setMode('addNode'); setConnectStart(null) }} title="Add Node — click canvas to place">
            <Plus size={15} />
          </ToolBtn>
          <ToolBtn active={mode === 'connect'} onClick={() => { setMode('connect'); setConnectStart(null) }} title="Connect — click source then target node">
            <Link size={15} />
          </ToolBtn>
          <ToolBtn active={mode === 'delete'} onClick={() => { setMode('delete'); setConnectStart(null) }} title="Delete — click node or connection" destructive>
            <Trash size={15} />
          </ToolBtn>

          <Separator orientation="vertical" className="h-6 mx-1.5" />

          <span className="text-xs text-muted-foreground font-medium px-1.5">History:</span>
          <ToolBtn onClick={undo} title="Undo (Ctrl+Z)" active={false}>
            <ArrowCounterClockwise size={15} />
          </ToolBtn>
          <ToolBtn onClick={redo} title="Redo (Ctrl+Y)" active={false}>
            <ArrowClockwise size={15} />
          </ToolBtn>

          <Separator orientation="vertical" className="h-6 mx-1.5" />

          <span className="text-xs text-muted-foreground font-medium px-1.5">Zoom:</span>
          <ToolBtn onClick={zoomOut} title="Zoom Out" active={false}><MagnifyingGlassMinus size={15} /></ToolBtn>
          <span className="text-xs tabular-nums w-9 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <ToolBtn onClick={zoomIn} title="Zoom In" active={false}><MagnifyingGlassPlus size={15} /></ToolBtn>
          <ToolBtn onClick={zoomReset} title="Reset View" active={false}><ArrowsOut size={15} /></ToolBtn>

          {selectedId && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1.5" />
              <ToolBtn onClick={deleteSelected} title="Delete selected (Del)" destructive active={false}>
                <Trash size={15} />
              </ToolBtn>
            </>
          )}

          {mode === 'connect' && (
            <span className="text-xs text-blue-500 font-medium ml-2 px-1.5">
              {connectStart ? '→ click target node' : 'Click source node…'}
            </span>
          )}
          {mode === 'addNode' && (
            <span className="text-xs text-indigo-500 font-medium ml-2 px-1.5">
              Click anywhere on canvas to place node
            </span>
          )}
        </div>
      </Card>

      {/* ── Canvas + Edit Panel ── */}
      <div className="flex gap-4 items-start">

        {/* SVG canvas */}
        <Card className="flex-1 overflow-hidden min-w-0">
          <CardContent className="p-2">
            <svg
              ref={svgRef}
              viewBox={viewBox}
              className="w-full select-none"
              style={{ maxHeight: 460, fontFamily: 'inherit', cursor: cursorStyle, touchAction: 'none' }}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            >
              <defs>
                <style>{`
                  .pipe-anim {
                    stroke-dasharray: 10 14;
                    stroke-dashoffset: 0;
                  }
                  @keyframes flow-anim {
                    to { stroke-dashoffset: -48; }
                  }
                  .pipe-bg {
                    stroke-opacity: 0.18;
                  }
                  @keyframes pulse-node {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.75; }
                  }
                  .node-pulse {
                    animation: pulse-node 2s ease-in-out infinite;
                    animation-play-state: ${animState};
                  }
                `}</style>

                {/* Arrow markers — one per unique color */}
                {allColors.map(color => (
                  <marker
                    key={color}
                    id={`arrow-${color.replace('#', '')}`}
                    markerWidth="7" markerHeight="7"
                    refX="5" refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 3.5, 0 7" fill={color} fillOpacity="0.8" />
                  </marker>
                ))}

                <filter id="glow-sel" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Transparent background for pan/addNode */}
              <rect
                className="svg-bg"
                x={-pan.x / zoom - 2000}
                y={-pan.y / zoom - 2000}
                width={VIEWBOX_W / zoom + 4000}
                height={VIEWBOX_H / zoom + 4000}
                fill="transparent"
              />

              {/* ── Pipe backgrounds ── */}
              {connections.map(conn => {
                const a = nodes.find(n => n.id === conn.from)
                const b = nodes.find(n => n.id === conn.to)
                if (!a || !b) return null
                return (
                  <path
                    key={`bg-${conn.id}`}
                    d={buildPath(a, b)}
                    fill="none"
                    className="pipe-bg"
                    stroke={conn.color}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )
              })}

              {/* ── Animated flow dashes ── */}
              {connections.map(conn => {
                const a = nodes.find(n => n.id === conn.from)
                const b = nodes.find(n => n.id === conn.to)
                if (!a || !b) return null
                const d = buildPath(a, b)
                const isSel = selectedId === conn.id && selectedType === 'connection'
                return (
                  <path
                    key={`flow-${conn.id}`}
                    d={d}
                    fill="none"
                    className="pipe-anim"
                    stroke={conn.color}
                    strokeWidth={isSel ? 8 : 6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={isSel ? 1 : 0.85}
                    style={{
                      animation: `flow-anim ${conn.duration}s linear infinite`,
                      animationPlayState: animState,
                      filter: isSel ? 'url(#glow-sel)' : undefined,
                      cursor: mode === 'delete' ? 'not-allowed' : 'pointer',
                    }}
                    markerEnd={`url(#arrow-${conn.color.replace('#', '')})`}
                    onClick={e => handleConnectionClick(e, conn.id)}
                  />
                )
              })}

              {/* ── Pipe labels ── */}
              {connections.map(conn => {
                const a = nodes.find(n => n.id === conn.from)
                const b = nodes.find(n => n.id === conn.to)
                if (!a || !b) return null
                const mid = pathMidpoint(buildPath(a, b))
                return (
                  <text
                    key={`lbl-${conn.id}`}
                    x={mid.x} y={mid.y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill={conn.color}
                    opacity="0.9"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {conn.label}
                  </text>
                )
              })}

              {/* ── Equipment nodes ── */}
              {nodes.map(n => {
                const isSel = selectedId === n.id && selectedType === 'node'
                const isConnSrc = connectStart === n.id
                return (
                  <g
                    key={n.id}
                    className={n.id === 'hotmix' ? 'node-pulse' : undefined}
                    onPointerDown={e => handleNodePointerDown(e, n.id)}
                    style={{
                      cursor:
                        mode === 'delete' ? 'not-allowed' :
                        mode === 'connect' ? 'cell' : 'grab',
                    }}
                  >
                    {/* Drop shadow */}
                    <rect
                      x={n.x + 3} y={n.y + 4}
                      width={n.w} height={n.h}
                      rx={6}
                      fill="black" fillOpacity={0.1}
                      pointerEvents="none"
                    />
                    {/* Main box */}
                    <rect
                      x={n.x} y={n.y}
                      width={n.w} height={n.h}
                      rx={6}
                      fill="white"
                      stroke={isConnSrc ? '#3b82f6' : n.color}
                      strokeWidth={isSel ? 3 : isConnSrc ? 3 : 1.8}
                      style={{
                        filter:
                          isSel      ? `drop-shadow(0 0 8px ${n.color}cc)` :
                          isConnSrc  ? 'drop-shadow(0 0 8px #3b82f680)' : undefined,
                      }}
                    />
                    {/* Top accent strip */}
                    <rect
                      x={n.x} y={n.y}
                      width={n.w} height={8}
                      rx={6}
                      fill={n.color}
                      fillOpacity={0.9}
                      pointerEvents="none"
                    />
                    {/* Selection dashes */}
                    {isSel && (
                      <rect
                        x={n.x - 3} y={n.y - 3}
                        width={n.w + 6} height={n.h + 6}
                        rx={9}
                        fill="none"
                        stroke={n.color}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        opacity={0.7}
                        pointerEvents="none"
                      />
                    )}
                    {/* Icon */}
                    <text
                      x={ncx(n)} y={n.y + 27}
                      textAnchor="middle"
                      fontSize={n.label.toLowerCase().includes('pump') ? '15' : '20'}
                      pointerEvents="none"
                    >
                      {n.icon}
                    </text>
                    {/* Label */}
                    <text
                      x={ncx(n)} y={n.y + n.h - 18}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#1e293b"
                      pointerEvents="none"
                    >
                      {n.label}
                    </text>
                    {/* Sublabel */}
                    <text
                      x={ncx(n)} y={n.y + n.h - 7}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#64748b"
                      pointerEvents="none"
                    >
                      {n.sublabel}
                    </text>
                  </g>
                )
              })}
            </svg>
          </CardContent>
        </Card>

        {/* ── Edit panel ── */}
        {(selectedNode || selectedConn) && (
          <Card className="w-60 shrink-0">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <PencilSimple size={14} />
                  {selectedNode ? 'Edit Node' : 'Edit Connection'}
                </h3>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {selectedNode && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedNode.label}
                      onChange={e => updateNode('label', e.target.value)}
                      onBlur={commitNodeEdit}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sublabel</Label>
                    <Input
                      value={selectedNode.sublabel}
                      onChange={e => updateNode('sublabel', e.target.value)}
                      onBlur={commitNodeEdit}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icon (emoji)</Label>
                    <Input
                      value={selectedNode.icon}
                      onChange={e => updateNode('icon', e.target.value)}
                      onBlur={commitNodeEdit}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedNode.color}
                        onChange={e => updateNode('color', e.target.value)}
                        onBlur={commitNodeEdit}
                        className="w-8 h-7 cursor-pointer rounded border border-input p-0"
                      />
                      <Input
                        value={selectedNode.color}
                        onChange={e => updateNode('color', e.target.value)}
                        onBlur={commitNodeEdit}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={selectedNode.w}
                        onChange={e => updateNode('w', Math.max(40, +e.target.value))}
                        onBlur={commitNodeEdit}
                        className="h-7 text-xs"
                        min={40} max={200}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={selectedNode.h}
                        onChange={e => updateNode('h', Math.max(30, +e.target.value))}
                        onBlur={commitNodeEdit}
                        className="h-7 text-xs"
                        min={30} max={150}
                      />
                    </div>
                  </div>
                  <Separator />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5 h-7 text-xs"
                    onClick={deleteSelected}
                  >
                    <Trash size={12} /> Delete Node
                  </Button>
                </div>
              )}

              {selectedConn && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedConn.label}
                      onChange={e => updateConnection('label', e.target.value)}
                      onBlur={commitConnEdit}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedConn.color}
                        onChange={e => updateConnection('color', e.target.value)}
                        onBlur={commitConnEdit}
                        className="w-8 h-7 cursor-pointer rounded border border-input p-0"
                      />
                      <Input
                        value={selectedConn.color}
                        onChange={e => updateConnection('color', e.target.value)}
                        onBlur={commitConnEdit}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Flow Speed (s)</Label>
                    <Input
                      type="number"
                      value={selectedConn.duration}
                      onChange={e => updateConnection('duration', Math.max(0.5, +e.target.value))}
                      onBlur={commitConnEdit}
                      className="h-7 text-xs"
                      min={0.5} max={10} step={0.1}
                    />
                  </div>
                  <Separator />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5 h-7 text-xs"
                    onClick={deleteSelected}
                  >
                    <Trash size={12} /> Delete Connection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex gap-2 flex-wrap items-center">
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full inline-block ${running ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {running ? 'Flow Active' : 'Flow Paused'}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          {nodes.length} Nodes
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          {connections.length} Connections
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
          Drag to reposition · Scroll to zoom · Ctrl+Z undo
        </span>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {Array.from(
          nodes.reduce((m, n) => { if (!m.has(n.color)) m.set(n.color, n.label); return m }, new Map<string, string>())
        ).map(([color, label]) => (
          <div key={color} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
