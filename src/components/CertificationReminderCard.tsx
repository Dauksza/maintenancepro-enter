import { useState } from 'react'
import type { CertificationReminder, Employee } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Certificate,
  Warning,
  CheckCircle,
  X,
  Clock,
  User,
  CalendarBlank,
  BellRinging
} from '@phosphor-icons/react'
import { format } from 'date-fns'

interface CertificationReminderCardProps {
  reminder: CertificationReminder
  employee?: Employee
  onDismiss: (reminderId: string) => void
  onMarkAsRead: (reminderId: string) => void
  onRenew: (reminder: CertificationReminder, newExpiryDate: string) => void
}

export function CertificationReminderCard({
  reminder,
  employee,
  onDismiss,
  onMarkAsRead,
  onRenew
}: CertificationReminderCardProps) {
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [renewalNotes, setRenewalNotes] = useState('')

  const handleRenewSubmit = () => {
    if (!newExpiryDate) return
    onRenew(reminder, newExpiryDate)
    setRenewDialogOpen(false)
    setNewExpiryDate('')
    setRenewalNotes('')
  }

  const getPriorityColor = () => {
    switch (reminder.priority) {
      case 'Critical':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'High':
        return 'border-l-4 border-l-accent bg-accent/5'
      case 'Medium':
        return 'border-l-4 border-l-primary bg-primary/5'
      default:
        return 'border-l-4 border-l-muted-foreground bg-muted/30'
    }
  }

  const getPriorityBadge = () => {
    switch (reminder.priority) {
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'High':
        return <Badge className="bg-accent text-accent-foreground">High</Badge>
      case 'Medium':
        return <Badge variant="secondary">Medium</Badge>
      default:
        return <Badge variant="outline">Low</Badge>
    }
  }

  const getStatusIcon = () => {
    if (reminder.days_until_expiry < 0) {
      return <Warning size={24} weight="fill" className="text-destructive" />
    }
    if (reminder.days_until_expiry <= 7) {
      return <BellRinging size={24} weight="fill" className="text-accent" />
    }
    return <Clock size={24} className="text-primary" />
  }

  const getExpiryMessage = () => {
    if (reminder.days_until_expiry < 0) {
      return `Expired ${Math.abs(reminder.days_until_expiry)} days ago`
    }
    if (reminder.days_until_expiry === 0) {
      return 'Expires TODAY'
    }
    if (reminder.days_until_expiry === 1) {
      return 'Expires tomorrow'
    }
    return `Expires in ${reminder.days_until_expiry} days`
  }

  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'

  return (
    <>
      <Card className={`${getPriorityColor()} ${reminder.dismissed ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">{getStatusIcon()}</div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{reminder.skill_name}</h3>
                  {getPriorityBadge()}
                  <Badge variant="outline" className="text-xs">
                    {reminder.skill_category}
                  </Badge>
                  {reminder.notification_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Notified {reminder.notification_count}x
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>{employeeName}</span>
                  </div>
                  {employee?.department && (
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>{employee.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarBlank size={16} />
                    <span>Expires: {format(new Date(reminder.expiry_date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <div
                  className={`text-sm font-semibold ${
                    reminder.days_until_expiry < 0
                      ? 'text-destructive'
                      : reminder.days_until_expiry <= 7
                      ? 'text-accent'
                      : 'text-primary'
                  }`}
                >
                  {getExpiryMessage()}
                </div>

                {reminder.last_notified_at && (
                  <div className="text-xs text-muted-foreground">
                    Last notified: {format(new Date(reminder.last_notified_at), 'MMM dd, yyyy h:mm a')}
                  </div>
                )}

                {reminder.notes && (
                  <div className="text-sm bg-muted p-2 rounded">
                    {reminder.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!reminder.dismissed && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setRenewDialogOpen(true)}
                    className="whitespace-nowrap"
                  >
                    <Certificate size={16} />
                    Renew
                  </Button>
                  {reminder.notification_status === 'Sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkAsRead(reminder.reminder_id)}
                    >
                      <CheckCircle size={16} />
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(reminder.reminder_id)}
                  >
                    <X size={16} />
                    Dismiss
                  </Button>
                </>
              )}
              {reminder.dismissed && (
                <Badge variant="secondary">Dismissed</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Certificate size={24} />
              Renew Certification
            </DialogTitle>
            <DialogDescription>
              Update certification for {employeeName} - {reminder.skill_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-expiry">New Expiry Date</Label>
              <Input
                id="new-expiry"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-notes">Notes (Optional)</Label>
              <Textarea
                id="renewal-notes"
                placeholder="Add any notes about this renewal..."
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-muted p-3 rounded text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Expiry:</span>
                <span className="font-medium">
                  {format(new Date(reminder.expiry_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="font-medium text-destructive">
                  {getExpiryMessage()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenewSubmit} disabled={!newExpiryDate}>
              <Certificate size={18} />
              Confirm Renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
