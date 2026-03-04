import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  MagnifyingGlass, 
  Wrench, 
  User, 
  Package as PackageIcon, 
  Toolbox, 
  ClipboardText,
  CheckSquare,
  FileText,
  Buildings
} from '@phosphor-icons/react'
import { globalSearch } from '@/lib/search-utils'
import type { 
  SearchResult, 
  SearchResultType,
  WorkOrder,
  Employee,
  Asset,
  PartInventoryItem,
  SOP,
  FormTemplate,
  FormSubmission
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
  workOrders: WorkOrder[]
  employees: Employee[]
  assets: Asset[]
  parts: PartInventoryItem[]
  sops: SOP[]
  formTemplates: FormTemplate[]
  formSubmissions: FormSubmission[]
  onSelectWorkOrder?: (wo: WorkOrder) => void
  onSelectEmployee?: (emp: Employee) => void
  onSelectAsset?: (asset: Asset) => void
  onSelectPart?: (part: PartInventoryItem) => void
  onSelectSOP?: (sop: SOP) => void
  onSelectFormTemplate?: (template: FormTemplate) => void
  onSelectFormSubmission?: (submission: FormSubmission) => void
}

const resultTypeConfig: Record<SearchResultType, { icon: any; label: string; color: string }> = {
  'work-order': { icon: Wrench, label: 'Work Order', color: 'text-blue-600' },
  'employee': { icon: User, label: 'Employee', color: 'text-green-600' },
  'asset': { icon: PackageIcon, label: 'Asset', color: 'text-purple-600' },
  'part': { icon: Toolbox, label: 'Part', color: 'text-orange-600' },
  'sop': { icon: ClipboardText, label: 'SOP', color: 'text-indigo-600' },
  'form-template': { icon: CheckSquare, label: 'Form Template', color: 'text-pink-600' },
  'form-submission': { icon: FileText, label: 'Submission', color: 'text-teal-600' },
  'area': { icon: Buildings, label: 'Area', color: 'text-slate-600' }
}

export function GlobalSearch({
  open,
  onClose,
  workOrders,
  employees,
  assets,
  parts,
  sops,
  formTemplates,
  formSubmissions,
  onSelectWorkOrder,
  onSelectEmployee,
  onSelectAsset,
  onSelectPart,
  onSelectSOP,
  onSelectFormTemplate,
  onSelectFormSubmission
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedType, setSelectedType] = useState<SearchResultType | 'all'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchResults = globalSearch(
      query,
      {
        workOrders,
        employees,
        assets,
        parts,
        sops,
        formTemplates,
        formSubmissions
      },
      selectedType !== 'all' ? { types: [selectedType] } : undefined,
      50
    )

    setResults(searchResults)
    setSelectedIndex(0)
  }, [query, selectedType, workOrders, employees, assets, parts, sops, formTemplates, formSubmissions])

  useEffect(() => {
    const debounce = setTimeout(performSearch, 300)
    return () => clearTimeout(debounce)
  }, [performSearch])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setSelectedType('all')
    }
  }, [open])

  const handleSelectResult = (result: SearchResult) => {
    switch (result.type) {
      case 'work-order': {
        const wo = workOrders.find(w => w.work_order_id === result.id)
        if (wo && onSelectWorkOrder) onSelectWorkOrder(wo)
        break
      }
      case 'employee': {
        const emp = employees.find(e => e.employee_id === result.id)
        if (emp && onSelectEmployee) onSelectEmployee(emp)
        break
      }
      case 'asset': {
        const asset = assets.find(a => a.asset_id === result.id)
        if (asset && onSelectAsset) onSelectAsset(asset)
        break
      }
      case 'part': {
        const part = parts.find(p => p.part_id === result.id)
        if (part && onSelectPart) onSelectPart(part)
        break
      }
      case 'sop': {
        const sop = sops.find(s => s.sop_id === result.id)
        if (sop && onSelectSOP) onSelectSOP(sop)
        break
      }
      case 'form-template': {
        const template = formTemplates.find(t => t.template_id === result.id)
        if (template && onSelectFormTemplate) onSelectFormTemplate(template)
        break
      }
      case 'form-submission': {
        const submission = formSubmissions.find(s => s.submission_id === result.id)
        if (submission && onSelectFormSubmission) onSelectFormSubmission(submission)
        break
      }
    }
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelectResult(results[selectedIndex])
    }
  }

  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<SearchResultType, SearchResult[]>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[80vh] overflow-hidden">
        <div className="border-b p-4 bg-muted/50">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search work orders, employees, assets, parts, SOPs, forms..."
              className="pl-10 text-lg h-12 border-0 bg-background focus-visible:ring-2"
              autoFocus
            />
          </div>
        </div>

        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as SearchResultType | 'all')} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="all" className="gap-2">
                All ({results.length})
              </TabsTrigger>
              {Object.entries(resultsByType).map(([type, typeResults]) => {
                const config = resultTypeConfig[type as SearchResultType]
                const Icon = config.icon
                return (
                  <TabsTrigger key={type} value={type} className="gap-2">
                    <Icon size={16} className={config.color} />
                    {config.label} ({typeResults.length})
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0 p-4">
              {results.length === 0 && query && (
                <div className="text-center py-12 text-muted-foreground">
                  <MagnifyingGlass size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              )}

              {results.length === 0 && !query && (
                <div className="text-center py-12 text-muted-foreground">
                  <MagnifyingGlass size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Start typing to search...</p>
                </div>
              )}

              <div className="space-y-2">
                {results.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    selected={index === selectedIndex}
                    onClick={() => handleSelectResult(result)}
                  />
                ))}
              </div>
            </TabsContent>

            {Object.entries(resultsByType).map(([type, typeResults]) => (
              <TabsContent key={type} value={type} className="m-0 p-4">
                <div className="space-y-2">
                  {typeResults.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      selected={false}
                      onClick={() => handleSelectResult(result)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <div className="border-t p-3 bg-muted/50 text-xs text-muted-foreground flex gap-4">
          <div className="flex gap-2 items-center">
            <kbd className="px-2 py-1 bg-background border rounded">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex gap-2 items-center">
            <kbd className="px-2 py-1 bg-background border rounded">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex gap-2 items-center">
            <kbd className="px-2 py-1 bg-background border rounded">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SearchResultItem({
  result,
  selected,
  onClick
}: {
  result: SearchResult
  selected: boolean
  onClick: () => void
}) {
  const config = resultTypeConfig[result.type]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all hover:border-primary hover:bg-accent/50",
        selected && "border-primary bg-accent/50 ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md bg-muted", config.color)}>
          <Icon size={20} weight="duotone" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{result.title}</h4>
              {result.subtitle && (
                <p className="text-xs text-muted-foreground">{result.subtitle}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {result.status && (
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
              )}
              {result.priority && (
                <Badge 
                  variant={result.priority === 'Critical' || result.priority === 'High' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {result.priority}
                </Badge>
              )}
            </div>
          </div>

          {result.highlight && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {result.highlight}
            </p>
          )}

          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(result.metadata).map(([key, value]) => (
                <span key={key} className="text-xs text-muted-foreground">
                  <span className="font-medium">{key}:</span> {value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
