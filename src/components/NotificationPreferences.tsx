import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Gear, Bell, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface NotificationPreferences {
  enabled: boolean
  showToasts: boolean
  playSound: boolean
  notifyOnAssignmentSuggestions: boolean
  notifyOnAssignmentChanges: boolean
  notifyOnWorkOrderCreated: boolean
  notifyOnWorkOrderOverdue: boolean
  notifyOnPriorityEscalation: boolean
  minimumMatchScore: number
  autoAcceptHighMatchScore: boolean
  autoAcceptThreshold: number
}

interface NotificationPreferencesDialogProps {
  preferences: NotificationPreferences
  onSave: (preferences: NotificationPreferences) => void
}

export function NotificationPreferencesDialog({
  preferences,
  onSave
}: NotificationPreferencesDialogProps) {
  const [open, setOpen] = useState(false)
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences)

  const handleSave = () => {
    onSave(localPrefs)
    setOpen(false)
    toast.success('Notification preferences saved')
  }

  const handleReset = () => {
    const defaultPrefs: NotificationPreferences = {
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
    setLocalPrefs(defaultPrefs)
    toast.info('Reset to default preferences')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gear size={16} />
          Notification Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell size={24} weight="fill" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how and when you receive work order notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell size={18} />
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive all work order notifications
                  </p>
                </div>
                <Switch
                  checked={localPrefs.enabled}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Toast Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Display popup notifications in the app
                  </p>
                </div>
                <Switch
                  checked={localPrefs.showToasts}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, showToasts: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Play Sound</Label>
                  <p className="text-xs text-muted-foreground">
                    Play a notification sound
                  </p>
                </div>
                <Switch
                  checked={localPrefs.playSound}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, playSound: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Notification Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Assignment Suggestions</Label>
                  <p className="text-xs text-muted-foreground">
                    When you're suggested for a work order
                  </p>
                </div>
                <Switch
                  checked={localPrefs.notifyOnAssignmentSuggestions}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, notifyOnAssignmentSuggestions: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Assignment Changes</Label>
                  <p className="text-xs text-muted-foreground">
                    When a work order is assigned or reassigned to you
                  </p>
                </div>
                <Switch
                  checked={localPrefs.notifyOnAssignmentChanges}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, notifyOnAssignmentChanges: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Work Orders</Label>
                  <p className="text-xs text-muted-foreground">
                    When new work orders are created
                  </p>
                </div>
                <Switch
                  checked={localPrefs.notifyOnWorkOrderCreated}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, notifyOnWorkOrderCreated: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Work Orders</Label>
                  <p className="text-xs text-muted-foreground">
                    When assigned work orders become overdue
                  </p>
                </div>
                <Switch
                  checked={localPrefs.notifyOnWorkOrderOverdue}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, notifyOnWorkOrderOverdue: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Priority Escalations</Label>
                  <p className="text-xs text-muted-foreground">
                    When work order priority is increased
                  </p>
                </div>
                <Switch
                  checked={localPrefs.notifyOnPriorityEscalation}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, notifyOnPriorityEscalation: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Smart Assignment Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Match Score</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Only notify for assignments with match score above this threshold
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={localPrefs.minimumMatchScore}
                    onChange={(e) =>
                      setLocalPrefs({ ...localPrefs, minimumMatchScore: parseInt(e.target.value) })
                    }
                    className="flex-1"
                    disabled={!localPrefs.enabled}
                  />
                  <span className="text-sm font-medium w-12 text-right">
                    {localPrefs.minimumMatchScore}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Accept High Matches</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically accept assignments with very high match scores
                  </p>
                </div>
                <Switch
                  checked={localPrefs.autoAcceptHighMatchScore}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, autoAcceptHighMatchScore: checked })
                  }
                  disabled={!localPrefs.enabled}
                />
              </div>

              {localPrefs.autoAcceptHighMatchScore && (
                <div className="space-y-2">
                  <Label>Auto-Accept Threshold</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Auto-accept assignments with match score above this value
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="5"
                      value={localPrefs.autoAcceptThreshold}
                      onChange={(e) =>
                        setLocalPrefs({ ...localPrefs, autoAcceptThreshold: parseInt(e.target.value) })
                      }
                      className="flex-1"
                      disabled={!localPrefs.enabled}
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {localPrefs.autoAcceptThreshold}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check size={16} weight="bold" />
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
