import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { 
  CertificationReminder, 
  NotificationSettings, 
  Employee, 
  SkillMatrixEntry,
  NotificationPriority 
} from '@/lib/types'
import {
  generateRemindersFromSkillMatrix,
  getCertificationStats,
  getDefaultNotificationSettings,
  shouldNotify,
  getReminderCounts
} from '@/lib/certification-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  BellRinging, 
  Certificate, 
  Warning, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  MagnifyingGlass,
  Gear,
  ChartBar,
  List,
  X
} from '@phosphor-icons/react'
import { CertificationReminderCard } from './CertificationReminderCard'
import { CertificationStatsOverview } from './CertificationStatsOverview'
import { NotificationSettingsDialog } from './NotificationSettingsDialog'
import { toast } from 'sonner'

interface CertificationRemindersProps {
  employees: Employee[]
  skillMatrix: SkillMatrixEntry[]
  onUpdateSkill: (employeeId: string, skill: SkillMatrixEntry) => void
}

export function CertificationReminders({
  employees,
  skillMatrix,
  onUpdateSkill
}: CertificationRemindersProps) {
  const [reminders, setReminders] = useKV<CertificationReminder[]>('certification-reminders', [])
  const [settings, setSettings] = useKV<NotificationSettings>(
    'notification-settings',
    getDefaultNotificationSettings()
  )
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'All'>('All')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'dismissed' | 'all'>('active')

  useEffect(() => {
    if (!settings?.enabled) return

    const interval = setInterval(() => {
      const newReminders = generateRemindersFromSkillMatrix(
        skillMatrix,
        employees,
        reminders || []
      )
      setReminders(newReminders)
    }, 60000)

    const initialReminders = generateRemindersFromSkillMatrix(
      skillMatrix,
      employees,
      reminders || []
    )
    setReminders(initialReminders)

    return () => clearInterval(interval)
  }, [skillMatrix, employees, settings?.enabled])

  useEffect(() => {
    if (!settings?.enabled) return

    const safeReminders = reminders || []
    const notifyAtDays = settings?.notify_at_days || [90, 60, 30, 14, 7, 3, 1, 0]

    safeReminders.forEach(reminder => {
      if (reminder.dismissed) return
      if (reminder.notification_status === 'Read') return

      const shouldSendNotification = shouldNotify(
        reminder.days_until_expiry,
        notifyAtDays,
        reminder.last_notified_at
      )

      if (shouldSendNotification) {
        sendNotification(reminder)
      }
    })
  }, [reminders, settings])

  const sendNotification = (reminder: CertificationReminder) => {
    const employee = employees.find(e => e.employee_id === reminder.employee_id)
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee'

    let message = ''
    if (reminder.days_until_expiry < 0) {
      message = `${employeeName}'s ${reminder.skill_name} certification expired ${Math.abs(reminder.days_until_expiry)} days ago!`
      toast.error(message, {
        duration: 10000,
        icon: <Warning size={20} weight="fill" className="text-destructive" />
      })
    } else if (reminder.days_until_expiry === 0) {
      message = `${employeeName}'s ${reminder.skill_name} certification expires TODAY!`
      toast.error(message, {
        duration: 10000,
        icon: <BellRinging size={20} weight="fill" className="text-destructive" />
      })
    } else if (reminder.days_until_expiry <= 7) {
      message = `${employeeName}'s ${reminder.skill_name} certification expires in ${reminder.days_until_expiry} days`
      toast.warning(message, {
        duration: 8000,
        icon: <Warning size={20} weight="fill" className="text-accent" />
      })
    } else {
      message = `${employeeName}'s ${reminder.skill_name} certification expires in ${reminder.days_until_expiry} days`
      toast.info(message, {
        duration: 5000,
        icon: <Bell size={20} />
      })
    }

    setReminders((current) =>
      (current || []).map(r =>
        r.reminder_id === reminder.reminder_id
          ? {
              ...r,
              notification_status: 'Sent',
              last_notified_at: new Date().toISOString(),
              notification_count: r.notification_count + 1,
              updated_at: new Date().toISOString()
            }
          : r
      )
    )
  }

  const handleDismissReminder = (reminderId: string) => {
    setReminders((current) =>
      (current || []).map(r =>
        r.reminder_id === reminderId
          ? {
              ...r,
              dismissed: true,
              notification_status: 'Dismissed',
              updated_at: new Date().toISOString()
            }
          : r
      )
    )
    toast.success('Reminder dismissed')
  }

  const handleMarkAsRead = (reminderId: string) => {
    setReminders((current) =>
      (current || []).map(r =>
        r.reminder_id === reminderId
          ? {
              ...r,
              notification_status: 'Read',
              updated_at: new Date().toISOString()
            }
          : r
      )
    )
  }

  const handleRenewCertification = (reminder: CertificationReminder, newExpiryDate: string) => {
    const skill = skillMatrix.find(
      s => s.employee_id === reminder.employee_id && s.skill_name === reminder.skill_name
    )

    if (skill) {
      onUpdateSkill(reminder.employee_id, {
        ...skill,
        certification_date: new Date().toISOString().split('T')[0],
        expiry_date: newExpiryDate
      })

      setReminders((current) =>
        (current || []).filter(r => r.reminder_id !== reminder.reminder_id)
      )

      const employee = employees.find(e => e.employee_id === reminder.employee_id)
      toast.success(
        `Certification renewed for ${employee?.first_name} ${employee?.last_name}`
      )
    }
  }

  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings)
    toast.success('Notification settings updated')
  }

  const stats = useMemo(
    () => getCertificationStats(skillMatrix, employees),
    [skillMatrix, employees]
  )

  const safeReminders = reminders || []
  const counts = useMemo(() => getReminderCounts(safeReminders), [safeReminders])

  const filteredReminders = useMemo(() => {
    let filtered = safeReminders

    if (activeTab === 'active') {
      filtered = filtered.filter(r => !r.dismissed)
    } else if (activeTab === 'dismissed') {
      filtered = filtered.filter(r => r.dismissed)
    }

    if (selectedPriority !== 'All') {
      filtered = filtered.filter(r => r.priority === selectedPriority)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => {
        const employee = employees.find(e => e.employee_id === r.employee_id)
        const employeeName = employee
          ? `${employee.first_name} ${employee.last_name}`.toLowerCase()
          : ''
        return (
          employeeName.includes(query) ||
          r.skill_name.toLowerCase().includes(query) ||
          r.skill_category.toLowerCase().includes(query)
        )
      })
    }

    return filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.days_until_expiry - b.days_until_expiry
    })
  }, [safeReminders, activeTab, selectedPriority, searchQuery, employees])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Certification Renewals</h2>
          <p className="text-muted-foreground">
            Track and manage employee certification expiration dates
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Gear size={18} />
            Settings
          </Button>
          {counts.critical > 0 && (
            <Badge variant="destructive" className="px-4 py-2 text-base">
              <BellRinging size={18} weight="fill" className="mr-2" />
              {counts.critical} Critical
            </Badge>
          )}
        </div>
      </div>

      <CertificationStatsOverview stats={stats} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell size={24} />
                Active Reminders
              </CardTitle>
              <CardDescription>
                {counts.total} total reminders ({counts.pending} pending, {counts.dismissed} dismissed)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by employee or certification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPriority === 'All' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('All')}
              >
                All ({counts.total})
              </Button>
              <Button
                variant={selectedPriority === 'Critical' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('Critical')}
              >
                Critical ({counts.critical})
              </Button>
              <Button
                variant={selectedPriority === 'High' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('High')}
                className={selectedPriority === 'High' ? 'bg-accent text-accent-foreground' : ''}
              >
                High ({counts.high})
              </Button>
              <Button
                variant={selectedPriority === 'Medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('Medium')}
              >
                Medium ({counts.medium})
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active">
                Active ({safeReminders.filter(r => !r.dismissed).length})
              </TabsTrigger>
              <TabsTrigger value="dismissed">
                Dismissed ({counts.dismissed})
              </TabsTrigger>
              <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 mt-4">
              {filteredReminders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No reminders to display</p>
                  <p className="text-sm">
                    {activeTab === 'active'
                      ? 'All certifications are up to date!'
                      : 'No dismissed reminders'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <CertificationReminderCard
                      key={reminder.reminder_id}
                      reminder={reminder}
                      employee={employees.find(e => e.employee_id === reminder.employee_id)}
                      onDismiss={handleDismissReminder}
                      onMarkAsRead={handleMarkAsRead}
                      onRenew={handleRenewCertification}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <NotificationSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings || getDefaultNotificationSettings()}
        onSave={handleUpdateSettings}
      />
    </div>
  )
}
