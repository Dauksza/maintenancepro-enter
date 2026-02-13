import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import type { WorkOrder, SOP, SparesLabor, ExcelImportData } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { WorkOrderGrid } from '@/components/WorkOrderGrid'
import { WorkOrderDetail } from '@/components/WorkOrderDetail'
import { SOPLibrary } from '@/components/SOPLibrary'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { ExcelImport } from '@/components/ExcelImport'
import { 
  Wrench, 
  ClipboardText, 
  ChartBar, 
  UploadSimple,
  Plus,
  DownloadSimple
} from '@phosphor-icons/react'
import { 
  generateSampleWorkOrders, 
  generateSampleSOPs, 
  generateSampleSparesLabor,
  exportToExcel
} from '@/lib/excel-parser'
import { isOverdue } from '@/lib/maintenance-utils'
import { toast } from 'sonner'

function App() {
  const [workOrders, setWorkOrders] = useKV<WorkOrder[]>('maintenance-work-orders', [])
  const [sops, setSOPs] = useKV<SOP[]>('sop-library', [])
  const [sparesLabor, setSparesLabor] = useKV<SparesLabor[]>('spares-labor', [])
  
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tracking')

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkOrders((currentOrders) => 
        (currentOrders || []).map(wo => {
          const nowOverdue = isOverdue(wo)
          if (nowOverdue !== wo.is_overdue) {
            return {
              ...wo,
              is_overdue: nowOverdue,
              status: nowOverdue ? 'Overdue' : wo.status,
              updated_at: new Date().toISOString()
            }
          }
          return wo
        })
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [setWorkOrders])

  const handleUpdateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((currentOrders) =>
      (currentOrders || []).map(wo => {
        if (wo.work_order_id === id) {
          const updated = { ...wo, ...updates }
          if (updates.status === 'Completed' && !updates.completed_at) {
            updated.completed_at = new Date().toISOString()
            updated.is_overdue = false
          }
          return updated
        }
        return wo
      })
    )
    toast.success('Work order updated')
  }

  const handleSelectWorkOrder = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo)
    setDetailOpen(true)
  }

  const handleGenerateWorkOrders = (newWorkOrders: WorkOrder[]) => {
    setWorkOrders((current) => [...(current || []), ...newWorkOrders])
  }

  const handleImportComplete = (data: ExcelImportData) => {
    setWorkOrders((current) => [...(current || []), ...data.workOrders])
    setSOPs((current) => [...(current || []), ...data.sops])
    setSparesLabor((current) => [...(current || []), ...data.sparesLabor])
  }

  const handleLoadSampleData = () => {
    const sampleWOs = generateSampleWorkOrders()
    const sampleSOPs = generateSampleSOPs()
    const sampleSpares = generateSampleSparesLabor()
    
    setWorkOrders(sampleWOs)
    setSOPs(sampleSOPs)
    setSparesLabor(sampleSpares)
    
    toast.success('Sample data loaded successfully')
  }

  const handleExportData = () => {
    if (safeWorkOrders.length === 0 && safeSOPs.length === 0 && safeSparesLabor.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      exportToExcel({
        workOrders: safeWorkOrders,
        sops: safeSOPs,
        sparesLabor: safeSparesLabor
      })
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
      console.error(error)
    }
  }

  const safeWorkOrders = workOrders || []
  const safeSOPs = sops || []
  const safeSparesLabor = sparesLabor || []
  const overdueCount = safeWorkOrders.filter(wo => wo.is_overdue).length

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Toaster position="top-right" />
      
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">
                MaintenancePro
              </h1>
              <p className="text-sm text-muted-foreground">
                Enterprise CMMS & SOP Management System
              </p>
            </div>
            <div className="flex items-center gap-3">
              {overdueCount > 0 && (
                <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  {overdueCount} Overdue
                </div>
              )}
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <UploadSimple size={18} />
                Import Excel
              </Button>
              {(safeWorkOrders.length > 0 || safeSOPs.length > 0 || safeSparesLabor.length > 0) && (
                <Button variant="outline" onClick={handleExportData}>
                  <DownloadSimple size={18} />
                  Export Excel
                </Button>
              )}
              {safeWorkOrders.length === 0 && (
                <Button onClick={handleLoadSampleData}>
                  <Plus size={18} />
                  Load Sample Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Wrench size={18} />
              Maintenance Tracking
            </TabsTrigger>
            <TabsTrigger value="sops" className="flex items-center gap-2">
              <ClipboardText size={18} />
              SOP Library
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar size={18} />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Work Order Management</h2>
                <p className="text-muted-foreground">
                  Track and manage maintenance tasks across all equipment
                </p>
              </div>
            </div>

            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-lg p-12 text-center">
                <Wrench size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Work Orders Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Import Excel/CSV data or load sample work orders to get started
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setImportOpen(true)}>
                    <UploadSimple size={18} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <WorkOrderGrid
                workOrders={safeWorkOrders}
                onUpdateWorkOrder={handleUpdateWorkOrder}
                onSelectWorkOrder={handleSelectWorkOrder}
              />
            )}
          </TabsContent>

          <TabsContent value="sops" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Standard Operating Procedures</h2>
                <p className="text-muted-foreground">
                  Manage SOPs and generate preventive maintenance schedules
                </p>
              </div>
            </div>

            {safeSOPs.length === 0 ? (
              <div className="bg-card border rounded-lg p-12 text-center">
                <ClipboardText size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No SOPs Available</h3>
                <p className="text-muted-foreground mb-6">
                  Import your SOP library via Excel/CSV to enable automated PM scheduling
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setImportOpen(true)}>
                    <UploadSimple size={18} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <SOPLibrary
                sops={safeSOPs}
                onGenerateWorkOrders={handleGenerateWorkOrders}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Analytics & Reporting</h2>
                <p className="text-muted-foreground">
                  Visualize maintenance metrics and trends
                </p>
              </div>
            </div>

            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-lg p-12 text-center">
                <ChartBar size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Data to Analyze</h3>
                <p className="text-muted-foreground mb-6">
                  Import work orders via Excel/CSV or create sample data to view analytics
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setImportOpen(true)}>
                    <UploadSimple size={18} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <AnalyticsDashboard workOrders={safeWorkOrders} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <WorkOrderDetail
        workOrder={selectedWorkOrder}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedWorkOrder(null)
        }}
        onUpdate={handleUpdateWorkOrder}
        sparesLabor={safeSparesLabor}
      />

      <ExcelImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}

export default App
