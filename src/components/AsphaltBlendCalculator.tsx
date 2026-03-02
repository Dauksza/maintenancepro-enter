import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { BlendFormulation, AsphaltProduct, PolymerType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calculator, Flask, BookOpen, Trash, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ASPHALT_DENSITY_LBS_GAL, TONS_TO_LBS } from '@/lib/asphalt-constants'

// Industry-standard polymer dosage guidelines
const POLYMER_DOSAGE_GUIDE: Record<string, Record<PolymerType, { min: number; typical: number; max: number }>> = {
  'PG 64-22_PG 70-22': {
    'SBS': { min: 1.5, typical: 2.5, max: 3.5 },
    'SBR Latex': { min: 2.0, typical: 3.0, max: 4.0 },
    'Gilsonite': { min: 4.0, typical: 6.0, max: 10.0 },
    'Crumb Rubber': { min: 15.0, typical: 18.0, max: 22.0 },
    'Polyphosphoric Acid': { min: 0.3, typical: 0.5, max: 0.8 },
    'Custom': { min: 1.0, typical: 2.0, max: 5.0 },
  },
  'PG 64-22_PG 76-22': {
    'SBS': { min: 3.5, typical: 4.5, max: 5.5 },
    'SBR Latex': { min: 4.0, typical: 5.5, max: 7.0 },
    'Gilsonite': { min: 8.0, typical: 12.0, max: 18.0 },
    'Crumb Rubber': { min: 18.0, typical: 22.0, max: 28.0 },
    'Polyphosphoric Acid': { min: 0.6, typical: 0.9, max: 1.2 },
    'Custom': { min: 3.0, typical: 4.5, max: 6.0 },
  },
  'PG 64-22_PG 82-22': {
    'SBS': { min: 5.5, typical: 7.0, max: 8.5 },
    'SBR Latex': { min: 6.0, typical: 8.0, max: 10.0 },
    'Gilsonite': { min: 12.0, typical: 18.0, max: 25.0 },
    'Crumb Rubber': { min: 22.0, typical: 26.0, max: 32.0 },
    'Polyphosphoric Acid': { min: 0.9, typical: 1.2, max: 1.6 },
    'Custom': { min: 5.0, typical: 7.0, max: 9.0 },
  },
  'PG 70-22_PG 76-22': {
    'SBS': { min: 1.5, typical: 2.5, max: 3.5 },
    'SBR Latex': { min: 2.0, typical: 3.0, max: 4.0 },
    'Gilsonite': { min: 4.0, typical: 6.0, max: 10.0 },
    'Crumb Rubber': { min: 10.0, typical: 14.0, max: 18.0 },
    'Polyphosphoric Acid': { min: 0.3, typical: 0.5, max: 0.8 },
    'Custom': { min: 1.5, typical: 2.5, max: 4.0 },
  },
}


function getPolymerGuide(baseGrade: AsphaltProduct, targetGrade: AsphaltProduct, polymerType: PolymerType) {
  const key = `${baseGrade}_${targetGrade}`
  return POLYMER_DOSAGE_GUIDE[key]?.[polymerType] ?? null
}

export function AsphaltBlendCalculator() {
  const [formulations, setFormulations] = useKV<BlendFormulation[]>('blend-formulations', [])

  // Calculator state
  const [baseGrade, setBaseGrade] = useState<AsphaltProduct>('PG 64-22')
  const [targetGrade, setTargetGrade] = useState<AsphaltProduct>('PG 76-22')
  const [polymerType, setPolymerType] = useState<PolymerType>('SBS')
  const [polymerPct, setPolymerPct] = useState<string>('4.5')
  const [batchSizeTons, setBatchSizeTons] = useState<string>('100')
  const [blendTempF, setBlendTempF] = useState<string>('375')
  const [mixTimeMin, setMixTimeMin] = useState<string>('45')
  const [formulationName, setFormulationName] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const guide = useMemo(() => getPolymerGuide(baseGrade, targetGrade, polymerType), [baseGrade, targetGrade, polymerType])

  const calc = useMemo(() => {
    const pct = parseFloat(polymerPct) || 0
    const tons = parseFloat(batchSizeTons) || 0
    const batchLbs = tons * TONS_TO_LBS
    const batchGallons = batchLbs / ASPHALT_DENSITY_LBS_GAL
    const polymerLbs = batchLbs * (pct / 100)
    const polymerTons = polymerLbs / TONS_TO_LBS
    const baseLbs = batchLbs - polymerLbs
    const baseTons = baseLbs / TONS_TO_LBS
    const baseGallons = baseLbs / ASPHALT_DENSITY_LBS_GAL
    return { batchLbs, batchGallons, polymerLbs, polymerTons, baseLbs, baseTons, baseGallons }
  }, [polymerPct, batchSizeTons])

  function handleSave() {
    if (!formulationName.trim()) { toast.error('Enter a formulation name'); return }
    const f: BlendFormulation = {
      formulation_id: `form-${Date.now()}`,
      name: formulationName.trim(),
      target_grade: targetGrade,
      base_grade: baseGrade,
      polymer_type: polymerType,
      polymer_percentage: parseFloat(polymerPct) || 0,
      blend_temp_f: parseFloat(blendTempF) || 375,
      mix_time_minutes: parseFloat(mixTimeMin) || 45,
      notes: '',
      created_at: new Date().toISOString(),
      is_active: true,
    }
    setFormulations(cur => [...(cur || []), f])
    toast.success('Formulation saved')
    setSaveDialogOpen(false)
    setFormulationName('')
  }

  function handleDelete(id: string) {
    setFormulations(cur => (cur || []).filter(f => f.formulation_id !== id))
    toast.success('Formulation removed')
    setDeleteTarget(null)
  }

  function loadFormulation(f: BlendFormulation) {
    setBaseGrade(f.base_grade)
    setTargetGrade(f.target_grade)
    setPolymerType(f.polymer_type)
    setPolymerPct(String(f.polymer_percentage))
    setBlendTempF(String(f.blend_temp_f))
    setMixTimeMin(String(f.mix_time_minutes))
    toast.success(`Loaded: ${f.name}`)
  }

  const gradeOptions: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
  const polymerOptions: PolymerType[] = ['SBS', 'SBR Latex', 'Gilsonite', 'Crumb Rubber', 'Polyphosphoric Acid', 'Custom']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator size={28} className="text-amber-500" />
            Polymer Blend Calculator
          </h2>
          <p className="text-muted-foreground mt-1">Calculate polymer dosage for performance-grade asphalt modification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flask size={20} className="text-amber-500" />
                Blend Parameters
              </CardTitle>
              <CardDescription>Enter your blend specifications to calculate polymer dosage</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Asphalt Grade</Label>
                <Select value={baseGrade} onValueChange={v => setBaseGrade(v as AsphaltProduct)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Grade</Label>
                <Select value={targetGrade} onValueChange={v => setTargetGrade(v as AsphaltProduct)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Polymer Modifier Type</Label>
                <Select value={polymerType} onValueChange={v => setPolymerType(v as PolymerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {polymerOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Polymer Dosage (%)</Label>
                <Input
                  type="number"
                  value={polymerPct}
                  onChange={e => setPolymerPct(e.target.value)}
                  step="0.1"
                  min="0"
                  max="35"
                />
                {guide && (
                  <p className="text-xs text-muted-foreground">
                    Typical range: {guide.min}–{guide.max}% (recommended: {guide.typical}%)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Batch Size (tons)</Label>
                <Input
                  type="number"
                  value={batchSizeTons}
                  onChange={e => setBatchSizeTons(e.target.value)}
                  step="1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Blend Temperature (°F)</Label>
                <Input
                  type="number"
                  value={blendTempF}
                  onChange={e => setBlendTempF(e.target.value)}
                  step="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Mix Time (minutes)</Label>
                <Input
                  type="number"
                  value={mixTimeMin}
                  onChange={e => setMixTimeMin(e.target.value)}
                  step="1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <CheckCircle size={20} />
                Calculation Results
              </CardTitle>
              <CardDescription>
                {baseGrade} → {targetGrade} using {polymerType} | Batch: {batchSizeTons} tons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Polymer Required', value: `${calc.polymerLbs.toLocaleString(undefined, {maximumFractionDigits: 0})} lbs`, sub: `${calc.polymerTons.toFixed(2)} tons` },
                  { label: 'Base Asphalt Required', value: `${calc.baseLbs.toLocaleString(undefined, {maximumFractionDigits: 0})} lbs`, sub: `${calc.baseGallons.toFixed(0)} gal` },
                  { label: 'Total Batch', value: `${calc.batchLbs.toLocaleString(undefined, {maximumFractionDigits: 0})} lbs`, sub: `${calc.batchGallons.toFixed(0)} gal` },
                  { label: 'Blend Temp', value: `${blendTempF}°F`, sub: `${(((parseFloat(blendTempF) || 0) - 32) * 5/9).toFixed(0)}°C` },
                  { label: 'Mix Time', value: `${mixTimeMin} min`, sub: '' },
                  { label: 'Polymer %', value: `${polymerPct}%`, sub: guide ? `Typical: ${guide.typical}%` : '' },
                ].map(item => (
                  <div key={item.label} className="bg-background rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{item.value}</div>
                    {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setSaveDialogOpen(true)} className="gap-2">
                  <BookOpen size={16} />
                  Save Formulation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Formulations */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen size={16} className="text-amber-500" />
                Saved Formulations
                <Badge variant="secondary" className="ml-auto">{(formulations || []).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {(formulations || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No saved formulations yet</p>
              )}
              {(formulations || []).map(f => (
                <div key={f.formulation_id} className="border rounded-lg p-2.5 space-y-1 text-sm">
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.base_grade} → {f.target_grade}</div>
                  <div className="text-xs text-muted-foreground">{f.polymer_type} @ {f.polymer_percentage}%</div>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => loadFormulation(f)}>Load</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => setDeleteTarget(f.formulation_id)}>
                      <Trash size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Industry Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen size={16} />
            SBS Polymer Dosage Reference (PG 64-22 Base)
          </CardTitle>
          <CardDescription>Industry-standard dosage guidelines for SBS polymer modification</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Grade</TableHead>
                <TableHead>Min %</TableHead>
                <TableHead>Typical %</TableHead>
                <TableHead>Max %</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { grade: 'PG 64-22', min: '0', typ: '0', max: '0', note: 'No modification required' },
                { grade: 'PG 70-22', min: '1.5', typ: '2.5', max: '3.5', note: 'Light SBS modification' },
                { grade: 'PG 76-22', min: '3.5', typ: '4.5', max: '5.5', note: 'Medium SBS modification' },
                { grade: 'PG 82-22', min: '5.5', typ: '7.0', max: '8.5', note: 'Heavy SBS modification' },
              ].map(row => (
                <TableRow key={row.grade}>
                  <TableCell className="font-medium">{row.grade}</TableCell>
                  <TableCell>{row.min}%</TableCell>
                  <TableCell><Badge variant="outline">{row.typ}%</Badge></TableCell>
                  <TableCell>{row.max}%</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{row.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Formulation</DialogTitle>
            <DialogDescription>Save this blend as a named formulation for future use</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Formulation Name</Label>
              <Input value={formulationName} onChange={e => setFormulationName(e.target.value)} placeholder="e.g. PG 76-22 Standard Mix" />
            </div>
            <div className="text-sm text-muted-foreground space-y-1 bg-muted p-3 rounded">
              <div>{baseGrade} → {targetGrade}</div>
              <div>{polymerType} @ {polymerPct}%</div>
              <div>Temp: {blendTempF}°F | Mix: {mixTimeMin} min</div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Formulation</DialogTitle>
            <DialogDescription>Are you sure you want to delete this formulation?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
