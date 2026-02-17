import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  CaretRight,
  CaretDown,
  Funnel as FunnelIcon,
  TreeStructure,
  MapPin,
  Package
} from '@phosphor-icons/react'
import type {
  Valve,
  ValveManifold,
  ValveHeader,
  ValveSection,
  ProcessArea,
  ProcessSystem,
  PMEquipment
} from '@/lib/types'

interface ValveHierarchyViewProps {
  valves: Valve[]
  manifolds: ValveManifold[]
  headers: ValveHeader[]
  sections: ValveSection[]
  processAreas: ProcessArea[]
  systems: ProcessSystem[]
  onValveSelect?: (valve: Valve) => void
}

export function ValveHierarchyView({
  valves,
  manifolds,
  headers,
  sections,
  processAreas,
  systems,
  onValveSelect
}: ValveHierarchyViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }
  
  const expandAll = () => {
    const allNodes = new Set<string>()
    systems.forEach(s => allNodes.add(s.asset_id))
    processAreas.forEach(a => allNodes.add(a.asset_id))
    sections.forEach(s => allNodes.add(s.asset_id))
    headers.forEach(h => allNodes.add(h.asset_id))
    manifolds.forEach(m => allNodes.add(m.asset_id))
    setExpandedNodes(allNodes)
  }
  
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }
  
  const getValvesByManifold = (manifoldId: string) => {
    return valves.filter(v => v.manifold_id === manifoldId)
  }
  
  const getManifoldsByHeader = (headerId: string) => {
    return manifolds.filter(m => m.header_id === headerId)
  }
  
  const getHeadersBySection = (sectionId: string) => {
    return headers.filter(h => h.section_id === sectionId)
  }
  
  const getSectionsByArea = (areaId: string) => {
    return sections.filter(s => s.process_area_id === areaId)
  }
  
  const getAreasBySystem = (systemId: string) => {
    return processAreas.filter(a => a.system_id === systemId)
  }
  
  if (systems.length === 0 && valves.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valve Hierarchy</CardTitle>
          <CardDescription>
            Valve hierarchy data not available. Load sample data to see the hierarchy.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  if (valves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valve Hierarchy</CardTitle>
          <CardDescription>
            No valves found. Load sample data to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Valve Hierarchy</CardTitle>
            <CardDescription>
              Hierarchical view of valves organized by System → Area → Section → Header → Manifold → Valve
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={expandAll} variant="outline" size="sm">
              Expand All
            </Button>
            <Button onClick={collapseAll} variant="outline" size="sm">
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {/* Systems Level */}
            {systems.map(system => (
              <div key={system.asset_id} className="space-y-2">
                <Collapsible
                  open={expandedNodes.has(system.asset_id)}
                  onOpenChange={() => toggleNode(system.asset_id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 hover:bg-primary/15 cursor-pointer">
                      {expandedNodes.has(system.asset_id) ? (
                        <CaretDown className="h-4 w-4" />
                      ) : (
                        <CaretRight className="h-4 w-4" />
                      )}
                      <Package className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-semibold">{system.asset_name}</div>
                        <div className="text-sm text-muted-foreground">{system.system_tag} - {system.system_type}</div>
                      </div>
                      <Badge variant="destructive">{system.criticality}</Badge>
                      <Badge variant="outline">{getAreasBySystem(system.asset_id).length} Areas</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-2 space-y-2">
                    {/* Process Areas Level */}
                    {getAreasBySystem(system.asset_id).map(area => (
                      <div key={area.asset_id} className="space-y-2">
                        <Collapsible
                          open={expandedNodes.has(area.asset_id)}
                          onOpenChange={() => toggleNode(area.asset_id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 cursor-pointer">
                              {expandedNodes.has(area.asset_id) ? (
                                <CaretDown className="h-4 w-4" />
                              ) : (
                                <CaretRight className="h-4 w-4" />
                              )}
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{area.asset_name}</div>
                                <div className="text-xs text-muted-foreground">{area.area_tag} - {area.operating_unit}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {getSectionsByArea(area.asset_id).length} Sections
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-6 mt-2 space-y-2">
                            {/* Sections Level */}
                            {getSectionsByArea(area.asset_id).map(section => (
                              <div key={section.asset_id} className="space-y-2">
                                <Collapsible
                                  open={expandedNodes.has(section.asset_id)}
                                  onOpenChange={() => toggleNode(section.asset_id)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/15 cursor-pointer">
                                      {expandedNodes.has(section.asset_id) ? (
                                        <CaretDown className="h-4 w-4" />
                                      ) : (
                                        <CaretRight className="h-4 w-4" />
                                      )}
                                      <TreeStructure className="h-4 w-4 text-purple-600" />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{section.asset_name}</div>
                                        <div className="text-xs text-muted-foreground">{section.section_tag}</div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {getHeadersBySection(section.asset_id).length} Headers
                                      </Badge>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="ml-6 mt-2 space-y-2">
                                    {/* Headers Level */}
                                    {getHeadersBySection(section.asset_id).map(header => (
                                      <div key={header.asset_id} className="space-y-2">
                                        <Collapsible
                                          open={expandedNodes.has(header.asset_id)}
                                          onOpenChange={() => toggleNode(header.asset_id)}
                                        >
                                          <CollapsibleTrigger asChild>
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/15 cursor-pointer">
                                              {expandedNodes.has(header.asset_id) ? (
                                                <CaretDown className="h-4 w-4" />
                                              ) : (
                                                <CaretRight className="h-4 w-4" />
                                              )}
                                              <div className="flex-1">
                                                <div className="font-medium text-sm">{header.asset_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {header.header_tag} - {header.header_type} - {header.main_line_size}"
                                                </div>
                                              </div>
                                              <Badge variant="outline" className="text-xs">
                                                {getManifoldsByHeader(header.asset_id).length} Manifolds
                                              </Badge>
                                            </div>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent className="ml-6 mt-2 space-y-2">
                                            {/* Manifolds Level */}
                                            {getManifoldsByHeader(header.asset_id).map(manifold => (
                                              <div key={manifold.asset_id} className="space-y-2">
                                                <Collapsible
                                                  open={expandedNodes.has(manifold.asset_id)}
                                                  onOpenChange={() => toggleNode(manifold.asset_id)}
                                                >
                                                  <CollapsibleTrigger asChild>
                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/15 cursor-pointer">
                                                      {expandedNodes.has(manifold.asset_id) ? (
                                                        <CaretDown className="h-4 w-4" />
                                                      ) : (
                                                        <CaretRight className="h-4 w-4" />
                                                      )}
                                                      <div className="flex-1">
                                                        <div className="font-medium text-sm">{manifold.asset_name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {manifold.manifold_tag} - {manifold.outlet_count} outlets
                                                        </div>
                                                      </div>
                                                      <Badge variant="outline" className="text-xs">
                                                        {getValvesByManifold(manifold.asset_id).length} Valves
                                                      </Badge>
                                                    </div>
                                                  </CollapsibleTrigger>
                                                  <CollapsibleContent className="ml-6 mt-2 space-y-1">
                                                    {/* Valves Level */}
                                                    {getValvesByManifold(manifold.asset_id).map(valve => (
                                                      <div
                                                        key={valve.asset_id}
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 cursor-pointer"
                                                        onClick={() => onValveSelect?.(valve)}
                                                      >
                                                        <FunnelIcon className="h-3 w-3 text-gray-600" />
                                                        <div className="flex-1">
                                                          <div className="font-medium text-sm">{valve.asset_name}</div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {valve.valve_tag} - {valve.valve_type} - {valve.valve_size}" - {valve.actuation_type}
                                                          </div>
                                                        </div>
                                                        <Badge
                                                          variant={valve.status === 'Operational' ? 'default' : 'destructive'}
                                                          className="text-xs"
                                                        >
                                                          {valve.status}
                                                        </Badge>
                                                      </div>
                                                    ))}
                                                  </CollapsibleContent>
                                                </Collapsible>
                                              </div>
                                            ))}
                                          </CollapsibleContent>
                                        </Collapsible>
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
