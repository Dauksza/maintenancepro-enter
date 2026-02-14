import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Database,
  DownloadSimple,
  UploadSimple,
  Trash,
  CheckCircle,
  Warning,
  Info,
  ArrowClockwise
} from '@phosphor-icons/react'
import {
  exportDatabase,
  importDatabase,
  clearAllData,
  getDataStatistics,
  validateDataIntegrity,
  repairDataIntegrity,
  downloadSnapshot,
  uploadSnapshot,
  type DatabaseSnapshot
} from '@/lib/database-manager'
import { toast } from 'sonner'

export function DatabaseManagement() {
  const [stats, setStats] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)
  const [pendingSnapshot, setPendingSnapshot] = useState<DatabaseSnapshot | null>(null)

  const loadStats = async () => {
    setLoading(true)
    try {
      const statistics = await getDataStatistics()
      setStats(statistics)
    } catch (error) {
      toast.error('Failed to load statistics')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const snapshot = await exportDatabase()
      downloadSnapshot(snapshot)
      toast.success('Database exported successfully')
    } catch (error) {
      toast.error('Failed to export database')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const snapshot = await uploadSnapshot(file)
      setPendingSnapshot(snapshot)
      setConfirmImportOpen(true)
    } catch (error) {
      toast.error('Failed to read backup file')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    if (!pendingSnapshot) return

    setLoading(true)
    try {
      await importDatabase(pendingSnapshot)
      toast.success('Database imported successfully - reloading page...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error('Failed to import database')
      console.error(error)
    } finally {
      setLoading(false)
      setConfirmImportOpen(false)
      setPendingSnapshot(null)
    }
  }

  const handleValidate = async () => {
    setLoading(true)
    try {
      const result = await validateDataIntegrity()
      setValidation(result)
      if (result.valid) {
        toast.success('Data integrity check passed')
      } else {
        toast.warning(`Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`)
      }
    } catch (error) {
      toast.error('Failed to validate data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRepair = async () => {
    setLoading(true)
    try {
      const result = await repairDataIntegrity()
      if (result.repaired) {
        toast.success(`Repaired data: ${result.actions.length} action(s) taken`)
        await handleValidate()
      } else {
        toast.info('No repairs needed')
      }
    } catch (error) {
      toast.error('Failed to repair data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      await clearAllData()
      toast.success('All data cleared - reloading page...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error('Failed to clear data')
      console.error(error)
    } finally {
      setLoading(false)
      setConfirmClearOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Database Management</h2>
        <p className="text-muted-foreground">
          Manage data persistence, backups, and integrity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={24} />
              Backup & Restore
            </CardTitle>
            <CardDescription>
              Export and import complete database snapshots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              <DownloadSimple size={18} />
              Export Database Backup
            </Button>
            
            <div>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={loading}
                className="w-full gap-2"
                variant="outline"
              >
                <UploadSimple size={18} />
                Import Database Backup
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => setConfirmClearOpen(true)}
                disabled={loading}
                className="w-full gap-2"
                variant="destructive"
              >
                <Trash size={18} />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={24} />
              Data Integrity
            </CardTitle>
            <CardDescription>
              Validate and repair data relationships
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleValidate}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              <CheckCircle size={18} />
              Validate Data Integrity
            </Button>

            {validation && (
              <div className="space-y-2">
                {validation.valid ? (
                  <Badge className="w-full justify-center" variant="default">
                    <CheckCircle size={16} className="mr-2" />
                    All checks passed
                  </Badge>
                ) : (
                  <>
                    {validation.errors.length > 0 && (
                      <Badge className="w-full justify-center" variant="destructive">
                        <Warning size={16} className="mr-2" />
                        {validation.errors.length} error(s)
                      </Badge>
                    )}
                    {validation.warnings.length > 0 && (
                      <Badge className="w-full justify-center bg-accent text-accent-foreground">
                        <Info size={16} className="mr-2" />
                        {validation.warnings.length} warning(s)
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}

            {validation && !validation.valid && (
              <Button
                onClick={handleRepair}
                disabled={loading}
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <ArrowClockwise size={18} />
                Auto-Repair Issues
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={24} />
            Database Statistics
          </CardTitle>
          <CardDescription>
            Current data storage overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!stats ? (
              <Button onClick={loadStats} disabled={loading} variant="outline">
                Load Statistics
              </Button>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Work Orders</div>
                  <div className="text-2xl font-bold">{stats.workOrders.total}</div>
                  {stats.workOrders.byStatus && (
                    <div className="text-xs space-y-1">
                      {Object.entries(stats.workOrders.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between">
                          <span className="text-muted-foreground">{status}:</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Employees</div>
                  <div className="text-2xl font-bold">{stats.employees.total}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.employees.active} active
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Parts</div>
                  <div className="text-2xl font-bold">{stats.parts.total}</div>
                  <div className="text-xs space-y-1">
                    <div className="text-destructive">{stats.parts.outOfStock} out of stock</div>
                    <div className="text-accent">{stats.parts.lowStock} low stock</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Skills</div>
                  <div className="text-2xl font-bold">{stats.skills.uniqueSkills}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.skills.total} total entries
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">SOPs</div>
                  <div className="text-2xl font-bold">{stats.sops.total}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Assets</div>
                  <div className="text-2xl font-bold">{stats.assets.total}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.assets.operational} operational
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Areas</div>
                  <div className="text-2xl font-bold">{stats.areas.total}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Forms</div>
                  <div className="text-2xl font-bold">{stats.forms.templates}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.forms.submissions} submissions
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {validation && !validation.valid && (
        <Card>
          <CardHeader>
            <CardTitle>Data Integrity Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <Warning size={18} />
                  Errors ({validation.errors.length})
                </h4>
                <ul className="space-y-1 text-sm">
                  {validation.errors.map((error: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                  <Info size={18} />
                  Warnings ({validation.warnings.length})
                </h4>
                <ul className="space-y-1 text-sm">
                  {validation.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all work orders, employees, parts, forms, and all other data.
              This action cannot be undone. Consider exporting a backup first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmClearOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={loading}
            >
              Clear All Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmImportOpen} onOpenChange={setConfirmImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Database Backup?</DialogTitle>
            <DialogDescription>
              This will replace all current data with the backup. Consider exporting current data first.
              The page will reload after import.
            </DialogDescription>
          </DialogHeader>
          {pendingSnapshot && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backup Version:</span>
                <span className="font-medium">{pendingSnapshot.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backup Date:</span>
                <span className="font-medium">
                  {new Date(pendingSnapshot.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Orders:</span>
                <span className="font-medium">{pendingSnapshot.data.workOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employees:</span>
                <span className="font-medium">{pendingSnapshot.data.employees.length}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmImportOpen(false)
                setPendingSnapshot(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmImport}
              disabled={loading}
            >
              Import Backup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
