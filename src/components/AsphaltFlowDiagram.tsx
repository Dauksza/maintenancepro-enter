import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitBranch, Play, Pause } from '@phosphor-icons/react'

// ──────────────────────────────────────────────────────────────────────────────
// Flow diagram: Railcars → Pumps → Tanks → Hot Mix Chambers → Tanks →
//               Pumps → Manifolds → Tankers
// Uses SVG with animated strokeDashoffset to simulate liquid flowing in pipes
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

// Pipe segment definition ─ from/to are centre points of nodes
// color matches the fluid flowing through that section
interface PipeSegment {
  id: string
  d: string          // SVG path `d` attribute
  color: string
  label: string
  duration: number   // animation duration in seconds
}

// Node (equipment box) definition
interface FlowNode {
  id: string
  label: string
  sublabel: string
  x: number; y: number; w: number; h: number
  color: string
  icon: string
}

const VIEWBOX_W = 880
const VIEWBOX_H = 340

// ──── node layout ─────────────────────────────────────────────────────────────
//  Row 1 (y≈80):   Railcar → Pump₁ → StorageTank → Pump₂ → HotMix
//  vertical drop:   HotMix ↓ ProductTank
//  Row 2 (y≈240):  Tanker ← Manifold ← Pump₄ ← Pump₃ ← ProductTank

const NODES: FlowNode[] = [
  // Row 1 – receiving / supply side
  { id: 'railcar',  label: 'Rail Car',      sublabel: 'AC Receipt',    x: 20,  y: 55,  w: 90, h: 56, color: STAGE_COLORS.railcar,  icon: '🚃' },
  { id: 'pump1',    label: 'Pump',          sublabel: 'Unload',        x: 155, y: 67,  w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'tank1',    label: 'Storage Tank',  sublabel: 'AC Supply',     x: 262, y: 48,  w: 92, h: 72, color: STAGE_COLORS.tank,    icon: '🛢' },
  { id: 'pump2',    label: 'Pump',          sublabel: 'Transfer',      x: 408, y: 67,  w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'hotmix',   label: 'Hot Mix',       sublabel: 'Chamber',       x: 520, y: 50,  w: 96, h: 68, color: STAGE_COLORS.hotmix,  icon: '🔥' },
  // Vertical connector node (no box, just a label on the pipe)
  // Row 2 – distribution side
  { id: 'ptank',    label: 'Product Tank',  sublabel: 'Mixed AC',      x: 520, y: 210, w: 96, h: 72, color: STAGE_COLORS.ptank,   icon: '🛢' },
  { id: 'pump3',    label: 'Pump',          sublabel: 'Load',          x: 408, y: 228, w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'manifold', label: 'Manifold',      sublabel: 'Distribution',  x: 262, y: 213, w: 92, h: 62, color: STAGE_COLORS.manifold,icon: '⊞' },
  { id: 'pump4',    label: 'Pump',          sublabel: 'Transfer',      x: 155, y: 228, w: 56, h: 38, color: STAGE_COLORS.pump,    icon: '⚙' },
  { id: 'tanker',   label: 'Tanker',        sublabel: 'Loading',       x: 20,  y: 208, w: 90, h: 68, color: STAGE_COLORS.tanker,  icon: '🚛' },
]

// Helper: centre of a node
function cx(n: FlowNode) { return n.x + n.w / 2 }
function cy(n: FlowNode) { return n.y + n.h / 2 }

// Helper: find node by id
function node(id: string) { return NODES.find(n => n.id === id)! }

// Build straight-line path between two node centres with mid-point routing
function hPath(from: string, to: string): string {
  const a = node(from), b = node(to)
  const ax = cx(a), ay = cy(a), bx = cx(b), by = cy(b)
  if (Math.abs(ay - by) < 2) {
    // horizontal
    return `M ${ax} ${ay} L ${bx} ${by}`
  }
  // Elbow: go horizontal then vertical
  return `M ${ax} ${ay} L ${bx} ${ay} L ${bx} ${by}`
}

// Pipe segments connecting the flow diagram
const PIPES: PipeSegment[] = [
  { id: 'p-rail-pump1',    d: hPath('railcar','pump1'),    color: STAGE_COLORS.railcar, label: 'Unloading',    duration: 2.0 },
  { id: 'p-pump1-tank1',   d: hPath('pump1','tank1'),      color: STAGE_COLORS.pump,    label: 'Fill',         duration: 1.6 },
  { id: 'p-tank1-pump2',   d: hPath('tank1','pump2'),      color: STAGE_COLORS.tank,    label: 'Supply',       duration: 1.8 },
  { id: 'p-pump2-hotmix',  d: hPath('pump2','hotmix'),     color: STAGE_COLORS.pump,    label: 'Inject',       duration: 1.5 },
  { id: 'p-hotmix-ptank',  d: hPath('hotmix','ptank'),     color: STAGE_COLORS.hotmix,  label: 'Discharge',    duration: 2.2 },
  { id: 'p-ptank-pump3',   d: hPath('ptank','pump3'),      color: STAGE_COLORS.ptank,   label: 'Transfer',     duration: 1.6 },
  { id: 'p-pump3-manifold',d: hPath('pump3','manifold'),   color: STAGE_COLORS.pump,    label: 'Distribute',   duration: 1.5 },
  { id: 'p-manifold-pump4',d: hPath('manifold','pump4'),   color: STAGE_COLORS.manifold,label: 'Route',        duration: 1.8 },
  { id: 'p-pump4-tanker',  d: hPath('pump4','tanker'),     color: STAGE_COLORS.tanker,  label: 'Load',         duration: 2.0 },
]

// ──────────────────────────────────────────────────────────────────────────────

export function AsphaltFlowDiagram() {
  const [running, setRunning] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  const animState = running ? 'running' : 'paused'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch size={28} className="text-slate-600" />
            Asphalt Process Flow
          </h2>
          <p className="text-muted-foreground mt-1">
            Animated flow diagram — railcars → pumps → tanks → hot mix → tanks → pumps → manifolds → tankers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRunning(r => !r)}
          className="gap-2"
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : 'Resume'}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Rail Car',      color: STAGE_COLORS.railcar },
          { label: 'Pump',          color: STAGE_COLORS.pump },
          { label: 'Storage Tank',  color: STAGE_COLORS.tank },
          { label: 'Hot Mix Chamber', color: STAGE_COLORS.hotmix },
          { label: 'Product Tank',  color: STAGE_COLORS.ptank },
          { label: 'Manifold',      color: STAGE_COLORS.manifold },
          { label: 'Tanker',        color: STAGE_COLORS.tanker },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <svg
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            className="w-full"
            style={{ maxHeight: 420, fontFamily: 'inherit' }}
          >
            <defs>
              {/* Animated "marching dashes" — one keyframe per pipe colour */}
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
                  0%,100% { opacity: 1; }
                  50%     { opacity: 0.75; }
                }
                .node-active {
                  animation: pulse-node 2s ease-in-out infinite;
                  animation-play-state: ${animState};
                }
              `}</style>

              {/* Arrow marker per colour */}
              {Object.entries(STAGE_COLORS).map(([key, color]) => (
                <marker
                  key={key}
                  id={`arrow-${key}`}
                  markerWidth="7" markerHeight="7"
                  refX="5" refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 7 3.5, 0 7" fill={color} fillOpacity="0.8" />
                </marker>
              ))}
            </defs>

            {/* ── Pipe background (thick, semi-transparent) ── */}
            {PIPES.map(pipe => (
              <path
                key={`bg-${pipe.id}`}
                d={pipe.d}
                fill="none"
                className="pipe-bg"
                stroke={pipe.color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* ── Animated flowing dashes ── */}
            {PIPES.map(pipe => (
              <path
                key={`flow-${pipe.id}`}
                d={pipe.d}
                fill="none"
                className="pipe-anim"
                stroke={pipe.color}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: `flow-anim ${pipe.duration}s linear infinite`,
                  animationPlayState: animState,
                }}
                markerEnd={`url(#arrow-${colorKeyForPipe(pipe)})`}
              />
            ))}

            {/* ── Flow label on each pipe ── */}
            {PIPES.map(pipe => {
              const pts = pathMidpoint(pipe.d)
              return (
                <text
                  key={`lbl-${pipe.id}`}
                  x={pts.x}
                  y={pts.y - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill={pipe.color}
                  opacity="0.9"
                  fontWeight="600"
                >
                  {pipe.label}
                </text>
              )
            })}

            {/* ── Equipment nodes ── */}
            {NODES.map(n => {
              const isHot = n.id === 'hotmix'
              const isHovered = hovered === n.id
              return (
                <g
                  key={n.id}
                  className={isHot ? 'node-active' : ''}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}
                >
                  {/* Shadow */}
                  <rect
                    x={n.x + 3} y={n.y + 4}
                    width={n.w} height={n.h}
                    rx={6}
                    fill="black" fillOpacity={0.12}
                  />
                  {/* Box */}
                  <rect
                    x={n.x} y={n.y}
                    width={n.w} height={n.h}
                    rx={6}
                    fill="white"
                    stroke={n.color}
                    strokeWidth={isHovered ? 2.5 : 1.8}
                    style={{ filter: isHovered ? `drop-shadow(0 0 6px ${n.color}88)` : undefined }}
                  />
                  {/* Colour accent strip at top */}
                  <rect
                    x={n.x} y={n.y}
                    width={n.w} height={8}
                    rx={6}
                    fill={n.color}
                    fillOpacity={0.85}
                  />
                  {/* Icon */}
                  <text
                    x={cx(n)} y={n.y + 27}
                    textAnchor="middle"
                    fontSize={n.id.startsWith('pump') ? '15' : '20'}
                  >
                    {n.icon}
                  </text>
                  {/* Label */}
                  <text
                    x={cx(n)} y={n.y + n.h - 18}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {n.label}
                  </text>
                  {/* Sublabel */}
                  <text
                    x={cx(n)} y={n.y + n.h - 7}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#64748b"
                  >
                    {n.sublabel}
                  </text>
                </g>
              )
            })}

            {/* ── Row labels ── */}
            <text x={12} y={22} fontSize="10" fontWeight="700" fill="#64748b" letterSpacing="0.05em">RECEIVING</text>
            <text x={12} y={200} fontSize="10" fontWeight="700" fill="#64748b" letterSpacing="0.05em">DISTRIBUTION</text>

            {/* Vertical pipe label */}
            <text
              x={cx(node('hotmix'))}
              y={(node('hotmix').y + node('hotmix').h + node('ptank').y) / 2 - 4}
              fontSize="8.5"
              fill={STAGE_COLORS.hotmix}
              textAnchor="middle"
              fontWeight="600"
            >
              Discharge
            </text>
          </svg>
        </CardContent>
      </Card>

      {/* Stage detail cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {[
          { key: 'railcar',  label: 'Rail Car',       desc: 'Delivers hot AC' },
          { key: 'pump',     label: 'Pumps',          desc: 'Move fluid between stages' },
          { key: 'tank',     label: 'Storage Tanks',  desc: 'Hold incoming AC' },
          { key: 'hotmix',   label: 'Hot Mix Chamber',desc: 'Blends asphalt mix' },
          { key: 'ptank',    label: 'Product Tanks',  desc: 'Store finished product' },
          { key: 'manifold', label: 'Manifold',       desc: 'Routes to loading bays' },
          { key: 'tanker',   label: 'Tanker',         desc: 'Receives loaded product' },
        ].map(item => (
          <Card key={item.key} className="text-center" style={{ borderColor: STAGE_COLORS[item.key] + '55' }}>
            <CardContent className="py-3 px-2">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ background: STAGE_COLORS[item.key] }}
              />
              <p className="text-xs font-semibold leading-tight">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
          Flow Active
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          9 Equipment Stages
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          4 Pumps
        </Badge>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers

/** Map a pipe's color to the matching arrow marker key */
function colorKeyForPipe(pipe: PipeSegment): string {
  const entry = Object.entries(STAGE_COLORS).find(([, v]) => v === pipe.color)
  return entry ? entry[0] : 'pump'
}

/** Approximate midpoint of an SVG path (supports M…L…L elbow paths) */
function pathMidpoint(d: string): { x: number; y: number } {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  if (nums.length >= 4) {
    const x1 = nums[0], y1 = nums[1]
    const x2 = nums[nums.length - 2], y2 = nums[nums.length - 1]
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }
  return { x: 0, y: 0 }
}
