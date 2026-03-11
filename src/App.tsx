import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react'
import { useKV } from '@github/spark/hooks'
import { useTheme } from 'next-themes'
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
  UserProfile,
  PriorityLevel,
  SalesOrder,
  ProductionBatch,
  MaintenanceCostEntry,
  BudgetEntry,
} from '@/lib/types'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { UserProfileMenu } from '@/components/UserProfileMenu'
import { SystemStatus, LiveActivityIndicator } from '@/components/SystemStatus'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import type { NotificationPreferences } from '@/components/NotificationPreferences'
import type { TourStep } from '@/components/InteractiveTour'

// Code-split heavy components – only load when the relevant tab/dialog is first opened
const WorkOrderGrid = lazy(() => import('@/components/WorkOrderGrid').then(m => ({ default: m.WorkOrderGrid })))
const WorkOrderDetail = lazy(() => import('@/components/WorkOrderDetail').then(m => ({ default: m.WorkOrderDetail })))
const SOPLibrary = lazy(() => import('@/components/SOPLibrary').then(m => ({ default: m.SOPLibrary })))
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })))
const ExcelImport = lazy(() => import('@/components/ExcelImport').then(m => ({ default: m.ExcelImport })))
const CalendarView = lazy(() => import('@/components/CalendarView').then(m => ({ default: m.CalendarView })))
const TimelineView = lazy(() => import('@/components/TimelineView').then(m => ({ default: m.TimelineView })))
const ResourceAllocationView = lazy(() => import('@/components/ResourceAllocationView').then(m => ({ default: m.ResourceAllocationView })))
const CapacityPlanning = lazy(() => import('@/components/CapacityPlanning').then(m => ({ default: m.CapacityPlanning })))
const EmployeeManagement = lazy(() => import('@/components/EmployeeManagement').then(m => ({ default: m.EmployeeManagement })))
const CertificationReminders = lazy(() => import('@/components/CertificationReminders').then(m => ({ default: m.CertificationReminders })))
const AssetsAreasManagement = lazy(() => import('@/components/AssetsAreasManagement').then(m => ({ default: m.AssetsAreasManagement })))
const EnhancedAutoSchedulerDialog = lazy(() => import('@/components/EnhancedAutoSchedulerDialog').then(m => ({ default: m.EnhancedAutoSchedulerDialog })))
const NewWorkOrderDialog = lazy(() => import('@/components/NewWorkOrderDialog').then(m => ({ default: m.NewWorkOrderDialog })))
const NotificationCenter = lazy(() => import('@/components/NotificationCenter').then(m => ({ default: m.NotificationCenter })))
const NotificationToastManager = lazy(() => import('@/components/NotificationToastManager').then(m => ({ default: m.NotificationToastManager })))
const NotificationPreferencesDialog = lazy(() => import('@/components/NotificationPreferences').then(m => ({ default: m.NotificationPreferencesDialog })))
const PartsInventory = lazy(() => import('@/components/PartsInventory').then(m => ({ default: m.PartsInventory })))
const FormsInspections = lazy(() => import('@/components/FormsInspections').then(m => ({ default: m.FormsInspections })))
const GlobalSearch = lazy(() => import('@/components/GlobalSearch').then(m => ({ default: m.GlobalSearch })))
const CustomizableDashboard = lazy(() => import('@/components/CustomizableDashboard').then(m => ({ default: m.CustomizableDashboard })))
const DatabaseManagement = lazy(() => import('@/components/DatabaseManagement').then(m => ({ default: m.DatabaseManagement })))
const PredictiveMaintenanceDashboard = lazy(() => import('@/components/PredictiveMaintenanceDashboard').then(m => ({ default: m.PredictiveMaintenanceDashboard })))
const KeyboardShortcutsDialog = lazy(() => import('@/components/KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog })))
const PMScheduleManagement = lazy(() => import('@/components/PMScheduleManagement').then(m => ({ default: m.PMScheduleManagement })))
const WorkOrderTemplates = lazy(() => import('@/components/WorkOrderTemplates').then(m => ({ default: m.WorkOrderTemplates })))
const WelcomeDialog = lazy(() => import('@/components/WelcomeDialog').then(m => ({ default: m.WelcomeDialog })))
const InteractiveTour = lazy(() => import('@/components/InteractiveTour').then(m => ({ default: m.InteractiveTour })))
const PMEquipmentManagement = lazy(() => import('@/components/PMEquipmentManagement').then(m => ({ default: m.PMEquipmentManagement })))
const AsphaltBlendCalculator = lazy(() => import('@/components/AsphaltBlendCalculator').then(m => ({ default: m.AsphaltBlendCalculator })))
const TankInventoryManagement = lazy(() => import('@/components/TankInventoryManagement').then(m => ({ default: m.TankInventoryManagement })))
const RailOperations = lazy(() => import('@/components/RailOperations').then(m => ({ default: m.RailOperations })))
const TankerLoading = lazy(() => import('@/components/TankerLoading').then(m => ({ default: m.TankerLoading })))
const AsphaltFlowDiagram = lazy(() => import('@/components/AsphaltFlowDiagram').then(m => ({ default: m.AsphaltFlowDiagram })))
const LabDashboard = lazy(() => import('@/components/LabQualityCenter').then(m => ({ default: m.LabDashboard })))
const LabSampleQueue = lazy(() => import('@/components/LabQualityCenter').then(m => ({ default: m.LabSampleQueue })))
const LabSpecifications = lazy(() => import('@/components/LabQualityCenter').then(m => ({ default: m.LabSpecifications })))
// Business modules
const FinancialDashboard = lazy(() => import('@/components/FinancialDashboard').then(m => ({ default: m.FinancialDashboard })))
const ProductionTracking = lazy(() => import('@/components/ProductionTracking').then(m => ({ default: m.ProductionTracking })))
const SalesOrders = lazy(() => import('@/components/SalesOrders').then(m => ({ default: m.SalesOrders })))
const CrossFunctionalHub = lazy(() => import('@/components/CrossFunctionalHub').then(m => ({ default: m.CrossFunctionalHub })))
const ProcurementDashboard = lazy(() => import('@/components/ProcurementDashboard').then(m => ({ default: m.ProcurementDashboard })))
const PurchaseOrders = lazy(() => import('@/components/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })))
const VendorManagement = lazy(() => import('@/components/VendorManagement').then(m => ({ default: m.VendorManagement })))
const FleetManagement = lazy(() => import('@/components/FleetManagement').then(m => ({ default: m.FleetManagement })))
const DeliveryTracking = lazy(() => import('@/components/DeliveryTracking').then(m => ({ default: m.DeliveryTracking })))
const HRDashboard = lazy(() => import('@/components/HRDashboard').then(m => ({ default: m.HRDashboard })))
const LeaveManagement = lazy(() => import('@/components/LeaveManagement').then(m => ({ default: m.LeaveManagement })))
const ComplianceDashboard = lazy(() => import('@/components/ComplianceDashboard').then(m => ({ default: m.ComplianceDashboard })))
const TrainingManagement = lazy(() => import('@/components/TrainingManagement').then(m => ({ default: m.TrainingManagement })))
const AITrainingModule = lazy(() => import('@/components/AITrainingModule').then(m => ({ default: m.AITrainingModule })))
const ProductSpecifications = lazy(() => import('@/components/ProductSpecifications').then(m => ({ default: m.ProductSpecifications })))
const BillOfMaterials = lazy(() => import('@/components/BillOfMaterials').then(m => ({ default: m.BillOfMaterials })))
const EngineeringChanges = lazy(() => import('@/components/EngineeringChanges').then(m => ({ default: m.EngineeringChanges })))
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
  Brain,
  Clock,
  FileText,
  Gear,
  Flask,
  Drop,
  Train,
  Truck,
  GitBranch,
  Sun,
  Moon,
  List,
  X,
  ArrowUp,
  SidebarSimple,
  CurrencyDollar,
  Factory,
  ShoppingCart,
  Buildings,
  Receipt,
  UsersThree,
  ShieldCheck,
  GraduationCap,
  TreeStructure,
  Van,
  CalendarCheck,
  Cube,
  NavigationArrow,
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
  markNotificationAsAccepted,
  markNotificationAsRejected
} from '@/lib/notification-utils'
import { hasPermission } from '@/lib/permissions'
import {
  generateSampleSalesOrders,
  generateSampleProductionBatches,
  generateSampleMaintenanceCosts,
  generateSampleMaintenanceBudgets,
} from '@/lib/sample-data'
import { toast } from 'sonner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardNavigation'

type ModuleKey = 'salesFinance' | 'production' | 'maintenance' | 'supplyChain' | 'distribution' | 'hrCompliance'

const MODULE_DETAILS = {
  salesFinance: {
    label: 'Sales & Finance',
    shortLabel: 'Sales/Finance',
    description: 'Revenue, customer orders, and financial visibility for business teams.',
    audience: 'Ideal for sales coordinators, customer service, and finance leaders.',
    defaultTab: 'financial',
    accent: 'from-emerald-500 via-green-500 to-teal-500',
    icon: CurrencyDollar,
    highlights: ['Financial dashboard', 'Sales order visibility', 'Business analytics']
  },
  production: {
    label: 'Production & Operators',
    shortLabel: 'Production',
    description: 'Plant-floor execution, inventory flow, and operator-facing asphalt operations.',
    audience: 'Ideal for dispatchers, operators, and production supervisors.',
    defaultTab: 'production',
    accent: 'from-amber-500 via-orange-500 to-red-500',
    icon: Factory,
    highlights: ['Production tracking', 'Blend calculator', 'Rail and tanker operations']
  },
  maintenance: {
    label: 'Maintenance',
    shortLabel: 'Maintenance',
    description: 'Work orders, planning, assets, and technician support in one maintenance workspace.',
    audience: 'Ideal for maintenance planners, supervisors, and technicians.',
    defaultTab: 'dashboard',
    accent: 'from-primary via-primary to-sky-500',
    icon: Wrench,
    highlights: ['Maintenance dashboard', 'Scheduling and PM', 'Assets, parts, and compliance']
  },
  supplyChain: {
    label: 'Supply Chain & Procurement',
    shortLabel: 'Supply Chain',
    description: 'Purchase orders, vendor management, inventory forecasting, and supplier performance.',
    audience: 'Ideal for procurement managers, purchasing agents, and supply chain coordinators.',
    defaultTab: 'procurement-dashboard',
    accent: 'from-violet-500 via-purple-500 to-indigo-500',
    icon: Buildings,
    highlights: ['Purchase orders', 'Vendor management', 'Inventory forecasting']
  },
  distribution: {
    label: 'Distribution & Logistics',
    shortLabel: 'Distribution',
    description: 'Fleet management, delivery tracking, route planning, and customer portal.',
    audience: 'Ideal for dispatch coordinators, drivers, and logistics managers.',
    defaultTab: 'fleet',
    accent: 'from-sky-500 via-blue-500 to-cyan-500',
    icon: Van,
    highlights: ['Fleet management', 'Delivery tracking', 'Route planning']
  },
  hrCompliance: {
    label: 'HR & Compliance',
    shortLabel: 'HR & Compliance',
    description: 'Human resources, leave management, compliance tracking, and employee training.',
    audience: 'Ideal for HR managers, compliance officers, and department heads.',
    defaultTab: 'hr-dashboard',
    accent: 'from-rose-500 via-pink-500 to-fuchsia-500',
    icon: UsersThree,
    highlights: ['HR dashboard', 'Leave management', 'Compliance & training']
  },
} as const

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
  const [hasSeededData, setHasSeededData] = useKV<boolean>('has-seeded-data', false)
  // Cross-functional data stores.  Only the setters are used here so that
  // handleLoadSampleData can seed all modules in one pass.  Empty-array
  // defaults are intentional: calling sample generators on every App render
  // would be wasteful; the individual module components own the read path and
  // supply their own defaults via useKV (e.g. SalesOrders, ProductionTracking).
  const [, setSalesOrders] = useKV<SalesOrder[]>('sales-orders', [])
  const [, setProductionBatches] = useKV<ProductionBatch[]>('production-batches', [])
  const [, setMaintenanceCosts] = useKV<MaintenanceCostEntry[]>('maintenance-costs', [])
  const [, setMaintenanceBudgets] = useKV<BudgetEntry[]>('maintenance-budgets', [])
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
  const [selectedModule, setSelectedModule] = useState<ModuleKey | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Technician')
  const [tourOpen, setTourOpen] = useState(false)

  // Enhancement 2: Collapsible sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch (e) {
      console.warn('[RoadPro] localStorage unavailable, sidebar state will not persist.', e)
      return false
    }
  })
  // Enhancement 4: Mobile sidebar overlay
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  // Enhancement 6: Back-to-top visibility
  const [showBackToTop, setShowBackToTop] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const { theme, setTheme } = useTheme()

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch (e) {
        console.warn('[RoadPro] Could not persist sidebar state to localStorage.', e)
      }
      return next
    })
  }, [])

  // Back-to-top scroll listener
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowBackToTop(el.scrollTop > 400)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const validTabs = [
    'dashboard',
    'tracking',
    'timeline',
    'resources',
    'capacity',
    'calendar',
    'employees',
    'assets',
    'pm-equipment',
    'parts',
    'forms',
    'certifications',
    'sops',
    'analytics',
    'predictive',
    'database',
    'pm-schedules',
    'templates',
    'blend-calculator',
    'tanks',
    'rail-ops',
    'tanker-loading',
    'flow-diagram',
    'lab-dashboard',
    'lab-queue',
    'lab-specs',
    'financial',
    'production',
    'sales',
    'operations-hub',
    // Supply Chain & Procurement
    'procurement-dashboard',
    'purchase-orders',
    'vendors',
    'product-specs',
    'bom',
    'engineering-changes',
    // Distribution & Logistics
    'fleet',
    'deliveries',
    // HR & Compliance
    'hr-dashboard',
    'leave',
    'training',
    'compliance',
    'ai-training',
  ]
  const safeActiveTab = activeTab && validTabs.includes(activeTab) ? activeTab : 'dashboard'

  // Enhancement 3: Tab label map for breadcrumb
  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    tracking: 'Work Orders',
    calendar: 'Calendar',
    timeline: 'Timeline / Gantt',
    resources: 'Resource Allocation',
    capacity: 'Capacity Planning',
    'pm-schedules': 'PM Schedules',
    assets: 'Assets & Areas',
    'pm-equipment': 'PM Equipment',
    parts: 'Parts Inventory',
    forms: 'Forms & Inspections',
    sops: 'SOP Library',
    certifications: 'Certifications',
    analytics: 'Analytics',
    predictive: 'Predictive Maintenance',
    employees: 'Employees',
    templates: 'Work Order Templates',
    database: 'Database Management',
    'blend-calculator': 'Asphalt Blend Calculator',
    tanks: 'Tank Inventory',
    'rail-ops': 'Rail Operations',
    'tanker-loading': 'Tanker Loading',
    'flow-diagram': 'Flow Diagram',
    'lab-dashboard': 'Lab Dashboard',
    'lab-queue': 'Sample Queue',
    'lab-specs': 'Product Specifications',
    financial: 'Financial Overview',
    production: 'Production Tracking',
    sales: 'Sales Orders',
    'operations-hub': 'Operations Hub',
    // Supply Chain & Procurement
    'procurement-dashboard': 'Procurement Dashboard',
    'purchase-orders': 'Purchase Orders',
    vendors: 'Vendors',
    'product-specs': 'Product Specifications',
    bom: 'Bill of Materials',
    'engineering-changes': 'Engineering Changes',
    // Distribution & Logistics
    fleet: 'Fleet Management',
    deliveries: 'Delivery Tracking',
    // HR & Compliance
    'hr-dashboard': 'HR Dashboard',
    leave: 'Leave Management',
    training: 'Training',
    compliance: 'Compliance',
    'ai-training': 'AI Training Studio',
  }
  const currentSectionLabel = TAB_LABELS[safeActiveTab] ?? 'Dashboard'

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

  const handleLoadSampleData = useCallback(() => {
    const sampleWOs = generateSampleWorkOrders()
    const sampleSOPs = generateSampleSOPs()
    const sampleSpares = generateSampleSparesLabor()
    const sampleEmployees = generateSampleEmployees()
    const sampleSkills = generateSampleSkillMatrix()
    const sampleSchedules = generateSampleSchedules()
    const sampleParts = generateSampleParts()
    const sampleReminders = generateRemindersFromSkillMatrix(sampleSkills, sampleEmployees)
    
    setWorkOrders(sampleWOs)
    setSOPs(sampleSOPs)
    setSparesLabor(sampleSpares)
    setEmployees(sampleEmployees)
    setSkillMatrix(sampleSkills)
    setSchedules(sampleSchedules)
    setParts(sampleParts)
    setReminders(sampleReminders)

    // Seed cross-functional module stores so the Operations Hub shows a
    // complete integrated picture immediately after sample data is loaded.
    setSalesOrders(generateSampleSalesOrders())
    setProductionBatches(generateSampleProductionBatches())
    setMaintenanceCosts(generateSampleMaintenanceCosts())
    setMaintenanceBudgets(generateSampleMaintenanceBudgets())

    setHasSeededData(true)
    
    toast.success('Sample data loaded successfully')
  }, [
    setWorkOrders,
    setSOPs,
    setSparesLabor,
    setEmployees,
    setSkillMatrix,
    setSchedules,
    setParts,
    setReminders,
    setSalesOrders,
    setProductionBatches,
    setMaintenanceCosts,
    setMaintenanceBudgets,
    setHasSeededData
  ])

  const handleExportData = () => {
    if (safeWorkOrders.length === 0 && safeSOPs.length === 0 && safeSparesLabor.length === 0) {
      toast.error('No data to export')
      return
    }

    exportToExcel(
      {
        workOrders: safeWorkOrders,
        sops: safeSOPs,
        sparesLabor: safeSparesLabor
      },
      { requestedBy: userProfile?.display_name || userProfile?.username || undefined }
    )
      .then(() => toast.success('Data exported successfully'))
      .catch((error) => {
        toast.error('Failed to export data')
        console.error(error)
      })
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

    // Auto-scheduled work orders are automatically accepted without notifications
    // No notifications are generated for auto-scheduler assignments
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
  const safeReminders = reminders || []
  const overdueCount = safeWorkOrders.filter(wo => wo.is_overdue).length
  const initialSeedCheck = useRef(false)

  useEffect(() => {
    if (initialSeedCheck.current) return
    initialSeedCheck.current = true

    if (hasSeededData) return

    const hasExistingData = [
      safeWorkOrders.length,
      safeSOPs.length,
      safeSparesLabor.length,
      safeEmployees.length,
      safeSkillMatrix.length,
      safeSchedules.length,
      (parts || []).length,
      safeReminders.length
    ].some(count => count > 0)

    if (!hasExistingData) {
      handleLoadSampleData()
    } else {
      setHasSeededData(true)
    }
  }, [
    hasSeededData,
    handleLoadSampleData
  ])

  const certificationCounts = useMemo(() => {
    const currentReminders = generateRemindersFromSkillMatrix(
      safeSkillMatrix,
      safeEmployees,
      reminders || []
    )
    return getReminderCounts(currentReminders)
  }, [safeSkillMatrix, safeEmployees, reminders])

  const moduleNavigation = useMemo(() => ({
    salesFinance: [
      {
        title: 'Business Overview',
        items: [
          { tab: 'financial', label: 'Financial Overview', icon: CurrencyDollar },
          { tab: 'operations-hub', label: 'Operations Hub', icon: GitBranch },
          { tab: 'sales', label: 'Sales Orders', icon: ShoppingCart },
          { tab: 'analytics', label: 'Analytics', icon: ChartBar },
        ]
      }
    ],
    production: [
      {
        title: 'Production Control',
        items: [
          { tab: 'production', label: 'Production Tracking', icon: Factory },
          { tab: 'operations-hub', label: 'Operations Hub', icon: GitBranch },
          { tab: 'blend-calculator', label: 'Blend Calculator', icon: Flask },
          { tab: 'tanks', label: 'Tank Inventory', icon: Drop },
        ]
      },
      {
        title: 'Operator Workflow',
        items: [
          { tab: 'rail-ops', label: 'Rail Operations', icon: Train },
          { tab: 'tanker-loading', label: 'Tanker Loading', icon: Truck },
          { tab: 'flow-diagram', label: 'Flow Diagram', icon: GitBranch },
          { tab: 'forms', label: 'Forms & Inspections', icon: CheckSquare },
        ]
      },
      {
        title: 'Lab & Quality',
        items: [
          { tab: 'lab-dashboard', label: 'Lab Dashboard', icon: Flask },
          { tab: 'lab-queue', label: 'Sample Queue', icon: CheckSquare },
          { tab: 'lab-specs', label: 'Product Specs', icon: ClipboardText },
        ]
      }
    ],
    maintenance: [
      {
        title: 'My Work',
        items: [
          { tab: 'dashboard', label: 'Dashboard', icon: House },
          { tab: 'tracking', label: 'Work Orders', icon: Wrench, dataTour: 'tracking-tab', badge: overdueCount > 0 ? overdueCount : null },
          { tab: 'calendar', label: 'Calendar', icon: CalendarBlank },
        ]
      },
      {
        title: 'Schedule',
        items: [
          { tab: 'timeline', label: 'Timeline', icon: ChartLineUp },
          { tab: 'resources', label: 'Resources', icon: Users },
          { tab: 'capacity', label: 'Capacity', icon: Gauge },
          { tab: 'pm-schedules', label: 'PM Schedules', icon: Clock },
        ]
      },
      {
        title: 'Equipment & Parts',
        items: [
          { tab: 'assets', label: 'Assets', icon: Package, dataTour: 'assets-tab' },
          { tab: 'pm-equipment', label: 'PM Equipment', icon: Gear },
          { tab: 'parts', label: 'Parts', icon: Toolbox },
        ]
      },
      {
        title: 'Documentation',
        items: [
          { tab: 'forms', label: 'Forms & Inspections', icon: CheckSquare },
          { tab: 'sops', label: 'SOPs', icon: ClipboardText },
          { tab: 'certifications', label: 'Certifications', icon: Certificate, badge: certificationCounts.critical > 0 ? certificationCounts.critical : null },
        ]
      },
      {
        title: 'Insights',
        items: [
          { tab: 'operations-hub', label: 'Operations Hub', icon: GitBranch },
          { tab: 'analytics', label: 'Analytics', icon: ChartBar },
          { tab: 'predictive', label: 'Predictive', icon: Brain },
        ]
      },
      {
        title: 'Team & Admin',
        items: [
          { tab: 'employees', label: 'Employees', icon: UserGear, dataTour: 'employees-tab' },
          { tab: 'templates', label: 'Templates', icon: FileText },
          { tab: 'database', label: 'Database', icon: Database },
        ]
      }
    ],
    supplyChain: [
      {
        title: 'Procurement',
        items: [
          { tab: 'procurement-dashboard', label: 'Dashboard', icon: Buildings },
          { tab: 'purchase-orders', label: 'Purchase Orders', icon: Receipt },
          { tab: 'vendors', label: 'Vendors', icon: Cube },
        ]
      },
      {
        title: 'Design & Engineering',
        items: [
          { tab: 'product-specs', label: 'Product Specs', icon: ClipboardText },
          { tab: 'bom', label: 'Bill of Materials', icon: TreeStructure },
          { tab: 'engineering-changes', label: 'Engineering Changes', icon: Gear },
        ]
      }
    ],
    distribution: [
      {
        title: 'Logistics',
        items: [
          { tab: 'fleet', label: 'Fleet Management', icon: Van },
          { tab: 'deliveries', label: 'Delivery Tracking', icon: NavigationArrow },
        ]
      }
    ],
    hrCompliance: [
      {
        title: 'Human Resources',
        items: [
          { tab: 'hr-dashboard', label: 'HR Dashboard', icon: UsersThree },
          { tab: 'leave', label: 'Leave Management', icon: CalendarCheck },
          { tab: 'training', label: 'Training', icon: GraduationCap },
        ]
      },
      {
        title: 'Compliance',
        items: [
          { tab: 'compliance', label: 'Compliance', icon: ShieldCheck },
        ]
      },
      {
        title: 'AI Studio',
        items: [
          { tab: 'ai-training', label: 'AI Training Studio', icon: Brain },
        ]
      }
    ],
  }), [certificationCounts.critical, overdueCount])

  const currentModuleDetails = selectedModule ? MODULE_DETAILS[selectedModule] : null
  const currentModuleSections = selectedModule ? moduleNavigation[selectedModule] : []
  const currentModuleTabs = useMemo(
    () => currentModuleSections.flatMap(section => section.items.map(item => item.tab)),
    [currentModuleSections]
  )

  useEffect(() => {
    if (!selectedModule) return

    const moduleDefaultTab = MODULE_DETAILS[selectedModule].defaultTab
    if (!currentModuleTabs.includes(safeActiveTab)) {
      setActiveTab(moduleDefaultTab)
    }
  }, [currentModuleTabs, safeActiveTab, selectedModule, setActiveTab])

  const tourSteps: TourStep[] = useMemo(() => ([
    {
      id: 'tracking-tab',
      selector: '[data-tour="tracking-tab"]',
      title: 'Track Work Orders',
      description: 'Open Tracking to manage all maintenance requests, priorities, and status updates.'
    },
    {
      id: 'assets-tab',
      selector: '[data-tour="assets-tab"]',
      title: 'Manage Assets',
      description: 'Use Assets to organize equipment and areas so work orders map cleanly to locations.'
    },
    {
      id: 'employees-tab',
      selector: '[data-tour="employees-tab"]',
      title: 'Review Technicians',
      description: 'Employees lets you maintain skill matrix, schedules, and assignments for each technician.'
    },
    {
      id: 'new-work-order',
      selector: '[data-tour="new-work-order"]',
      title: 'Create New Work Order',
      description: 'Use this action to create a work order and assign the best technician for the job.'
    },
    {
      id: 'user-menu',
      selector: '[data-tour="user-menu"]',
      title: 'User Menu & Restart Tour',
      description: 'Open this menu any time to restart onboarding and adjust profile or role settings.'
    }
  ]), [])

  const startTour = useCallback(() => {
    setTourOpen(true)
  }, [])

  const completeTour = useCallback(() => {
    localStorage.setItem('maintenancepro-tour-completed', 'true')
    setTourOpen(false)
    toast.success('Product tour completed')
  }, [])

  const closeTour = useCallback(() => {
    setTourOpen(false)
  }, [])

  // Add global keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': () => setSearchOpen(true),
    'ctrl+k': () => setSearchOpen(true),
    'cmd+n': () => hasPermission(currentUserRole, 'work-orders', 'create') && setNewWorkOrderOpen(true),
    'ctrl+n': () => hasPermission(currentUserRole, 'work-orders', 'create') && setNewWorkOrderOpen(true),
    'cmd+i': () => setImportOpen(true),
    'ctrl+i': () => setImportOpen(true),
    'cmd+e': handleExportData,
    'ctrl+e': handleExportData,
    '?': () => setKeyboardShortcutsOpen(true)
  })

  const handleSelectModule = useCallback((module: ModuleKey) => {
    setSelectedModule(module)
    setMobileSidebarOpen(false)
    setActiveTab(MODULE_DETAILS[module].defaultTab)
  }, [setActiveTab])

  const renderNavButton = useCallback((item: {
    tab: string
    label: string
    icon: typeof House
    badge?: number | null
    dataTour?: string
  }) => {
    const isActive = safeActiveTab === item.tab
    const Icon = item.icon

    const button = (
      <button
        key={item.tab}
        onClick={() => { setActiveTab(item.tab); setMobileSidebarOpen(false) }}
        data-tour={item.dataTour}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted'}`}
      >
        <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
        {!sidebarCollapsed && item.badge !== undefined && item.badge !== null && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {item.badge}
          </span>
        )}
      </button>
    )

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.tab}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
            {item.badge ? ` (${item.badge})` : ''}
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }, [safeActiveTab, setActiveTab, setMobileSidebarOpen, sidebarCollapsed])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Skip to main content
      </a>

      {!selectedModule ? (
        <main id="main-content" className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
            <div className="w-full space-y-10">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                    <Wrench size={18} weight="bold" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">RoadPro</p>
                    <p className="text-xs">Select the workspace that matches your role to continue.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Step 1 of 1</p>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Choose Your RoadPro Interface</h1>
                  <p className="text-lg text-muted-foreground">
                    Each workspace opens directly to the right dashboard for that team, with navigation trimmed to the tools they actually use.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {(Object.entries(MODULE_DETAILS) as [ModuleKey, typeof MODULE_DETAILS[ModuleKey]][]).map(([key, module]) => {
                  const Icon = module.icon

                  return (
                    <Card key={key} className="border-border/60 bg-card/95 backdrop-blur-sm shadow-lg transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                      <CardHeader className="space-y-4">
                        <div className={`inline-flex w-fit items-center gap-3 rounded-2xl bg-gradient-to-br ${module.accent} px-4 py-3 text-white shadow-md`}>
                          <Icon size={24} weight="fill" />
                          <span className="text-sm font-semibold uppercase tracking-[0.18em]">{module.shortLabel}</span>
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{module.label}</CardTitle>
                          <CardDescription className="text-sm leading-6">{module.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-xl border bg-muted/30 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Best for</p>
                          <p className="mt-2 text-sm leading-6">{module.audience}</p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Included tools</p>
                          <div className="flex flex-wrap gap-2">
                            {module.highlights.map((highlight) => (
                              <span key={highlight} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Button onClick={() => handleSelectModule(key)} className="w-full justify-center">
                          Open {module.label}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="min-h-screen bg-background flex">
          {/* ── Enhancement 4: Mobile Sidebar Overlay Backdrop ── */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ── Sidebar Navigation ── */}
          <aside
            className={[
              'shrink-0 bg-card border-r flex flex-col sticky top-0 h-screen z-40 transition-all duration-300',
              sidebarCollapsed ? 'w-[52px]' : 'w-60',
              'max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-screen max-lg:z-40',
              mobileSidebarOpen ? 'max-lg:translate-x-0 max-lg:w-60' : 'max-lg:-translate-x-full'
            ].join(' ')}
          >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 h-14 border-b shrink-0 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <Wrench size={18} weight="bold" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-primary leading-tight truncate">RoadPro</p>
              <div className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                <LiveActivityIndicator />
                <span>{currentModuleDetails?.label} Interface</span>
              </div>
            </div>
          )}
          {/* Enhancement 2: Sidebar collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden lg:flex items-center justify-center"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <SidebarSimple size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Work Order CTA */}
        {selectedModule === 'maintenance' && hasPermission(currentUserRole, 'work-orders', 'create') && (
          <div className={`border-b shrink-0 ${sidebarCollapsed ? 'px-1.5 py-3' : 'px-3 py-3'}`}>
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setNewWorkOrderOpen(true)}
                    size="icon"
                    className="w-full h-9"
                    data-tour="new-work-order"
                    aria-label="New Work Order"
                  >
                    <Plus size={16} weight="bold" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Work Order</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => setNewWorkOrderOpen(true)}
                className="w-full gap-2 h-9 font-semibold shadow-sm"
                data-tour="new-work-order"
              >
                <Plus size={16} weight="bold" />
                New Work Order
              </Button>
            )}
          </div>
        )}

        {/* Nav Groups – Enhancement 2: icon-only when collapsed, Enhancement 9: aria-current */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'px-1.5' : 'px-2'} py-3 overflow-y-auto space-y-4`} aria-label="Main navigation">
          {currentModuleSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(renderNavButton)}
              </div>
            </div>
          ))}
        </nav>

        {/* Enhancement 7: Sidebar Footer with version strip */}
        <div className={`border-t shrink-0 ${sidebarCollapsed ? 'px-1.5 py-2' : 'px-3 py-2'}`}>
          <SystemStatus />
          {!sidebarCollapsed && (
            <p className="mt-2 text-[10px] text-muted-foreground/60 text-center">
              RoadPro v2.0 &nbsp;·&nbsp;
              <a href="https://github.com/Dauksza/maintenancepro-enter" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">Help</a>
            </p>
          )}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Compact Top Header */}
        <header className="bg-card/95 backdrop-blur-md border-b sticky top-0 z-10 h-14 flex items-center gap-2 px-4 shrink-0" role="banner">
          {/* Enhancement 4: Mobile hamburger menu */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open navigation"
          >
            <List size={20} />
          </button>

          {/* Enhancement 3: Section breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {currentModuleDetails?.shortLabel}
            </span>
            <span>/</span>
            <span className="font-medium text-foreground">{currentSectionLabel}</span>
          </div>

          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="gap-2 w-[180px] justify-start text-muted-foreground h-9 text-sm shadow-sm ml-2"
          >
            <MagnifyingGlass size={16} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-muted rounded font-mono hidden sm:block">⌘K</kbd>
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedModule(null)}
            className="hidden md:flex"
          >
            Switch Interface
          </Button>

          {/* Alert banners */}
          {selectedModule === 'maintenance' && overdueCount > 0 && hasPermission(currentUserRole, 'schedules', 'execute') && (
            <Button
              onClick={() => setAutoSchedulerOpen(true)}
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 h-8 text-xs shadow-sm hidden sm:flex"
            >
              <Sparkle size={14} weight="fill" />
              {overdueCount} Overdue - Auto-Schedule
            </Button>
          )}
          {selectedModule === 'maintenance' && certificationCounts.critical > 0 && (
            <Button
              onClick={() => setActiveTab('certifications')}
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 h-8 text-xs hidden sm:flex"
            >
              <Certificate size={14} weight="fill" />
              {certificationCounts.critical} Expiring
            </Button>
          )}

          {/* Import / Export */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setImportOpen(true)}
                  className="h-8 w-8"
                  aria-label="Import data"
                >
                  <UploadSimple size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Import data (Ctrl+I)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExportData}
                  className="h-8 w-8"
                  aria-label="Export data"
                >
                  <DownloadSimple size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export data (Ctrl+E)</TooltipContent>
            </Tooltip>
          </div>

          <KeyboardShortcutsDialog
            open={keyboardShortcutsOpen}
            onOpenChange={setKeyboardShortcutsOpen}
          />

          {/* Enhancement 1: Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1">
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
          </div>

          <UserProfileMenu
            onRoleChange={setCurrentUserRole}
            onOpenImport={() => setImportOpen(true)}
            onExportData={handleExportData}
            onRestartTour={startTour}
          />
        </header>

        {/* Main Content */}
        <main id="main-content" ref={mainRef} className="flex-1 px-4 sm:px-6 py-6 overflow-auto">
          {/* Enhancement 6: Back to top button */}
          <button
            onClick={scrollToTop}
            className={`back-to-top bg-primary text-primary-foreground hover:bg-primary/90 no-print ${showBackToTop ? '' : 'hidden'}`}
            aria-label="Back to top"
          >
            <ArrowUp size={16} weight="bold" />
          </button>

          <Suspense fallback={<div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>}>
          <Tabs value={safeActiveTab} onValueChange={setActiveTab}>

            <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
              <CustomizableDashboard
                workOrders={safeWorkOrders}
                employees={safeEmployees}
                parts={parts || []}
                certifications={reminders || []}
                onSelectWorkOrder={handleSelectWorkOrder}
                userEmployeeId={userProfile?.employee_id || undefined}
                onLoadSampleData={handleLoadSampleData}
                onOpenImport={() => setImportOpen(true)}
                onCreateWorkOrder={() => setNewWorkOrderOpen(true)}
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
                  onOptimizeSchedule={() => setAutoSchedulerOpen(true)}
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
              <AssetsAreasManagement employees={safeEmployees} workOrders={safeWorkOrders} />
            </TabsContent>

            <TabsContent value="pm-equipment" className="space-y-6 animate-fade-in">
              <PMEquipmentManagement />
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
                    priority_level: priority as PriorityLevel,
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

            <TabsContent value="pm-schedules" className="space-y-6 animate-fade-in">
              <PMScheduleManagement />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 animate-fade-in">
              <WorkOrderTemplates />
            </TabsContent>

            <TabsContent value="blend-calculator" className="space-y-6 animate-fade-in">
              <AsphaltBlendCalculator />
            </TabsContent>

            <TabsContent value="tanks" className="space-y-6 animate-fade-in">
              <TankInventoryManagement />
            </TabsContent>

            <TabsContent value="rail-ops" className="space-y-6 animate-fade-in">
              <RailOperations />
            </TabsContent>

            <TabsContent value="tanker-loading" className="space-y-6 animate-fade-in">
              <TankerLoading />
            </TabsContent>

            <TabsContent value="flow-diagram" className="space-y-6 animate-fade-in">
              <AsphaltFlowDiagram />
            </TabsContent>

            <TabsContent value="lab-dashboard" className="space-y-6 animate-fade-in">
              <LabDashboard />
            </TabsContent>

            <TabsContent value="lab-queue" className="space-y-6 animate-fade-in">
              <LabSampleQueue />
            </TabsContent>

            <TabsContent value="lab-specs" className="space-y-6 animate-fade-in">
              <LabSpecifications />
            </TabsContent>

            <TabsContent value="financial" className="space-y-6 animate-fade-in">
              <FinancialDashboard />
            </TabsContent>

            <TabsContent value="production" className="space-y-6 animate-fade-in">
              <ProductionTracking />
            </TabsContent>

            <TabsContent value="sales" className="space-y-6 animate-fade-in">
              <SalesOrders />
            </TabsContent>

            <TabsContent value="operations-hub" className="space-y-6 animate-fade-in">
              <CrossFunctionalHub currentModule={selectedModule} />
            </TabsContent>

            {/* Supply Chain tabs */}
            <TabsContent value="procurement-dashboard" className="space-y-6 animate-fade-in">
              <ProcurementDashboard />
            </TabsContent>

            <TabsContent value="purchase-orders" className="space-y-6 animate-fade-in">
              <PurchaseOrders />
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6 animate-fade-in">
              <VendorManagement />
            </TabsContent>

            <TabsContent value="product-specs" className="space-y-6 animate-fade-in">
              <ProductSpecifications />
            </TabsContent>

            <TabsContent value="bom" className="space-y-6 animate-fade-in">
              <BillOfMaterials />
            </TabsContent>

            <TabsContent value="engineering-changes" className="space-y-6 animate-fade-in">
              <EngineeringChanges />
            </TabsContent>

            {/* Distribution tabs */}
            <TabsContent value="fleet" className="space-y-6 animate-fade-in">
              <FleetManagement />
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-6 animate-fade-in">
              <DeliveryTracking />
            </TabsContent>

            {/* HR & Compliance tabs */}
            <TabsContent value="hr-dashboard" className="space-y-6 animate-fade-in">
              <HRDashboard />
            </TabsContent>

            <TabsContent value="leave" className="space-y-6 animate-fade-in">
              <LeaveManagement />
            </TabsContent>

            <TabsContent value="training" className="space-y-6 animate-fade-in">
              <TrainingManagement />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 animate-fade-in">
              <ComplianceDashboard />
            </TabsContent>

            <TabsContent value="ai-training" className="space-y-6 animate-fade-in">
              <AITrainingModule />
            </TabsContent>
          </Tabs>
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
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
        employees={safeEmployees}
        skillMatrix={safeSkillMatrix}
        schedules={safeSchedules}
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

      {selectedModule === 'maintenance' && (
        <>
          <WelcomeDialog onComplete={() => {
            toast.success('Welcome to RoadPro!', {
              description: 'Click "Load Sample Data" to get started with example data.'
            })
          }} onNavigate={setActiveTab} onStartTour={startTour} />

          <InteractiveTour
            open={tourOpen}
            steps={tourSteps}
            onClose={closeTour}
            onComplete={completeTour}
          />
        </>
      )}
      </Suspense>
        </div>
      )}

      <PWAInstallBanner />
    </div>
  )
}

export default App
