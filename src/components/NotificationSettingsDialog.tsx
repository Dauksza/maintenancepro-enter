import { useState } from 'react'
import type { NotificationSettings } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Gear, Bell, Envelope, DeviceMobile, ChatCircle } from '@phosphor-icons/react'

interface NotificationSettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: NotificationSettings
  onSave: (settings: NotificationSettings) => void
}

export function NotificationSettingsDialog({
  open,
  onClose,
  settings,
  onSave
}: NotificationSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [customDays, setCustomDays] = useState('')

  const handleSave = () => {
    onSave({
      ...localSettings,
      updated_at: new Date().toISOString()
    })
    onClose()
  }

  const handleToggleMethod = (method: 'Email' | 'SMS' | 'In-App') => {
    const current = localSettings.notify_methods || []
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method]
    
    setLocalSettings({
      ...localSettings,
      notify_methods: updated
    })
  }

  const handleAddCustomDay = () => {
    const days = parseInt(customDays)
    if (isNaN(days) || days < 0 || days > 365) return
    
    const current = localSettings.notify_at_days || []
    if (current.includes(days)) return
    
    setLocalSettings({
      ...localSettings,
      notify_at_days: [...current, days].sort((a, b) => b - a)
    })
    setCustomDays('')
  }

  const handleRemoveDay = (day: number) => {
    setLocalSettings({
      ...localSettings,
      notify_at_days: (localSettings.notify_at_days || []).filter(d => d !== day)
    })
  }

  const presetDays = [0, 1, 3, 7, 14, 30, 60, 90]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear size={24} />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure when and how certification renewal reminders are sent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all certification renewal notifications
              </p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, enabled: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">Notification Methods</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="method-inapp"
                  checked={localSettings.notify_methods?.includes('In-App')}
                  onCheckedChange={() => handleToggleMethod('In-App')}
                />
                <Label htmlFor="method-inapp" className="flex items-center gap-2 cursor-pointer">
                  <ChatCircle size={18} />
                  In-App Notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="method-email"
                  checked={localSettings.notify_methods?.includes('Email')}
                  onCheckedChange={() => handleToggleMethod('Email')}
                />
                <Label htmlFor="method-email" className="flex items-center gap-2 cursor-pointer">
                  <Envelope size={18} />
                  Email Notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="method-sms"
                  checked={localSettings.notify_methods?.includes('SMS')}
                  onCheckedChange={() => handleToggleMethod('SMS')}
                />
                <Label htmlFor="method-sms" className="flex items-center gap-2 cursor-pointer">
                  <DeviceMobile size={18} />
                  SMS Notifications
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Notify Before Expiry (Days)</Label>
            <p className="text-sm text-muted-foreground">
              Send reminders at these intervals before certification expires
            </p>
            
            <div className="flex gap-2 flex-wrap">
              {(localSettings.notify_at_days || []).map(day => (
                <Badge
                  key={day}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveDay(day)}
                >
                  {day === 0 ? 'Expiry Day' : `${day} days`} ×
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Add custom days..."
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomDay()
                  }
                }}
                min="0"
                max="365"
              />
              <Button variant="outline" onClick={handleAddCustomDay}>
                Add
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {presetDays.map(day => {
                const isAdded = (localSettings.notify_at_days || []).includes(day)
                return (
                  <Button
                    key={day}
                    variant={isAdded ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (isAdded) {
                        handleRemoveDay(day)
                      } else {
                        setLocalSettings({
                          ...localSettings,
                          notify_at_days: [...(localSettings.notify_at_days || []), day].sort((a, b) => b - a)
                        })
                      }
                    }}
                  >
                    {day === 0 ? 'Expiry' : `${day}d`}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Escalate to Manager</Label>
                <p className="text-sm text-muted-foreground">
                  Notify department manager when certifications are overdue
                </p>
              </div>
              <Switch
                checked={localSettings.escalate_to_manager}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, escalate_to_manager: checked })
                }
              />
            </div>
            
            {localSettings.escalate_to_manager && (
              <div className="space-y-2">
                <Label htmlFor="escalation-days">Escalation Threshold (days after expiry)</Label>
                <Input
                  id="escalation-days"
                  type="number"
                  value={localSettings.escalation_days}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      escalation_days: parseInt(e.target.value) || 0
                    })
                  }
                  min="1"
                  max="90"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Disable Employee</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically mark employee inactive if critical certifications expire
                </p>
              </div>
              <Switch
                checked={localSettings.auto_disable_employee}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, auto_disable_employee: checked })
                }
              />
            </div>

            {localSettings.auto_disable_employee && (
              <div className="space-y-2">
                <Label htmlFor="disable-days">Days After Expiry to Auto-Disable</Label>
                <Input
                  id="disable-days"
                  type="number"
                  value={Math.abs(localSettings.auto_disable_days)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      auto_disable_days: -Math.abs(parseInt(e.target.value) || 0)
                    })
                  }
                  min="0"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 to disable immediately upon expiry
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Bell size={18} />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
