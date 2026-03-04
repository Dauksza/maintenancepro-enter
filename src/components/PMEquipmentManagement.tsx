import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Wrench,
  MagnifyingGlass,
  Plus,
  Gear,
  Lightning,
  Gauge,
  Thermometer as ThermometerIcon,
  Broadcast,
  Sliders,
  Funnel,
  TreeStructure,
  FileText,
  Download
} from '@phosphor-icons/react'
import type {
  Pump,
  Valve,
  ElectricMotor,
  Gearbox,
  PressureGauge,
  Thermometer,
  RadarTransmitter,
  ProcessController,
  ValveManifold,
  ValveHeader,
  ValveSection,
  ProcessArea,
  ProcessSystem,
  PMEquipment,
  PIDDrawing
} from '@/lib/types'
import {
  generateSamplePumps,
  generateSampleValves,
  generateSampleMotors,
  generateSampleGearboxes,
  generateSampleInstruments,
  createValveHierarchy,
  getAllPMEquipment
} from '@/lib/pm-equipment-utils'
import { ValveHierarchyView } from './ValveHierarchyView'
import { PMEquipmentDetailDialog } from './PMEquipmentDetailDialog'
import { PIDDrawingEditor } from './PIDDrawingEditor'
import { cn } from '@/lib/utils'

export function PMEquipmentManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<PMEquipment | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showPIDEditor, setShowPIDEditor] = useState(false)
  const [editingDrawing, setEditingDrawing] = useState<PIDDrawing | undefined>(undefined)
  
  // Load PM equipment from KV store
  const [pumps = [], setPumps] = useKV<Pump[]>('pm-equipment-pumps', [])
  const [valves = [], setValves] = useKV<Valve[]>('pm-equipment-valves', [])
  const [motors = [], setMotors] = useKV<ElectricMotor[]>('pm-equipment-motors', [])
  const [gearboxes = [], setGearboxes] = useKV<Gearbox[]>('pm-equipment-gearboxes', [])
  const [instruments = [], setInstruments] = useKV<Array<PressureGauge | Thermometer | RadarTransmitter | ProcessController>>('pm-equipment-instruments', [])
  
  // Load valve hierarchy
  const [manifolds = [], setManifolds] = useKV<ValveManifold[]>('pm-valve-manifolds', [])
  const [headers = [], setHeaders] = useKV<ValveHeader[]>('pm-valve-headers', [])
  const [sections = [], setSections] = useKV<ValveSection[]>('pm-valve-sections', [])
  const [processAreas = [], setProcessAreas] = useKV<ProcessArea[]>('pm-process-areas', [])
  const [systems = [], setSystems] = useKV<ProcessSystem[]>('pm-process-systems', [])
  
  // P&ID Drawings
  const [drawings = [], setDrawings] = useKV<PIDDrawing[]>('pm-pid-drawings', [])
  
  // Load sample data
  const handleLoadSampleData = () => {
    const samplePumps = generateSamplePumps(10)
    const sampleValves = generateSampleValves(100)
    const sampleMotors = generateSampleMotors(20)
    const sampleGearboxes = generateSampleGearboxes(15)
    const sampleInstruments = generateSampleInstruments()
    
    setPumps(samplePumps)
    setMotors(sampleMotors)
    setGearboxes(sampleGearboxes)
    setInstruments(sampleInstruments)
    
    // Create valve hierarchy
    const hierarchy = createValveHierarchy(sampleValves)
    setValves(sampleValves)
    setManifolds(hierarchy.manifolds)
    setHeaders(hierarchy.headers)
    setSections(hierarchy.sections)
    setProcessAreas(hierarchy.areas)
    setSystems(hierarchy.systems)
  }
  
  // Get all equipment combined
  const allEquipment = useMemo(() => {
    return [...pumps, ...valves, ...motors, ...gearboxes, ...instruments]
  }, [pumps, valves, motors, gearboxes, instruments])
  
  // Filter equipment based on search and type
  const filteredEquipment = useMemo(() => {
    let filtered = allEquipment
    
    if (selectedEquipmentType !== 'all') {
      filtered = filtered.filter(eq => eq.pm_equipment_type === selectedEquipmentType)
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(eq =>
        eq.asset_name.toLowerCase().includes(search) ||
        eq.manufacturer.toLowerCase().includes(search) ||
        eq.model.toLowerCase().includes(search) ||
        eq.serial_number.toLowerCase().includes(search)
      )
    }
    
    return filtered
  }, [allEquipment, selectedEquipmentType, searchTerm])
  
  // Get equipment counts by type
  const equipmentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allEquipment.length,
      Pump: pumps.length,
      Valve: valves.length,
      'Electric Motor': motors.length,
      Gearbox: gearboxes.length,
      'Pressure Gauge': instruments.filter(i => i.pm_equipment_type === 'Pressure Gauge').length,
      Thermometer: instruments.filter(i => i.pm_equipment_type === 'Thermometer').length,
      'Radar Transmitter': instruments.filter(i => i.pm_equipment_type === 'Radar Transmitter').length,
      'Process Controller': instruments.filter(i => 
        i.pm_equipment_type.startsWith('Process Controller')
      ).length
    }
    return counts
  }, [allEquipment, pumps, valves, motors, gearboxes, instruments])
  
  const handleEquipmentClick = (equipment: PMEquipment) => {
    setSelectedEquipment(equipment)
    setShowDetailDialog(true)
  }
  
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PM Equipment Management</h2>
          <p className="text-muted-foreground">
            Manage pumps, valves, motors, gearboxes, and instrumentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleLoadSampleData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Load Sample Data
          </Button>
          <Button onClick={() => setShowPIDEditor(true)}>
            <FileText className="h-4 w-4 mr-2" />
            P&ID Editor
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCounts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pumps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCounts.Pump}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCounts.Valve}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Motors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentCounts['Electric Motor']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Instruments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipmentCounts['Pressure Gauge'] + 
               equipmentCounts.Thermometer + 
               equipmentCounts['Radar Transmitter'] + 
               equipmentCounts['Process Controller']}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="equipment" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipment">
            <Wrench className="h-4 w-4 mr-2" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <TreeStructure className="h-4 w-4 mr-2" />
            Valve Hierarchy
          </TabsTrigger>
          <TabsTrigger value="drawings">
            <FileText className="h-4 w-4 mr-2" />
            P&ID Drawings ({drawings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="equipment" className="flex-1 flex flex-col space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment by name, manufacturer, model, or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedEquipmentType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEquipmentType('all')}
              >
                All ({equipmentCounts.all})
              </Button>
              <Button
                variant={selectedEquipmentType === 'Pump' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEquipmentType('Pump')}
              >
                Pumps ({equipmentCounts.Pump})
              </Button>
              <Button
                variant={selectedEquipmentType === 'Valve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEquipmentType('Valve')}
              >
                Valves ({equipmentCounts.Valve})
              </Button>
              <Button
                variant={selectedEquipmentType === 'Electric Motor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEquipmentType('Electric Motor')}
              >
                Motors ({equipmentCounts['Electric Motor']})
              </Button>
            </div>
          </div>
          
          {/* Equipment Table */}
          <Card className="flex-1">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag / Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criticality</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {allEquipment.length === 0 ? (
                          <div>
                            <p className="mb-2">No PM equipment found</p>
                            <Button onClick={handleLoadSampleData} size="sm">
                              Load Sample Data
                            </Button>
                          </div>
                        ) : (
                          'No equipment matches your search criteria'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEquipment.map((equipment) => (
                      <TableRow
                        key={equipment.asset_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEquipmentClick(equipment)}
                      >
                        <TableCell className="font-medium">{equipment.asset_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{equipment.pm_equipment_type}</Badge>
                        </TableCell>
                        <TableCell>{equipment.manufacturer}</TableCell>
                        <TableCell className="font-mono text-sm">{equipment.model}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              equipment.status === 'Operational'
                                ? 'default'
                                : equipment.status === 'Under Maintenance'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {equipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              equipment.criticality_rating === 'Critical'
                                ? 'destructive'
                                : equipment.criticality_rating === 'High'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {equipment.criticality_rating}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {equipment.next_maintenance_date
                            ? new Date(equipment.next_maintenance_date).toLocaleDateString()
                            : 'Not scheduled'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
        
        <TabsContent value="hierarchy" className="flex-1">
          <ValveHierarchyView
            valves={valves}
            manifolds={manifolds}
            headers={headers}
            sections={sections}
            processAreas={processAreas}
            systems={systems}
            onValveSelect={handleEquipmentClick}
          />
        </TabsContent>
        
        <TabsContent value="drawings" className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>P&ID Drawings</CardTitle>
                  <CardDescription>
                    Piping and instrumentation diagrams for your facility
                  </CardDescription>
                </div>
                <Button onClick={() => setShowPIDEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Drawing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {drawings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No P&ID drawings yet</p>
                  <Button onClick={() => setShowPIDEditor(true)}>
                    Create Your First Drawing
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drawings.map((drawing) => (
                    <Card
                      key={drawing.drawing_id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setEditingDrawing(drawing)
                        setShowPIDEditor(true)
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">{drawing.drawing_title}</CardTitle>
                        <CardDescription>
                          {drawing.drawing_number} - Rev {drawing.revision}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Symbols:</span>
                            <span className="font-medium">{drawing.symbols.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Connections:</span>
                            <span className="font-medium">{drawing.connections.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline">{drawing.metadata.status}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Modified:</span>
                            <span className="text-xs">
                              {new Date(drawing.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Equipment Detail Dialog */}
      {selectedEquipment && (
        <PMEquipmentDetailDialog
          equipment={selectedEquipment}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
      
      {/* P&ID Editor */}
      {showPIDEditor && (
        <PIDDrawingEditor
          open={showPIDEditor}
          onOpenChange={(open) => {
            setShowPIDEditor(open)
            if (!open) setEditingDrawing(undefined)
          }}
          drawings={drawings}
          initialDrawing={editingDrawing}
          onSave={(drawing) => {
            const existing = drawings.findIndex(d => d.drawing_id === drawing.drawing_id)
            if (existing >= 0) {
              const updated = [...drawings]
              updated[existing] = drawing
              setDrawings(updated)
            } else {
              setDrawings([...drawings, drawing])
            }
          }}
        />
      )}
    </div>
  )
}
