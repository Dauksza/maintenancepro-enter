import { useState } from 'react'
import type { SOP, WorkOrder, MaintenanceFrequency } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  ClipboardText, 
  Lightning, 
  MagnifyingGlass,
  Warning as WarningIcon
} from '@phosphor-icons/react'
import { formatDate, calculateNextMaintenanceDate, generateWorkOrderId } from '@/lib/maintenance-utils'
import { toast } from 'sonner'

interface SOPLibraryProps {
  sops: SOP[]
  onGenerateWorkOrders: (workOrders: WorkOrder[]) => void
}

export function SOPLibrary({ sops, onGenerateWorkOrders }: SOPLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedFrequency, setSelectedFrequency] = useState<MaintenanceFrequency | null>(null)

  const filteredSOPs = sops.filter(sop => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      sop.sop_id.toLowerCase().includes(search) ||
      sop.title.toLowerCase().includes(search) ||
      sop.purpose.toLowerCase().includes(search)
    )
  })

  const handleGeneratePMs = () => {
    if (!selectedSOP || !selectedFrequency) {
      toast.error('Please select a frequency')
      return
    }

    const workOrders: WorkOrder[] = []
    const now = new Date()
    const baseDate = now.toISOString().split('T')[0]

    for (let i = 0; i < 4; i++) {
      const scheduledDate = calculateNextMaintenanceDate(
        i === 0 ? baseDate : workOrders[i - 1].scheduled_date,
        selectedFrequency
      )

      const wo: WorkOrder = {
        work_order_id: generateWorkOrderId(),
        equipment_area: selectedSOP.scope || 'General',
        priority_level: 'Medium',
        status: 'Scheduled (Not Started)',
        type: 'Maintenance',
        task: `${selectedFrequency} ${selectedSOP.title}`,
        comments_description: `${selectedSOP.loto_ppe_hazards}\n\nProcedure: ${selectedSOP.procedure_summary.substring(0, 200)}...`,
        scheduled_date: scheduledDate,
        estimated_downtime_hours: selectedFrequency === 'Daily' ? 0.5 : 
                                   selectedFrequency === 'Weekly' ? 1 :
                                   selectedFrequency === 'Monthly' ? 2 :
                                   selectedFrequency === 'Quarterly' ? 4 :
                                   selectedFrequency === 'Bi-Yearly' ? 6 : 8,
        assigned_technician: null,
        entered_by: 'System',
        terminal: 'Hanceville Terminal',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        completed_at: null,
        is_overdue: false,
        auto_generated: true,
        linked_sop_ids: [selectedSOP.sop_id]
      }

      workOrders.push(wo)
    }

    onGenerateWorkOrders(workOrders)
    setGenerateDialogOpen(false)
    toast.success(`Generated ${workOrders.length} work orders from ${selectedSOP.title}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
        <MagnifyingGlass size={20} className="text-muted-foreground" />
        <Input
          placeholder="Search SOPs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredSOPs.length} SOP{filteredSOPs.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSOPs.map(sop => (
          <Card key={sop.sop_id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardText size={20} className="text-primary" />
                    <code className="font-mono text-sm text-muted-foreground">
                      {sop.sop_id}
                    </code>
                  </CardTitle>
                  <CardDescription className="mt-2 font-semibold text-foreground">
                    {sop.title}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  Rev {sop.revision}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="line-clamp-2">{sop.purpose}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {sop.pm_frequencies_included.map(freq => (
                  <Badge key={freq} variant="secondary" className="text-xs">
                    {freq}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                Effective: {formatDate(sop.effective_date)}
              </div>

              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <code className="font-mono text-primary">{sop.sop_id}</code>
                        <Badge variant="outline">Rev {sop.revision}</Badge>
                      </DialogTitle>
                      <DialogDescription className="text-lg font-semibold text-foreground">
                        {sop.title}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-semibold mb-2">Purpose</h4>
                        <p className="text-sm text-muted-foreground">{sop.purpose}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Scope</h4>
                        <p className="text-sm text-muted-foreground">{sop.scope}</p>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                          <WarningIcon size={16} />
                          LOTO / PPE / Hazards
                        </h4>
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          {sop.loto_ppe_hazards}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Procedure</h4>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                          {sop.procedure_summary}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Records Required</h4>
                        <p className="text-sm text-muted-foreground">{sop.records_required}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">PM Frequencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {sop.pm_frequencies_included.map(freq => (
                            <Badge key={freq}>{freq}</Badge>
                          ))}
                        </div>
                      </div>

                      {sop.version_history.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Version History</h4>
                          <div className="space-y-2">
                            {sop.version_history.map((ver, idx) => (
                              <div key={idx} className="text-sm border-l-2 border-primary pl-3">
                                <div className="font-medium">
                                  Revision {ver.revision} - {formatDate(ver.date)}
                                </div>
                                <div className="text-muted-foreground">{ver.changes}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedSOP(sop)
                    setGenerateDialogOpen(true)
                  }}
                >
                  <Lightning size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSOPs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No SOPs found</p>
        </div>
      )}

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate PM Schedule</DialogTitle>
            <DialogDescription>
              Create recurring preventive maintenance work orders from this SOP
            </DialogDescription>
          </DialogHeader>

          {selectedSOP && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-semibold">{selectedSOP.title}</p>
                <p className="text-sm text-muted-foreground">{selectedSOP.sop_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Frequency
                </label>
                <Select
                  value={selectedFrequency || ''}
                  onValueChange={(v) => setSelectedFrequency(v as MaintenanceFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSOP.pm_frequencies_included.map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                This will generate the next 4 scheduled maintenance work orders
              </p>

              <div className="flex gap-2">
                <Button onClick={handleGeneratePMs} className="flex-1">
                  Generate Work Orders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
