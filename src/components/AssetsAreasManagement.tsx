import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Asset, Area, Skill, Employee } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  MapPin, 
  GraduationCap, 
  Plus, 
  MagnifyingGlass,
  Wrench,
  Users
} from '@phosphor-icons/react'
import { AddAssetWizard } from '@/components/wizards/AddAssetWizard'
import { AddAreaWizard } from '@/components/wizards/AddAreaWizard'
import { AddSkillWizard } from '@/components/wizards/AddSkillWizard'
import { toast } from 'sonner'

interface AssetsAreasManagementProps {
  employees: Employee[]
}

export function AssetsAreasManagement({ employees }: AssetsAreasManagementProps) {
  const [assets, setAssets] = useKV<Asset[]>('assets', [])
  const [areas, setAreas] = useKV<Area[]>('areas', [])
  const [skills, setSkills] = useKV<Skill[]>('skills', [])
  
  const [assetWizardOpen, setAssetWizardOpen] = useState(false)
  const [areaWizardOpen, setAreaWizardOpen] = useState(false)
  const [skillWizardOpen, setSkillWizardOpen] = useState(false)
  
  const [assetSearch, setAssetSearch] = useState('')
  const [areaSearch, setAreaSearch] = useState('')
  const [skillSearch, setSkillSearch] = useState('')

  const safeAssets = assets || []
  const safeAreas = areas || []
  const safeSkills = skills || []

  const handleAddAsset = (asset: Asset) => {
    setAssets((current) => [...(current || []), asset])
    toast.success('Asset added successfully')
  }

  const handleAddArea = (area: Area) => {
    setAreas((current) => [...(current || []), area])
    toast.success('Area added successfully')
  }

  const handleAddSkill = (skill: Skill) => {
    setSkills((current) => [...(current || []), skill])
    toast.success('Skill added successfully')
  }

  const filteredAssets = safeAssets.filter(asset =>
    asset.asset_name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.asset_type.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.manufacturer.toLowerCase().includes(assetSearch.toLowerCase())
  )

  const filteredAreas = safeAreas.filter(area =>
    area.area_name.toLowerCase().includes(areaSearch.toLowerCase()) ||
    area.department.toLowerCase().includes(areaSearch.toLowerCase()) ||
    area.zone.toLowerCase().includes(areaSearch.toLowerCase())
  )

  const filteredSkills = safeSkills.filter(skill =>
    skill.skill_name.toLowerCase().includes(skillSearch.toLowerCase()) ||
    skill.skill_category.toLowerCase().includes(skillSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Assets, Areas & Skills</h2>
        <p className="text-muted-foreground">
          Manage physical assets, work areas, and employee skills
        </p>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package size={18} />
            Assets ({safeAssets.length})
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <MapPin size={18} />
            Areas ({safeAreas.length})
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <GraduationCap size={18} />
            Skills ({safeSkills.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Inventory</CardTitle>
                  <CardDescription>
                    Equipment, vehicles, tools, and instruments
                  </CardDescription>
                </div>
                <Button onClick={() => setAssetWizardOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Add Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search assets..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Assets Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add assets to track equipment and assign them to employees
                  </p>
                  <Button onClick={() => setAssetWizardOpen(true)}>
                    <Plus size={18} />
                    Add First Asset
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map(asset => {
                        const area = safeAreas.find(a => a.area_id === asset.area_id)
                        return (
                          <TableRow key={asset.asset_id}>
                            <TableCell className="font-medium">{asset.asset_name}</TableCell>
                            <TableCell>{asset.asset_type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{asset.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={asset.status === 'Operational' ? 'default' : 'secondary'}
                              >
                                {asset.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{area?.area_name || '-'}</TableCell>
                            <TableCell>
                              {asset.assigned_employee_ids.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Users size={14} />
                                  <span className="text-sm">{asset.assigned_employee_ids.length}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Areas</CardTitle>
                  <CardDescription>
                    Zones, departments, and locations
                  </CardDescription>
                </div>
                <Button onClick={() => setAreaWizardOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Add Area
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search areas..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredAreas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <MapPin size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Areas Defined</h3>
                  <p className="text-muted-foreground mb-4">
                    Create areas to organize work by location or department
                  </p>
                  <Button onClick={() => setAreaWizardOpen(true)}>
                    <Plus size={18} />
                    Add First Area
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Area Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Assets</TableHead>
                        <TableHead>Daily Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAreas.map(area => (
                        <TableRow key={area.area_id}>
                          <TableCell className="font-medium">{area.area_name}</TableCell>
                          <TableCell>{area.department}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{area.zone}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span className="text-sm">{area.assigned_employee_ids.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package size={14} />
                              <span className="text-sm">{area.asset_ids.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>{area.capacity_hours_per_day}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Skills Catalog</CardTitle>
                  <CardDescription>
                    Technical skills and certifications
                  </CardDescription>
                </div>
                <Button onClick={() => setSkillWizardOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredSkills.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <GraduationCap size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Skills Defined</h3>
                  <p className="text-muted-foreground mb-4">
                    Define skills to track employee competencies
                  </p>
                  <Button onClick={() => setSkillWizardOpen(true)}>
                    <Plus size={18} />
                    Add First Skill
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSkills.map(skill => (
                    <Card key={skill.skill_id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-start justify-between">
                          <span>{skill.skill_name}</span>
                          {skill.requires_certification && (
                            <Badge variant="secondary" className="ml-2">
                              Cert Required
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{skill.skill_category}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {skill.description && (
                          <p className="text-muted-foreground">{skill.description}</p>
                        )}
                        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Wrench size={12} />
                            <span>{skill.required_for_asset_ids.length} assets</span>
                          </div>
                          {skill.certification_duration_days && (
                            <div>
                              Valid: {Math.floor(skill.certification_duration_days / 365)}y
                            </div>
                          )}
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

      <AddAssetWizard
        open={assetWizardOpen}
        onClose={() => setAssetWizardOpen(false)}
        onComplete={handleAddAsset}
        areas={safeAreas}
        skills={safeSkills}
        employees={employees}
      />

      <AddAreaWizard
        open={areaWizardOpen}
        onClose={() => setAreaWizardOpen(false)}
        onComplete={handleAddArea}
        existingDepartments={Array.from(new Set(safeAreas.map(a => a.department)))}
        existingZones={Array.from(new Set(safeAreas.map(a => a.zone)))}
        employees={employees}
      />

      <AddSkillWizard
        open={skillWizardOpen}
        onClose={() => setSkillWizardOpen(false)}
        onComplete={handleAddSkill}
        existingCategories={Array.from(new Set(safeSkills.map(s => s.skill_category)))}
      />
    </div>
  )
}
