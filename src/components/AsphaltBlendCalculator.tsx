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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Calculator, Flask, BookOpen, Trash, CheckCircle, Scales, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  ASPHALT_DENSITY_LBS_GAL,
  TONS_TO_LBS,
  POLYMER_PROPERTIES,
  PG_GRADE_TEMPS,
  STORAGE_TEMP_RANGE,
  SBS_UPGRADE_FROM_PG6422,
  blendedHighPG,
  blendedLowPG,
} from '@/lib/asphalt-constants'

// ---------------------------------------------------------------------------
// Polymer dosage lookup table (base-grade → target-grade → polymer)
// ---------------------------------------------------------------------------
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
  'PG 58-28_PG 64-22': {
    'SBS': { min: 1.0, typical: 2.0, max: 3.0 },
    'SBR Latex': { min: 1.5, typical: 2.5, max: 3.5 },
    'Gilsonite': { min: 3.0, typical: 5.0, max: 8.0 },
    'Crumb Rubber': { min: 12.0, typical: 15.0, max: 18.0 },
    'Polyphosphoric Acid': { min: 0.2, typical: 0.4, max: 0.7 },
    'Custom': { min: 1.0, typical: 2.0, max: 4.0 },
  },
  'PG 64-22_PG 58-28': {
    'SBS': { min: 0.0, typical: 0.0, max: 0.0 },
    'SBR Latex': { min: 0.0, typical: 0.0, max: 0.0 },
    'Gilsonite': { min: 0.0, typical: 0.0, max: 0.0 },
    'Crumb Rubber': { min: 0.0, typical: 0.0, max: 0.0 },
    'Polyphosphoric Acid': { min: 0.0, typical: 0.0, max: 0.0 },
    'Custom': { min: 0.0, typical: 0.0, max: 0.0 },
  },
}

function getPolymerGuide(baseGrade: AsphaltProduct, targetGrade: AsphaltProduct, polymerType: PolymerType) {
  const key = `${baseGrade}_${targetGrade}`
  return POLYMER_DOSAGE_GUIDE[key]?.[polymerType] ?? null
}

// ---------------------------------------------------------------------------

const gradeOptions: AsphaltProduct[] = ['PG 58-28', 'PG 64-22', 'PG 70-22', 'PG 76-22', 'PG 82-22', 'AC-20', 'AC-30', 'Emulsion', 'Other']
const polymerOptions: PolymerType[] = ['SBS', 'SBR Latex', 'Gilsonite', 'Crumb Rubber', 'Polyphosphoric Acid', 'Custom']

export function AsphaltBlendCalculator() {
  const [formulations, setFormulations] = useKV<BlendFormulation[]>('blend-formulations', [])

  // Polymer modification tab state
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
  const [infoPolymer, setInfoPolymer] = useState<PolymerType | null>(null)

  // Grade blending (grade-on-grade) tab state
  const [blendGrade1, setBlendGrade1] = useState<AsphaltProduct>('PG 64-22')
  const [blendGrade2, setBlendGrade2] = useState<AsphaltProduct>('PG 82-22')
  const [blendRatioPct, setBlendRatioPct] = useState<string>('60')
  const [blendBatchTons, setBlendBatchTons] = useState<string>('200')

  const guide = useMemo(() => getPolymerGuide(baseGrade, targetGrade, polymerType), [baseGrade, targetGrade, polymerType])
  const polymerInfo = useMemo(() => POLYMER_PROPERTIES[polymerType] ?? null, [polymerType])

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

  const gradeBlend = useMemo(() => {
    const r1 = (parseFloat(blendRatioPct) || 0) / 100
    const r2 = 1 - r1
    const tons = parseFloat(blendBatchTons) || 0
    const grade1Tons = tons * r1
    const grade2Tons = tons * r2
    const g1 = PG_GRADE_TEMPS[blendGrade1]
    const g2 = PG_GRADE_TEMPS[blendGrade2]
    let estHighPG: number | null = null
    let estLowPG: number | null = null
    if (g1 && g2) {
      estHighPG = blendedHighPG(r1, g1.high, g2.high)
      estLowPG = blendedLowPG(r1, g1.low, g2.low)
    }
    const grade1Gal = (grade1Tons * TONS_TO_LBS) / ASPHALT_DENSITY_LBS_GAL
    const grade2Gal = (grade2Tons * TONS_TO_LBS) / ASPHALT_DENSITY_LBS_GAL
    return { r1, r2, grade1Tons, grade2Tons, grade1Gal, grade2Gal, estHighPG, estLowPG }
  }, [blendGrade1, blendGrade2, blendRatioPct, blendBatchTons])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator size={28} className="text-amber-500" />
            Asphalt Blend Calculator
          </h2>
          <p className="text-muted-foreground mt-1">Polymer modification dosage, grade blending, and industry reference data</p>
        </div>
      </div>

      <Tabs defaultValue="polymer">
        <TabsList className="mb-4">
          <TabsTrigger value="polymer" className="gap-1.5"><Flask size={14} />Polymer Modification</TabsTrigger>
          <TabsTrigger value="gradeblend" className="gap-1.5"><Scales size={14} />Grade Blending</TabsTrigger>
          <TabsTrigger value="reference" className="gap-1.5"><BookOpen size={14} />Reference Tables</TabsTrigger>
        </TabsList>

        {/* ── Polymer Modification Tab ─────────────────────────────────────── */}
        <TabsContent value="polymer" className="space-y-6">
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
                    {STORAGE_TEMP_RANGE[baseGrade] && (
                      <p className="text-xs text-muted-foreground">Storage: {STORAGE_TEMP_RANGE[baseGrade].min}–{STORAGE_TEMP_RANGE[baseGrade].max}°F (opt. {STORAGE_TEMP_RANGE[baseGrade].optimal}°F)</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Target Grade</Label>
                    <Select value={targetGrade} onValueChange={v => setTargetGrade(v as AsphaltProduct)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {STORAGE_TEMP_RANGE[targetGrade] && (
                      <p className="text-xs text-muted-foreground">Storage: {STORAGE_TEMP_RANGE[targetGrade].min}–{STORAGE_TEMP_RANGE[targetGrade].max}°F (opt. {STORAGE_TEMP_RANGE[targetGrade].optimal}°F)</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Polymer Modifier Type</Label>
                      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setInfoPolymer(polymerType)}>
                        <Info size={13} />
                      </button>
                    </div>
                    <Select value={polymerType} onValueChange={v => setPolymerType(v as PolymerType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {polymerOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {polymerInfo && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{polymerInfo.description}</p>
                    )}
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
                    {!guide && polymerInfo && (
                      <p className="text-xs text-muted-foreground">
                        General range: {polymerInfo.dosageRange.min}–{polymerInfo.dosageRange.max}% (typical: {polymerInfo.dosageRange.typical}%)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Size (tons)</Label>
                    <Input type="number" value={batchSizeTons} onChange={e => setBatchSizeTons(e.target.value)} step="1" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blend Temperature (°F)</Label>
                    <Input type="number" value={blendTempF} onChange={e => setBlendTempF(e.target.value)} step="1" />
                    {polymerInfo && (
                      <p className="text-xs text-muted-foreground">
                        Recommended: {polymerInfo.blendTempRange.min}–{polymerInfo.blendTempRange.max}°F
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mix Time (minutes)</Label>
                    <Input type="number" value={mixTimeMin} onChange={e => setMixTimeMin(e.target.value)} step="1" />
                    {polymerInfo && (
                      <p className="text-xs text-muted-foreground">
                        Recommended: {polymerInfo.mixTimeRange.min}–{polymerInfo.mixTimeRange.max} min
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Polymer Notes */}
              {polymerInfo?.notes && (
                <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>{polymerInfo.notes}</span>
                </div>
              )}

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
        </TabsContent>

        {/* ── Grade Blending Tab ────────────────────────────────────────────── */}
        <TabsContent value="gradeblend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scales size={20} className="text-blue-500" />
                Grade-on-Grade Blending Calculator
              </CardTitle>
              <CardDescription>
                Estimate the resultant PG grade when blending two asphalt binders using the rule of mixtures
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Grade 1</Label>
                  <Select value={blendGrade1} onValueChange={v => setBlendGrade1(v as AsphaltProduct)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {PG_GRADE_TEMPS[blendGrade1] && (
                    <p className="text-xs text-muted-foreground">
                      PG {PG_GRADE_TEMPS[blendGrade1].high}/{PG_GRADE_TEMPS[blendGrade1].low}°C
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Grade 2</Label>
                  <Select value={blendGrade2} onValueChange={v => setBlendGrade2(v as AsphaltProduct)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {PG_GRADE_TEMPS[blendGrade2] && (
                    <p className="text-xs text-muted-foreground">
                      PG {PG_GRADE_TEMPS[blendGrade2].high}/{PG_GRADE_TEMPS[blendGrade2].low}°C
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ratio — Grade 1 (%)</Label>
                  <Input type="number" value={blendRatioPct} onChange={e => setBlendRatioPct(e.target.value)} min="0" max="100" step="1" />
                  <p className="text-xs text-muted-foreground">Grade 2 proportion: {(100 - (parseFloat(blendRatioPct) || 0)).toFixed(0)}%</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Batch Size (tons)</Label>
                  <Input type="number" value={blendBatchTons} onChange={e => setBlendBatchTons(e.target.value)} min="0" step="10" />
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700 dark:text-blue-400">Blend Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gradeBlend.estHighPG !== null && gradeBlend.estLowPG !== null ? (
                      <div className="text-center py-2">
                        <div className="text-xs text-muted-foreground mb-1">Estimated Resultant Grade</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          PG {gradeBlend.estHighPG.toFixed(0)}-{Math.abs(gradeBlend.estLowPG).toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Rule of Mixtures approximation</div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        PG temperature data not available for selected grades
                      </div>
                    )}
                    {[
                      { label: `${blendGrade1} required`, value: `${gradeBlend.grade1Tons.toFixed(1)} tons`, sub: `${gradeBlend.grade1Gal.toFixed(0)} gal` },
                      { label: `${blendGrade2} required`, value: `${gradeBlend.grade2Tons.toFixed(1)} tons`, sub: `${gradeBlend.grade2Gal.toFixed(0)} gal` },
                      { label: 'Total batch', value: `${blendBatchTons} tons`, sub: '' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-start border-t pt-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{item.value}</div>
                          {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
                  <div className="font-medium text-foreground">Important Notes</div>
                  <p>The Rule of Mixtures gives a linear approximation and may not perfectly predict the final grade, especially for modified binders.</p>
                  <p>Always verify the final blended binder meets specification requirements through laboratory testing (AASHTO M320 / M332).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SBS Upgrade Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen size={16} />
                SBS Polymer Upgrade Guide (from PG 64-22 Base)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Grade</TableHead>
                    <TableHead>High Temp (°C)</TableHead>
                    <TableHead>SBS Min %</TableHead>
                    <TableHead>SBS Typical %</TableHead>
                    <TableHead>SBS Max %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(SBS_UPGRADE_FROM_PG6422).map(([grade, data]) => (
                    <TableRow key={grade}>
                      <TableCell className="font-medium">{grade}</TableCell>
                      <TableCell>{data.tempC}°C</TableCell>
                      <TableCell>{data.min}%</TableCell>
                      <TableCell><Badge variant="outline">{data.typical}%</Badge></TableCell>
                      <TableCell>{data.max}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reference Tables Tab ─────────────────────────────────────────── */}
        <TabsContent value="reference" className="space-y-6">
          {/* Polymer Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flask size={18} className="text-amber-500" />
                Polymer Modifier Properties &amp; Guidelines
              </CardTitle>
              <CardDescription>Industry-standard guidance for asphalt binder modification (AASHTO M332, ASTM D6373)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modifier</TableHead>
                    <TableHead>Dosage Range (%)</TableHead>
                    <TableHead>Blend Temp (°F)</TableHead>
                    <TableHead>Mix Time (min)</TableHead>
                    <TableHead>Key Benefit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(POLYMER_PROPERTIES).filter(([k]) => k !== 'Custom').map(([name, p]) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{p.dosageRange.min}–{p.dosageRange.max}%<br /><span className="text-xs text-muted-foreground">typ. {p.dosageRange.typical}%</span></TableCell>
                      <TableCell>{p.blendTempRange.min}–{p.blendTempRange.max}°F</TableCell>
                      <TableCell>{p.mixTimeRange.min}–{p.mixTimeRange.max}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">{p.mechanism.split(';')[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Storage Temperature Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen size={16} />
                Asphalt Storage Temperature Reference
              </CardTitle>
              <CardDescription>Recommended tank storage temperatures by grade (API RP 2003 / NAPA IS-2)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Min Storage (°F)</TableHead>
                    <TableHead>Optimal (°F)</TableHead>
                    <TableHead>Max Storage (°F)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(STORAGE_TEMP_RANGE).map(([grade, t]) => (
                    <TableRow key={grade}>
                      <TableCell className="font-medium">{grade}</TableCell>
                      <TableCell>{t.min}°F</TableCell>
                      <TableCell><Badge variant="outline">{t.optimal}°F</Badge></TableCell>
                      <TableCell>{t.max}°F</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {grade === 'Emulsion' ? 'Never heat above 185°F — emulsion breaks' : 'Avoid prolonged heating above max'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Original SBS Reference Table */}
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
        </TabsContent>
      </Tabs>

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

      {/* Polymer info dialog */}
      <Dialog open={!!infoPolymer} onOpenChange={() => setInfoPolymer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flask size={18} className="text-amber-500" />
              {infoPolymer} — Modifier Details
            </DialogTitle>
          </DialogHeader>
          {infoPolymer && POLYMER_PROPERTIES[infoPolymer] && (() => {
            const p = POLYMER_PROPERTIES[infoPolymer]
            return (
              <div className="space-y-3 text-sm">
                <div><span className="font-medium">Description: </span><span className="text-muted-foreground">{p.description}</span></div>
                <div><span className="font-medium">Mechanism: </span><span className="text-muted-foreground">{p.mechanism}</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Min Dosage', value: `${p.dosageRange.min}%` },
                    { label: 'Typical', value: `${p.dosageRange.typical}%` },
                    { label: 'Max Dosage', value: `${p.dosageRange.max}%` },
                    { label: 'Min Blend Temp', value: `${p.blendTempRange.min}°F` },
                    { label: 'Max Blend Temp', value: `${p.blendTempRange.max}°F` },
                    { label: 'Mix Time', value: `${p.mixTimeRange.min}–${p.mixTimeRange.max} min` },
                  ].map(item => (
                    <div key={item.label} className="bg-muted rounded p-2">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>{p.notes}</span>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

