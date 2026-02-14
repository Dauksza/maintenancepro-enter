import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell,
  Database,
  DownloadSimple,
  UploadSimple,
  Trash,
  CheckCircle,
  Warning,
  ClockCounterClockwise,
  FileArrowDown,
  Info
} from '@phosphor-icons/react'
import { ActivityLog } from '@/components/ActivityLog'
import { toast } from 'sonner'
import type { NotificationPreferences } from '@/components/NotificationPreferences'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  onOpenImport?: () => void
  onExportData?: () => void
}

export function SettingsDialog({ open, onClose, onOpenImport, onExportData }: SettingsDialogProps) {
  const [notificationPreferences, setNotificationPreferences] = useKV<NotificationPreferences>(
    'notification-preferences',
    {
      enabled: true,
      showToasts: true,
      playSound: false,
      notifyOnAssignmentSuggestions: true,
      notifyOnAssignmentChanges: true,
      notifyOnWorkOrderCreated: false,
      notifyOnWorkOrderOverdue: true,
      notifyOnPriorityEscalation: true,
      minimumMatchScore: 60,
      autoAcceptHighMatchScore: false,
      autoAcceptThreshold: 90
    }
  )

  const [confirmClear, setConfirmClear] = useState(false)

  const handleUpdatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setNotificationPreferences((current) => ({
      ...(current || {}),
      [key]: value
    } as NotificationPreferences))
  }

  const handleBackupData = async () => {
    try {
      const keys = await window.spark.kv.keys()
      const backup: Record<string, any> = {}
      
      for (const key of keys) {
        backup[key] = await window.spark.kv.get(key)
      }

      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `maintenancepro-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Data backup downloaded successfully')
    } catch (error) {
      console.error('Backup failed:', error)
      toast.error('Failed to create backup')
    }
  }

  const handleRestoreData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const backup = JSON.parse(text)
        
        for (const [key, value] of Object.entries(backup)) {
          await window.spark.kv.set(key, value)
        }
        
        toast.success('Data restored successfully - page will reload')
        setTimeout(() => window.location.reload(), 1500)
      } catch (error) {
        console.error('Restore failed:', error)
        toast.error('Failed to restore backup')
      }
    }
    input.click()
  }

  const handleClearAllData = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }

    try {
      const keys = await window.spark.kv.keys()
      for (const key of keys) {
        await window.spark.kv.delete(key)
      }
      
      toast.success('All data cleared - page will reload')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      console.error('Clear failed:', error)
      toast.error('Failed to clear data')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application preferences, data, and notifications
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">
              <Bell size={16} className="mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database size={16} className="mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="import-export">
              <DownloadSimple size={16} className="mr-2" />
              Import/Export
            </TabsTrigger>
            <TabsTrigger value="activity">
              <ClockCounterClockwise size={16} className="mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="notifications" className="space-y-6 pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure how and when you receive notifications
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Master toggle for all notifications
                      </p>
                    </div>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationPreferences?.enabled || false}
                      onCheckedChange={(checked) => handleUpdatePreference('enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-toasts">Show Toast Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Display popup notifications in the corner
                      </p>
                    </div>
                    <Switch
                      id="show-toasts"
                      checked={notificationPreferences?.showToasts || false}
                      onCheckedChange={(checked) => handleUpdatePreference('showToasts', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="play-sound">Play Sound</Label>
                      <p className="text-xs text-muted-foreground">
                        Play audio alert for new notifications
                      </p>
                    </div>
                    <Switch
                      id="play-sound"
                      checked={notificationPreferences?.playSound || false}
                      onCheckedChange={(checked) => handleUpdatePreference('playSound', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Work Order Notifications</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-suggestions">Assignment Suggestions</Label>
                      <p className="text-xs text-muted-foreground">
                        When you're suggested for a work order
                      </p>
                    </div>
                    <Switch
                      id="notify-suggestions"
                      checked={notificationPreferences?.notifyOnAssignmentSuggestions || false}
                      onCheckedChange={(checked) => handleUpdatePreference('notifyOnAssignmentSuggestions', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-changes">Assignment Changes</Label>
                      <p className="text-xs text-muted-foreground">
                        When work orders are assigned to you
                      </p>
                    </div>
                    <Switch
                      id="notify-changes"
                      checked={notificationPreferences?.notifyOnAssignmentChanges || false}
                      onCheckedChange={(checked) => handleUpdatePreference('notifyOnAssignmentChanges', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-overdue">Overdue Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        When work orders become overdue
                      </p>
                    </div>
                    <Switch
                      id="notify-overdue"
                      checked={notificationPreferences?.notifyOnWorkOrderOverdue || false}
                      onCheckedChange={(checked) => handleUpdatePreference('notifyOnWorkOrderOverdue', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-escalation">Priority Escalation</Label>
                      <p className="text-xs text-muted-foreground">
                        When priority levels increase
                      </p>
                    </div>
                    <Switch
                      id="notify-escalation"
                      checked={notificationPreferences?.notifyOnPriorityEscalation || false}
                      onCheckedChange={(checked) => handleUpdatePreference('notifyOnPriorityEscalation', checked)}
                      disabled={!notificationPreferences?.enabled}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-6 pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Backup, restore, and manage your application data
                  </p>
                </div>

                <Separator />

                <Alert>
                  <Info size={16} />
                  <AlertDescription>
                    All data is stored locally in your browser. Regular backups are recommended.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleBackupData}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileArrowDown size={18} className="mr-2" />
                    Download Full Backup
                  </Button>

                  <Button
                    onClick={handleRestoreData}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <ClockCounterClockwise size={18} className="mr-2" />
                    Restore from Backup
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Warning size={20} className="text-destructive mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-destructive">Danger Zone</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Irreversible actions that will permanently delete data
                        </p>
                      </div>
                    </div>

                    {confirmClear && (
                      <Alert variant="destructive">
                        <Warning size={16} />
                        <AlertDescription>
                          Are you sure? This will delete ALL data and cannot be undone!
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleClearAllData}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash size={18} className="mr-2" />
                      {confirmClear ? 'Click Again to Confirm' : 'Clear All Data'}
                    </Button>

                    {confirmClear && (
                      <Button
                        onClick={() => setConfirmClear(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import-export" className="space-y-6 pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Import & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Import data from Excel/CSV files or export current data
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <UploadSimple size={18} />
                      Import Data
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Import work orders, SOPs, and spares/labor data from Excel or CSV files
                    </p>
                    <Button
                      onClick={() => {
                        onOpenImport?.()
                        onClose()
                      }}
                      className="w-full mt-2"
                    >
                      <UploadSimple size={18} className="mr-2" />
                      Open Import Tool
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <DownloadSimple size={18} />
                      Export Data
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Export all work orders, SOPs, and related data to Excel format
                    </p>
                    <Button
                      onClick={() => {
                        onExportData?.()
                        onClose()
                      }}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      <DownloadSimple size={18} className="mr-2" />
                      Export to Excel
                    </Button>
                  </div>
                </div>

                <Alert>
                  <CheckCircle size={16} />
                  <AlertDescription>
                    Import supports batch operations - you can add new data without affecting existing records
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="pr-4">
              <ActivityLog />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
