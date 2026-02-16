import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { 
  WorkOrder, 
  SOP, 
  SparesLabor, 
  ExcelImportData,
  Employee,
  SkillMatrixEntry,
  EmployeeSchedule,
  Message,
  CertificationReminder,
  WorkOrderNotification,
  PartInventoryItem,
  PartTransaction,
  FormTemplate,
  FormSubmission,
  UserRole,
  UserProfile
} from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { WorkOrderGrid } from '@/components/WorkOrderGrid'
import { WorkOrderDetail } from '@/components/WorkOrderDetail'
import { SOPLibrary } from '@/components/SOPLibrary'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { ExcelImport } from '@/components/ExcelImport'
import { CalendarView } from '@/components/CalendarView'
import { TimelineView } from '@/components/TimelineView'
import { ResourceAllocationView } from '@/components/ResourceAllocationView'
import { CapacityPlanning } from '@/components/CapacityPlanning'
import { EmployeeManagement } from '@/components/EmployeeManagement'
import { CertificationReminders } from '@/components/CertificationReminders'
import { AssetsAreasManagement } from '@/components/AssetsAreasManagement'
import { EnhancedAutoSchedulerDialog } from '@/components/EnhancedAutoSchedulerDialog'
import { NewWorkOrderDialog } from '@/components/NewWorkOrderDialog'
import { NotificationCenter } from '@/components/NotificationCenter'
import { NotificationBell } from '@/components/NotificationBell'
import { NotificationToastManager } from '@/components/NotificationToastManager'
import { NotificationPreferencesDialog, type NotificationPreferences } from '@/components/NotificationPreferences'
import { PartsInventory } from '@/components/PartsInventory'
import { FormsInspections } from '@/components/FormsInspections'
import { GlobalSearch } from '@/components/GlobalSearch'
import { CustomizableDashboard } from '@/components/CustomizableDashboard'
import { UserProfileMenu } from '@/components/UserProfileMenu'
import { DatabaseManagement } from '@/components/DatabaseManagement'
import { PredictiveMaintenanceDashboard } from '@/components/PredictiveMaintenanceDashboard'
import { 
  Wrench, 
  ClipboardText, 
  ChartBar, 
  UploadSimple,
  Plus,
  DownloadSimple,
  CalendarBlank,
  ChartLineUp,
  Users,
  Gauge,
  Sparkle,
  UserGear,
  Certificate,
  Package,
  Toolbox,
  CheckSquare,
  MagnifyingGlass,
  House,
  Database,
  Brain
} from '@phosphor-icons/react'
import { 
  generateSampleWorkOrders, 
  generateSampleSOPs, 
  generateSampleSparesLabor,
  exportToExcel
} from '@/lib/excel-parser'
import { 
  generateSampleEmployees,
  generateSampleSkillMatrix,
  generateSampleSchedules
} from '@/lib/employee-utils'
import { generateSampleParts } from '@/lib/inventory-utils'
import { generatePremadeTemplates } from '@/lib/form-utils'
import { isOverdue } from '@/lib/maintenance-utils'
import { generateRemindersFromSkillMatrix, getReminderCounts } from '@/lib/certification-utils'
import {
  generateSkillMatchNotifications,
  generateAutoSchedulerNotifications,
  generateAssignmentChangeNotification,
  generateOverdueNotification,
  markNotificationAsRead,
  markNotificationAsAccepted,
  markNotificationAsRejected
} from '@/lib/notification-utils'
import { canViewTab, hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'

function App() {
  const [workOrders, setWorkOrders] = useKV<WorkOrder[]>('maintenance-work-orders', [])
  const [sops, setSOPs] = useKV<SOP[]>('sop-library', [])
  const [sparesLabor, setSparesLabor] = useKV<SparesLabor[]>('spares-labor', [])
  const [employees, setEmployees] = useKV<Employee[]>('employees', [])
  const [skillMatrix, setSkillMatrix] = useKV<SkillMatrixEntry[]>('skill-matrix', [])
  const [schedules, setSchedules] = useKV<EmployeeSchedule[]>('employee-schedules', [])
  const [messages, setMessages] = useKV<Message[]>('employee-messages', [])
  const [reminders, setReminders] = useKV<CertificationReminder[]>('certification-reminders', [])
  const [notifications, setNotifications] = useKV<WorkOrderNotification[]>('work-order-notifications', [])
  const [parts, setParts] = useKV<PartInventoryItem[]>('parts-inventory', [])
  const [partTransactions, setPartTransactions] = useKV<PartTransaction[]>('part-transactions', [])
  const [formTemplates, setFormTemplates] = useKV<FormTemplate[]>('form-templates', generatePremadeTemplates())
  const [formSubmissions, setFormSubmissions] = useKV<FormSubmission[]>('form-submissions', [])
  const [userProfile, setUserProfile] = useKV<UserProfile | null>('user-profile', null)
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
  
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [autoSchedulerOpen, setAutoSchedulerOpen] = useState(false)
  const [newWorkOrderOpen, setNewWorkOrderOpen] = useState(false)
  const [cloneWorkOrder, setCloneWorkOrder] = useState<WorkOrder | null>(null)
  const [activeTab, setActiveTab] = useKV<string>('active-tab', 'dashboard')
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Technician')

  useEffect(() => {
    if (userProfile?.role) {
      setCurrentUserRole(userProfile.role)
    }
  }, [userProfile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const handleCreateWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrders((current) => [...(current || []), workOrder])
    handleGenerateNotificationsForWorkOrder(workOrder)
  }

  const handleCloneWorkOrder = (workOrder: WorkOrder) => {
    setCloneWorkOrder(workOrder)
    setNewWorkOrderOpen(true)
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
    const sampleEmployees = generateSampleEmployees()
    const sampleSkills = generateSampleSkillMatrix()
    const sampleSchedules = generateSampleSchedules()
    const sampleParts = generateSampleParts()
    
    setWorkOrders(sampleWOs)
    setSOPs(sampleSOPs)
    setSparesLabor(sampleSpares)
    setEmployees(sampleEmployees)
    setSkillMatrix(sampleSkills)
    setSchedules(sampleSchedules)
    setParts(sampleParts)
    
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

  const handleAutoScheduleComplete = (scheduledOrders: WorkOrder[]) => {
    setWorkOrders((current) => {
      const currentOrders = current || []
      const updatedOrders = [...currentOrders]
      
      scheduledOrders.forEach(scheduledOrder => {
        const index = updatedOrders.findIndex(
          wo => wo.work_order_id === scheduledOrder.work_order_id
        )
        if (index !== -1) {
          updatedOrders[index] = scheduledOrder
        }
      })
      
      return updatedOrders
    })

    if (notificationPreferences?.enabled && notificationPreferences?.notifyOnAssignmentSuggestions) {
      const newNotifications = generateAutoSchedulerNotifications(scheduledOrders, safeEmployees)
      if (newNotifications.length > 0) {
        setNotifications((current) => [...(current || []), ...newNotifications])
      }
    }
  }

  const handleUpdateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((current) =>
      (current || []).map(emp => emp.employee_id === id ? { ...emp, ...updates } : emp)
    )
    toast.success('Employee updated')
  }

  const handleAddEmployee = (employee: Employee) => {
    setEmployees((current) => [...(current || []), employee])
    toast.success('Employee added')
  }

  const handleUpdateSkill = (employeeId: string, skill: SkillMatrixEntry) => {
    setSkillMatrix((current) => {
      const existing = (current || []).findIndex(
        s => s.employee_id === employeeId && s.skill_name === skill.skill_name
      )
      if (existing >= 0) {
        const updated = [...(current || [])]
        updated[existing] = skill
        return updated
      }
      return [...(current || []), skill]
    })
    toast.success('Skill updated')
  }

  const handleUpdateSchedule = (scheduleId: string, updates: Partial<EmployeeSchedule>) => {
    setSchedules((current) =>
      (current || []).map(sch => sch.schedule_id === scheduleId ? { ...sch, ...updates } : sch)
    )
    toast.success('Schedule updated')
  }

  const handleSendMessage = (message: Message) => {
    setMessages((current) => [...(current || []), message])
  }

  const handleUpdateNotification = (notificationId: string, updates: Partial<WorkOrderNotification>) => {
    setNotifications((current) =>
      (current || []).map(n => n.notification_id === notificationId ? { ...n, ...updates } : n)
    )
  }

  const handleAcceptAssignment = (notificationId: string, workOrderId: string) => {
    const notification = (notifications || []).find(n => n.notification_id === notificationId)
    if (!notification) return

    const workOrder = safeWorkOrders.find(wo => wo.work_order_id === workOrderId)
    if (!workOrder) return

    const employee = safeEmployees.find(e => e.employee_id === notification.employee_id)
    if (!employee) return

    const technicianName = `${employee.first_name} ${employee.last_name}`
    
    handleUpdateWorkOrder(workOrderId, {
      assigned_technician: technicianName
    })

    const updated = markNotificationAsAccepted(notification)
    handleUpdateNotification(notificationId, updated)

    toast.success(`Assignment accepted for work order ${workOrderId}`)
  }

  const handleRejectAssignment = (notificationId: string, workOrderId: string) => {
    const notification = (notifications || []).find(n => n.notification_id === notificationId)
    if (!notification) return

    const updated = markNotificationAsRejected(notification)
    handleUpdateNotification(notificationId, updated)

    toast.info('Assignment suggestion declined')
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    const notification = (notifications || []).find(n => n.notification_id === notificationId)
    if (!notification) return

    const updated = markNotificationAsRead(notification)
    handleUpdateNotification(notificationId, updated)
  }

  const handleGenerateNotificationsForWorkOrder = (workOrder: WorkOrder) => {
    if (!notificationPreferences?.enabled || !notificationPreferences?.notifyOnAssignmentSuggestions) {
      return
    }

    const newNotifications = generateSkillMatchNotifications(
      workOrder,
      safeEmployees,
      safeSkillMatrix,
      safeWorkOrders
    ).filter(n => n.match_score && n.match_score >= (notificationPreferences?.minimumMatchScore || 60))

    if (newNotifications.length > 0) {
      setNotifications((current) => [...(current || []), ...newNotifications])
      toast.success(`${newNotifications.length} technician${newNotifications.length > 1 ? 's' : ''} notified of new assignment`)
    }
  }

  const safeWorkOrders = workOrders || []
  const safeSOPs = sops || []
  const safeSparesLabor = sparesLabor || []
  const safeEmployees = employees || []
  const safeSkillMatrix = skillMatrix || []
  const safeSchedules = schedules || []
  const safeMessages = messages || []
  const overdueCount = safeWorkOrders.filter(wo => wo.is_overdue).length

  const certificationCounts = useMemo(() => {
    const currentReminders = generateRemindersFromSkillMatrix(
      safeSkillMatrix,
      safeEmployees,
      reminders || []
    )
    return getReminderCounts(currentReminders)
  }, [safeSkillMatrix, safeEmployees, reminders])

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Toaster position="top-right" />
      
      <header className="bg-card/95 backdrop-blur-md border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                <Wrench size={20} weight="bold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary tracking-tight leading-tight">
                  MaintenancePro
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">
                  Enterprise CMMS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="gap-2 min-w-[220px] justify-start text-muted-foreground h-9 text-sm"
              >
                <MagnifyingGlass size={16} />
                Search...
                <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-muted rounded font-mono">⌘K</kbd>
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImportOpen(true)}
                className="h-9 w-9"
                title="Import data"
              >
                <UploadSimple size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportData}
                className="h-9 w-9"
                title="Export data"
              >
                <DownloadSimple size={18} />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <NotificationPreferencesDialog
                preferences={notificationPreferences || {
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
                }}
                onSave={setNotificationPreferences}
              />
              <NotificationCenter
                notifications={notifications || []}
                onUpdateNotification={handleUpdateNotification}
                onAcceptAssignment={handleAcceptAssignment}
                onRejectAssignment={handleRejectAssignment}
                onViewWorkOrder={(woId) => {
                  const wo = safeWorkOrders.find(w => w.work_order_id === woId)
                  if (wo) handleSelectWorkOrder(wo)
                }}
              />
              {certificationCounts.critical > 0 && (
                <Button 
                  onClick={() => setActiveTab('certifications')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground h-9"
                >
                  <Certificate size={16} weight="fill" />
                  {certificationCounts.critical} Expiring
                </Button>
              )}
              {overdueCount > 0 && hasPermission(currentUserRole, 'schedules', 'execute') && (
                <>
                  <div className="bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-semibold border border-destructive/20">
                    {overdueCount} Overdue
                  </div>
                  <Button 
                    onClick={() => setAutoSchedulerOpen(true)}
                    size="sm"
                    className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 h-9"
                  >
                    <Sparkle size={16} weight="fill" />
                    Auto-Schedule
                  </Button>
                </>
              )}
              {hasPermission(currentUserRole, 'work-orders', 'create') && (
                <Button 
                  onClick={() => setNewWorkOrderOpen(true)}
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
                >
                  <Plus size={16} weight="bold" />
                  New Work Order
                </Button>
              )}
              <UserProfileMenu 
                onRoleChange={setCurrentUserRole}
                onOpenImport={() => setImportOpen(true)}
                onExportData={handleExportData}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={activeTab || 'dashboard'} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex w-full max-w-full overflow-x-auto gap-0.5 p-1 bg-muted/60 backdrop-blur-sm rounded-lg border border-border/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-sm rounded-md">
              <House size={16} />
              Dashboard
            </TabsTrigger>
            {canViewTab(currentUserRole, 'tracking') && (
              <TabsTrigger value="tracking" className="flex items-center gap-1.5 text-sm rounded-md">
                <Wrench size={16} />
                Tracking
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'timeline') && (
              <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-sm rounded-md">
                <ChartLineUp size={16} />
                Timeline
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'resources') && (
              <TabsTrigger value="resources" className="flex items-center gap-1.5 text-sm rounded-md">
                <Users size={16} />
                Resources
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'capacity') && (
              <TabsTrigger value="capacity" className="flex items-center gap-1.5 text-sm rounded-md">
                <Gauge size={16} />
                Capacity
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'calendar') && (
              <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-sm rounded-md">
                <CalendarBlank size={16} />
                Calendar
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'employees') && (
              <TabsTrigger value="employees" className="flex items-center gap-1.5 text-sm rounded-md">
                <UserGear size={16} />
                Employees
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'assets') && (
              <TabsTrigger value="assets" className="flex items-center gap-1.5 text-sm rounded-md">
                <Package size={16} />
                Assets
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'parts') && (
              <TabsTrigger value="parts" className="flex items-center gap-1.5 text-sm rounded-md">
                <Toolbox size={16} />
                Parts
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'forms') && (
              <TabsTrigger value="forms" className="flex items-center gap-1.5 text-sm rounded-md">
                <CheckSquare size={16} />
                Forms
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'certifications') && (
              <TabsTrigger value="certifications" className="flex items-center gap-1.5 text-sm rounded-md">
                <Certificate size={16} />
                Certs
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'sops') && (
              <TabsTrigger value="sops" className="flex items-center gap-1.5 text-sm rounded-md">
                <ClipboardText size={16} />
                SOPs
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'analytics') && (
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-sm rounded-md">
                <ChartBar size={16} />
                Analytics
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'predictive') && (
              <TabsTrigger value="predictive" className="flex items-center gap-1.5 text-sm rounded-md">
                <Brain size={16} />
                Predictive
              </TabsTrigger>
            )}
            {canViewTab(currentUserRole, 'database') && (
              <TabsTrigger value="database" className="flex items-center gap-1.5 text-sm rounded-md">
                <Database size={16} />
                Database
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <CustomizableDashboard
              workOrders={safeWorkOrders}
              employees={safeEmployees}
              parts={parts || []}
              certifications={reminders || []}
              onSelectWorkOrder={handleSelectWorkOrder}
              userEmployeeId={userProfile?.employee_id || undefined}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Work Order Management</h2>
                <p className="text-muted-foreground">
                  Track and manage maintenance tasks across all equipment
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setNewWorkOrderOpen(true)}
                  className="gap-2"
                >
                  <Plus size={18} weight="bold" />
                  New Work Order
                </Button>
                {overdueCount > 0 && (
                  <Button 
                    onClick={() => setAutoSchedulerOpen(true)}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Sparkle size={18} weight="fill" />
                    Auto-Schedule {overdueCount} Overdue
                  </Button>
                )}
              </div>
            </div>

            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <Wrench size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Work Orders Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create a new work order, import Excel/CSV data, or load sample work orders to get started
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setNewWorkOrderOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Create Work Order
                  </Button>
                  <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                    <UploadSimple size={16} />
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

          <TabsContent value="timeline" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Timeline / Gantt View</h2>
                <p className="text-muted-foreground">
                  Visualize work orders on a continuous timeline - drag to reschedule
                </p>
              </div>
            </div>

            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <ChartLineUp size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Work Orders to Display</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Import Excel/CSV data or load sample work orders to view the timeline
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="gap-2" onClick={() => setImportOpen(true)}>
                    <UploadSimple size={16} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <TimelineView
                workOrders={safeWorkOrders}
                onUpdateWorkOrder={handleUpdateWorkOrder}
                onSelectWorkOrder={handleSelectWorkOrder}
              />
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Resource Allocation</h2>
                <p className="text-muted-foreground">
                  Track technician workload and balance resource assignments
                </p>
              </div>
            </div>

            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <Users size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Work Orders to Display</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Import Excel/CSV data or load sample work orders to view resource allocation
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="gap-2" onClick={() => setImportOpen(true)}>
                    <UploadSimple size={16} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <ResourceAllocationView
                workOrders={safeWorkOrders}
                onUpdateWorkOrder={handleUpdateWorkOrder}
                onSelectWorkOrder={handleSelectWorkOrder}
              />
            )}
          </TabsContent>

          <TabsContent value="capacity" className="space-y-6 animate-fade-in">
            <CapacityPlanning workOrders={safeWorkOrders} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6 animate-fade-in">
            {safeWorkOrders.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <CalendarBlank size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Work Orders to Schedule</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Import Excel/CSV data or load sample work orders to view the calendar
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="gap-2" onClick={() => setImportOpen(true)}>
                    <UploadSimple size={16} />
                    Import Excel/CSV
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </div>
            ) : (
              <CalendarView
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
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <ClipboardText size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No SOPs Available</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Import your SOP library via Excel/CSV to enable automated PM scheduling
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="gap-2" onClick={() => setImportOpen(true)}>
                    <UploadSimple size={16} />
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

          <TabsContent value="employees" className="space-y-6 animate-fade-in">
            {safeEmployees.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <UserGear size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Employees in System</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Load sample employee data to get started with team management
                </p>
                <Button onClick={handleLoadSampleData}>
                  Load Sample Data
                </Button>
              </div>
            ) : (
              <EmployeeManagement
                employees={safeEmployees}
                skillMatrix={safeSkillMatrix}
                schedules={safeSchedules}
                messages={safeMessages}
                workOrders={safeWorkOrders}
                onUpdateEmployee={handleUpdateEmployee}
                onAddEmployee={handleAddEmployee}
                onUpdateSkill={handleUpdateSkill}
                onUpdateSchedule={handleUpdateSchedule}
                onSendMessage={handleSendMessage}
              />
            )}
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 animate-fade-in">
            <AssetsAreasManagement employees={safeEmployees} />
          </TabsContent>

          <TabsContent value="parts" className="space-y-6 animate-fade-in">
            <PartsInventory
              parts={parts || []}
              transactions={partTransactions || []}
              onAddPart={(part) => setParts((current) => [...(current || []), part])}
              onUpdatePart={(partId, updates) => {
                setParts((current) =>
                  (current || []).map(p => p.part_id === partId ? { ...p, ...updates } : p)
                )
              }}
              onAddTransaction={(transaction) => {
                setPartTransactions((current) => [...(current || []), transaction])
                const part = (parts || []).find(p => p.part_id === transaction.part_id)
                if (part) {
                  let newQuantity = part.quantity_on_hand
                  switch (transaction.transaction_type) {
                    case 'Purchase':
                    case 'Return':
                      newQuantity += transaction.quantity
                      break
                    case 'Use':
                    case 'Transfer':
                      newQuantity -= transaction.quantity
                      break
                    case 'Adjustment':
                      newQuantity = transaction.quantity
                      break
                  }
                  const status = newQuantity === 0 ? 'Out of Stock' : 
                                newQuantity <= part.minimum_stock_level ? 'Low Stock' : 'In Stock'
                  setParts((current) =>
                    (current || []).map(p => 
                      p.part_id === transaction.part_id 
                        ? { ...p, quantity_on_hand: Math.max(0, newQuantity), status, updated_at: transaction.created_at }
                        : p
                    )
                  )
                }
              }}
            />
          </TabsContent>

          <TabsContent value="forms" className="space-y-6 animate-fade-in">
            <FormsInspections
              templates={formTemplates || []}
              submissions={formSubmissions || []}
              onCreateTemplate={(template) => {
                setFormTemplates((current) => [...(current || []), template])
              }}
              onUpdateTemplate={(templateId, updates) => {
                setFormTemplates((current) =>
                  (current || []).map(t => t.template_id === templateId ? { ...t, ...updates } : t)
                )
              }}
              onDeleteTemplate={(templateId) => {
                setFormTemplates((current) =>
                  (current || []).filter(t => t.template_id !== templateId)
                )
              }}
              onCreateSubmission={(submission) => {
                setFormSubmissions((current) => [...(current || []), submission])
              }}
              onUpdateSubmission={(submissionId, updates) => {
                setFormSubmissions((current) =>
                  (current || []).map(s => s.submission_id === submissionId ? { ...s, ...updates } : s)
                )
              }}
            />
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6 animate-fade-in">
            {safeEmployees.length === 0 ? (
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <Certificate size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Certification Data</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Load sample employee data to get started with certification tracking
                </p>
                <Button onClick={handleLoadSampleData}>
                  Load Sample Data
                </Button>
              </div>
            ) : (
              <CertificationReminders
                employees={safeEmployees}
                skillMatrix={safeSkillMatrix}
                onUpdateSkill={handleUpdateSkill}
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
              <div className="bg-card border rounded-xl p-16 text-center animate-scale-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                  <ChartBar size={32} className="text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Data to Analyze</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Import work orders via Excel/CSV or create sample data to view analytics
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="gap-2" onClick={() => setImportOpen(true)}>
                    <UploadSimple size={16} />
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

          <TabsContent value="predictive" className="space-y-6 animate-fade-in">
            <PredictiveMaintenanceDashboard
              workOrders={safeWorkOrders}
              employees={safeEmployees}
              parts={parts || []}
              partTransactions={partTransactions || []}
              onCreateWorkOrder={(equipment, date, priority) => {
                setCloneWorkOrder({
                  work_order_id: `WO-${Date.now()}`,
                  equipment_area: equipment,
                  priority_level: priority as any,
                  status: 'Scheduled (Not Started)',
                  type: 'Maintenance',
                  task: `Predictive maintenance for ${equipment}`,
                  comments_description: 'Auto-generated from ML prediction',
                  scheduled_date: date,
                  estimated_downtime_hours: 2,
                  assigned_technician: null,
                  entered_by: null,
                  terminal: 'Hanceville Terminal',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  completed_at: null,
                  is_overdue: false,
                  auto_generated: true
                })
                setNewWorkOrderOpen(true)
              }}
            />
          </TabsContent>

          <TabsContent value="database" className="space-y-6 animate-fade-in">
            <DatabaseManagement />
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
        onClone={handleCloneWorkOrder}
        sparesLabor={safeSparesLabor}
        allWorkOrders={safeWorkOrders}
        employees={safeEmployees}
        skillMatrix={safeSkillMatrix}
        reminders={reminders || []}
      />

      <ExcelImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <EnhancedAutoSchedulerDialog
        open={autoSchedulerOpen}
        onClose={() => setAutoSchedulerOpen(false)}
        workOrders={safeWorkOrders}
        onScheduleComplete={handleAutoScheduleComplete}
      />

      <NewWorkOrderDialog
        open={newWorkOrderOpen}
        onClose={() => {
          setNewWorkOrderOpen(false)
          setCloneWorkOrder(null)
        }}
        onCreateWorkOrder={handleCreateWorkOrder}
        workOrders={safeWorkOrders}
        employees={safeEmployees}
        skillMatrix={safeSkillMatrix}
        sops={safeSOPs}
        sparesLabor={safeSparesLabor}
        cloneFrom={cloneWorkOrder}
      />

      {notificationPreferences?.showToasts && (
        <NotificationToastManager
          notifications={notifications || []}
          onAcceptAssignment={handleAcceptAssignment}
          onViewWorkOrder={(woId) => {
            const wo = safeWorkOrders.find(w => w.work_order_id === woId)
            if (wo) handleSelectWorkOrder(wo)
          }}
        />
      )}

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        workOrders={safeWorkOrders}
        employees={safeEmployees}
        assets={[]}
        parts={parts || []}
        sops={safeSOPs}
        formTemplates={formTemplates || []}
        formSubmissions={formSubmissions || []}
        onSelectWorkOrder={handleSelectWorkOrder}
      />
    </div>
  )
}

export default App
