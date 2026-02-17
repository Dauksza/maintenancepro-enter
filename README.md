# MaintenancePro - Transformative Enterprise CMMS

**The next generation of maintenance management - combining AI-powered predictive analytics, intelligent automation, and a sleek futuristic interface that empowers teams to achieve operational excellence.**

## 🚀 Transformative Vision

MaintenancePro represents a **transformative leap forward** in how organizations manage their assets, processes, and maintenance activities. This isn't just another CMMS—it's a comprehensive platform that embodies both elegance and clarity, where every feature feels familiar yet innovative from the very first interaction.

### 💡 What Makes MaintenancePro Transformative

- **🎨 Sleek, Futuristic Interface**: Modern UI/UX design with clean lines, intuitive layouts, and sophisticated animations that prioritize ease of use
- **🧠 AI-Powered Intelligence**: Predictive maintenance using machine learning to prevent failures before they happen
- **📱 Mobile-First PWA**: Install as an app, work offline, and sync seamlessly across all your devices
- **⚡ Real-Time Responsiveness**: Live status indicators and instant updates that keep teams synchronized
- **🔮 Predictive Analytics**: Proactive maintenance planning with failure predictions and resource forecasting
- **🎯 Intelligent Automation**: Auto-scheduler that optimizes assignments based on skills, availability, and capacity
- **🌐 Cloud-Ready Architecture**: Designed for scalability and built to grow with your organization
- **🔒 Enterprise-Grade Security**: Role-based access control and comprehensive audit trails

## 🎯 Overview

MaintenancePro is an enterprise-level maintenance management application that helps industrial facilities track work orders, manage standard operating procedures (SOPs), optimize resource allocation, and maintain workforce certifications. Built with React 19, TypeScript 5.7, and Tailwind CSS v4, it provides a modern, responsive interface for maintenance teams in both production and sales environments.

## ✨ Key Features

### 📋 Work Order Management
- **Comprehensive Tracking**: Monitor maintenance tasks across all equipment with real-time status updates
- **Smart Filtering**: Group and filter by equipment, status, priority, terminal, and technician
- **Inline Editing**: Quick updates directly in the grid view
- **Automated Overdue Detection**: System automatically flags overdue tasks
- **Excel Import/Export**: Seamless data migration with validation and diff viewing

### 📚 SOP Library & PM Generation
- **Centralized Procedures**: Searchable repository of standard operating procedures
- **Revision Tracking**: Complete version history for compliance
- **Automated PM Scheduling**: Generate recurring preventive maintenance tasks from SOP frequencies
- **LOTO/PPE Integration**: Safety requirements automatically propagated to work orders

### 🤖 Intelligent Auto-Scheduler
- **Multi-Factor Optimization**: Considers skills, areas, assets, availability, and capacity
- **Conflict Detection**: Identifies skill mismatches, unavailability, and capacity violations
- **Scoring System**: Ranks assignments 0-100 based on fit quality
- **Flexible Strategies**: Priority-first, date-first, or skill-match optimization

### 👥 Workforce Management
- **Employee Directory**: Complete contact information and profiles
- **Skill Matrix**: Track competencies, certifications, and proficiency levels
- **Schedule Management**: Shift assignments with weekly hour tracking
- **Internal Messaging**: Team communication with broadcast and priority support
- **Performance Analytics**: Work order completion metrics by technician

### 🎓 Certification Tracking
- **Automated Reminders**: Proactive notifications for expiring certifications (120/90/60/30/14/7/3/1/0 days)
- **Priority-Based Alerts**: Critical (expired/7-day), High (30-day), Medium (60-day)
- **Compliance Dashboard**: Real-time stats on expired, expiring, and up-to-date certifications
- **One-Click Renewal**: Streamlined workflow to update expiry dates
- **Audit Trail**: Track recent renewals for compliance reporting

### 📊 Analytics & Reporting
- **Status Dashboard**: Real-time visualization of work order distribution
- **Downtime Analysis**: Track and forecast equipment downtime
- **Labor Forecasting**: Project maintenance hours by equipment class
- **Completion Metrics**: Monitor team performance and completion rates
- **Timeline Views**: Gantt charts, calendar view, and resource allocation timelines

### 🗓️ Advanced Scheduling Views
- **Drag-and-Drop Calendar**: Intuitive month/week views with visual rescheduling
- **Resource Allocation Timeline**: Technician workload heatmap with capacity indicators
- **Capacity Planning**: Configure daily hour limits and monitor utilization
- **Timeline/Gantt View**: Continuous timeline visualization for work orders

### 🏭 Asset & Area Management
- **Asset Inventory**: Track equipment, vehicles, tools, instruments, and facilities
- **Area Assignment**: Organize facility into zones with employee and asset assignments
- **Skills Catalog**: Define technical skills with certification requirements
- **Guided Wizards**: Step-by-step creation flows for assets, employees, and areas

### 🔔 Notification System
- **Work Order Suggestions**: AI-powered technician recommendations based on skill match
- **Assignment Notifications**: Real-time alerts for suggested and confirmed assignments
- **Configurable Preferences**: Control notification types, thresholds, and auto-accept rules
- **Toast Manager**: Non-intrusive notifications with action buttons

### 🧠 ML-Powered Predictive Maintenance
- **Failure Prediction**: Probabilistic forecasting of equipment failures based on historical patterns
- **Pattern Recognition**: Identifies recurring maintenance cycles and trends
- **Capacity Forecasting**: Predicts future maintenance workload and downtime
- **Parts Usage Analysis**: Smart inventory management with depletion predictions

### 🎯 Root Cause Analysis
- **Pattern Detection**: ML algorithms identify common failure patterns across work orders
- **Failure Clustering**: Groups equipment failures by symptoms and root causes
- **Causal Relationships**: Detects cascading failures between related equipment
- **Timeline Analysis**: Tracks failure acceleration and identifies critical periods
- **Task Complexity**: Evaluates maintenance task difficulty and recommends improvements
- **Prevention Strategies**: AI-generated recommendations to prevent future failures

### 📱 Progressive Web App (PWA) Features ✨ NEW
- **Installable Application**: Add to home screen for native app experience on any device
- **Offline-First Architecture**: Continue working without internet—data syncs automatically when back online
- **Service Worker**: Advanced caching and background sync for seamless offline operation
- **Push Notifications**: Receive alerts for critical maintenance issues even when app is closed
- **Mobile-Optimized**: Responsive design with touch-friendly controls and layouts
- **App Shortcuts**: Quick actions from home screen (New Work Order, Dashboard)
- **Auto-Update**: Seamless updates in the background with user notification

### 🎨 Enhanced User Experience ✨ NEW
- **Welcome Onboarding**: Interactive multi-step guide for first-time users
- **Real-Time Status Indicators**: Live system status showing connectivity and sync state
- **Activity Indicators**: Visual feedback showing the system is actively monitoring
- **Smart Install Prompts**: Contextual suggestions to install the app for better experience
- **Keyboard Shortcuts**: Power-user features with quick access (Ctrl+K for search, etc.)
- **Contextual Tooltips**: Helpful guidance integrated throughout the interface
- **Smooth Animations**: Subtle, professional transitions that confirm actions without delay

### 🏭 PM Equipment Management ✨ NEW
- **Comprehensive Equipment Tracking**: Manage pumps, valves, motors, gearboxes, and instrumentation
- **Hierarchical Valve Organization**: Track thousands of valves nested in manifolds, headers, sections, areas, and systems
- **Equipment Types**: Specialized tracking for 9 equipment types with type-specific attributes
- **P&ID Drawing Editor**: Create and maintain Piping and Instrumentation Diagrams
- **Symbol Library**: Standard P&ID symbols for valves, pumps, vessels, instruments, and more
- **Drawing Tools**: Select, pan, add symbols, connect lines, and annotate drawings
- **Equipment Details**: Comprehensive specifications, maintenance history, and criticality ratings
- **Valve Hierarchy View**: Interactive tree view with expand/collapse for easy navigation
- **Sample Data Generator**: Quickly populate with 100 valves, 10 pumps, 20 motors, and more

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript 5.7
- **Styling**: Tailwind CSS v4, shadcn/ui v4 components
- **State Management**: React hooks with Spark KV persistence (spark.kv API)
- **Data Visualization**: Recharts, D3.js
- **Forms**: React Hook Form with Zod validation
- **Icons**: Phosphor Icons v2
- **Animations**: Framer Motion
- **Excel Processing**: XLSX library
- **Date Handling**: date-fns
- **Build Tool**: Vite 7
- **Runtime**: Spark Runtime with persistent KV store

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── wizards/        # Guided creation flows
│   ├── WorkOrderGrid.tsx
│   ├── CalendarView.tsx
│   ├── TimelineView.tsx
│   ├── EmployeeManagement.tsx
│   ├── CertificationReminders.tsx
│   ├── AssetsAreasManagement.tsx
│   ├── PMEquipmentManagement.tsx    # PM Equipment tab
│   ├── ValveHierarchyView.tsx       # Hierarchical valve view
│   ├── PMEquipmentDetailDialog.tsx  # Equipment details
│   ├── PIDDrawingEditor.tsx         # P&ID drawing editor
│   └── NotificationCenter.tsx
├── lib/                # Utilities and business logic
│   ├── types.ts        # TypeScript type definitions
│   ├── excel-parser.ts # Import/export engine
│   ├── auto-scheduler.ts
│   ├── skill-matcher.ts
│   ├── certification-utils.ts
│   ├── notification-utils.ts
│   ├── ml-utils.ts     # Predictive ML algorithms
│   ├── root-cause-analysis.ts # RCA pattern detection
│   ├── pm-equipment-utils.ts   # PM equipment generators
│   ├── pid-utils.ts            # P&ID drawing utilities
│   └── maintenance-utils.ts
├── hooks/              # Custom React hooks
├── App.tsx             # Main application component
├── index.css           # Global styles and theme
└── main.tsx            # Application entry point
```

## 🚀 Getting Started

### First Time Users

When you first open MaintenancePro, you'll be greeted with an **interactive welcome guide** that walks you through the key features and capabilities. This onboarding experience ensures you can start being productive immediately.

### Quick Start Steps

1. **Follow the Welcome Guide**: Complete the 3-step onboarding tour to learn the basics
2. **Load Sample Data**: Click "Load Sample Data" to populate the system with example work orders, SOPs, employees, and skills
3. **Explore the Interface**: Navigate through the tabs to familiarize yourself with different modules
4. **Import Your Data**: Use "Import Excel" to bring in your existing maintenance data
5. **Configure Your Team**: Add employees in the Employees tab with skills, certifications, and schedules
6. **Set Up Assets**: Define your equipment, areas, and required skills
7. **Set Up PM Equipment**: Navigate to PM Equipment tab and load sample data for pumps, valves, and instrumentation
8. **Create Work Orders**: Use the "New Work Order" button or generate from SOPs
9. **Try Auto-Schedule**: Let the intelligent scheduler optimize assignments based on skills and availability
10. **Install as App**: Click the install prompt to add MaintenancePro to your home screen for offline access

### PM Equipment Quick Start

1. **Navigate to PM Equipment Tab**: Click the PM Equipment tab in the main navigation
2. **Load Sample Data**: Click "Load Sample Data" to populate with 100 valves, 10 pumps, 20 motors, 15 gearboxes, and 90 instruments
3. **Explore Equipment List**: Search and filter equipment by type, view details by clicking any row
4. **View Valve Hierarchy**: Switch to the Valve Hierarchy tab to see the 6-level organizational structure
5. **Create P&ID Drawing**: Click "P&ID Editor" to start creating piping and instrumentation diagrams
6. **Review Documentation**: See [PM Equipment Guide](PM_EQUIPMENT_GUIDE.md) and [P&ID Drawing Guide](PID_DRAWING_GUIDE.md) for detailed instructions

### Power User Tips

- **Global Search**: Press `Ctrl+K` (or `Cmd+K` on Mac) to instantly search across all entities
- **Keyboard Shortcuts**: Press `Ctrl+/` to view all available keyboard shortcuts
- **Offline Mode**: Once installed as a PWA, the app works completely offline and syncs when reconnected
- **Customizable Dashboard**: Toggle widgets on/off to personalize your dashboard view
- **Quick Actions**: Use right-click context menus for fast access to common operations

## 📊 Data Model

### Core Entities
- **Work Orders**: Maintenance tasks with scheduling, assignment, and tracking
- **SOPs**: Standard operating procedures with PM frequency definitions
- **Employees**: Workforce directory with skills, schedules, and certifications
- **Assets**: Equipment and facility inventory with skill requirements
- **PM Equipment**: Specialized equipment tracking (pumps, valves, motors, gearboxes, instruments)
- **Areas**: Facility zones with employee and asset assignments
- **Skills**: Technical competencies with certification tracking
- **P&ID Drawings**: Piping and instrumentation diagrams
- **Skills**: Technical competencies with certification tracking

### Key Relationships
- Work Orders → SOPs (many-to-many)
- Work Orders → Assets (many-to-many)
- Work Orders → Areas (many-to-one)
- Employees → Skills (many-to-many via Skill Matrix)
- Employees → Areas (many-to-many)
- Assets → Skills (many-to-many)
- Assets → Areas (many-to-one)

## 🎨 Design Philosophy

MaintenancePro follows a **futuristic industrial engineering aesthetic** that combines sophistication with clarity:

- **🎨 Modern Color Palette**: Deep blue primary color conveying reliability and technical precision, with vibrant amber accents for high-visibility alerts
- **✨ Sleek Typography**: Inter font family for professional, data-dense interfaces; JetBrains Mono for technical codes
- **🖼️ Visual Hierarchy**: Clean lines, intuitive icons, and logical layouts that prioritize ease of use
- **⚡ Smooth Animations**: Subtle, professional transitions using Framer Motion that confirm actions without delay
- **📱 Mobile-First Design**: Responsive layouts optimized for touch interactions and smaller screens
- **🌙 Dark Mode**: System-aware theme switching for comfortable viewing in any environment
- **♿ Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support

### Real-Time Visual Feedback

The interface provides constant visual feedback to keep users informed:
- **Live Status Indicators**: Real-time connectivity and sync status in the header
- **Activity Pulse**: Visual heartbeat showing the system is actively monitoring
- **Progressive Loading**: Skeleton loaders and smooth transitions during data fetch
- **Toast Notifications**: Non-intrusive alerts that appear and dismiss automatically
- **Inline Validation**: Instant feedback on form inputs with clear error messages

## 📱 Progressive Web App Features

MaintenancePro is built as a **modern PWA** with full offline capabilities:

### Installation
- Add to home screen on iOS, Android, and desktop
- Native-like launch experience without browser chrome
- Standalone display mode with custom splash screen
- App shortcuts for quick actions

### Offline Functionality
- **Complete offline operation** - all features work without internet
- Service worker caches assets for instant loading
- Background sync queues changes for when connection is restored
- Automatic conflict resolution on sync
- Visual indicators show online/offline status

### Performance
- **Instant loading** with aggressive caching strategies
- Pre-fetching of critical resources
- Optimized bundle size with code splitting
- Virtual scrolling for large datasets
- Debounced search and form inputs

## 🔐 Data Persistence

All data is persisted using the Spark KV API with automatic syncing:
- Work orders, SOPs, and spare parts
- Employee directory and skill matrix
- Schedules and messages
- Certification reminders and notifications
- Assets, areas, and skills
- Capacity limits and notification preferences

## 📦 Excel Import Schema

The system supports importing three Excel sheets:

1. **Maintenance Tracking**: Work order data with columns for ID, equipment, priority, status, task, scheduled date, downtime, technician, etc.
2. **SOP Library**: Procedures with title, revision, purpose, scope, LOTO/PPE, PM frequencies, and procedure summary
3. **Spares & Labor**: Equipment classes with common spare parts and labor hours by frequency

## 🎯 Roadmap & Vision

### ✅ Recently Completed
- ✅ Progressive Web App with offline support
- ✅ Interactive welcome and onboarding experience
- ✅ Real-time status indicators and activity monitoring
- ✅ ML-powered predictive maintenance
- ✅ Root cause analysis with pattern detection
- ✅ Advanced auto-scheduler with multi-factor optimization
- ✅ Role-based access control and permissions
- ✅ Global search across all entities
- ✅ **PM Equipment Management** with hierarchical valve tracking
- ✅ **P&ID Drawing Editor** for piping and instrumentation diagrams

### 🚀 Future Enhancements
- **Enhanced Mobile Experience**: Native iOS and Android apps
- **IoT Integration**: Real-time equipment sensor data streaming
- **Conversational AI**: ChatBot assistant for maintenance guidance
- **QR Code Scanning**: Quick asset identification and work order creation
- **Photo/Video Attachments**: Visual documentation for work orders
- **PDF Generation**: Professional reports and work order printouts
- **API Integration Layer**: REST API for third-party system connections
- **Advanced Visualization**: 3D equipment models and AR for inspections
- **Sustainability Tracking**: Carbon footprint and energy efficiency metrics
- **Multi-Language Support**: Internationalization for global operations

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
