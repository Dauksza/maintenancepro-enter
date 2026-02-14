# MaintenancePro - Enterprise CMMS

**A comprehensive Computerized Maintenance Management System (CMMS) with integrated SOP management, intelligent scheduling, and workforce management.**

## 🎯 Overview

MaintenancePro is an enterprise-level maintenance management application that helps industrial facilities track work orders, manage standard operating procedures (SOPs), optimize resource allocation, and maintain workforce certifications. Built with React, TypeScript, and Tailwind CSS, it provides a modern, responsive interface for maintenance teams.

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
│   └── NotificationCenter.tsx
├── lib/                # Utilities and business logic
│   ├── types.ts        # TypeScript type definitions
│   ├── excel-parser.ts # Import/export engine
│   ├── auto-scheduler.ts
│   ├── skill-matcher.ts
│   ├── certification-utils.ts
│   ├── notification-utils.ts
│   └── maintenance-utils.ts
├── hooks/              # Custom React hooks
├── App.tsx             # Main application component
├── index.css           # Global styles and theme
└── main.tsx            # Application entry point
```

## 🚀 Getting Started

1. **Load Sample Data**: Click "Load Sample Data" to populate the system with example work orders, SOPs, employees, and skills
2. **Import Excel**: Use "Import Excel" to bring in your existing maintenance data
3. **Configure Employees**: Add your team in the Employees tab with skills and schedules
4. **Set Up Assets**: Define your equipment, areas, and required skills
5. **Create Work Orders**: Use the "New Work Order" button or generate from SOPs
6. **Auto-Schedule**: Let the intelligent scheduler optimize assignments
7. **Track Progress**: Monitor work orders across calendar, timeline, and resource views

## 📊 Data Model

### Core Entities
- **Work Orders**: Maintenance tasks with scheduling, assignment, and tracking
- **SOPs**: Standard operating procedures with PM frequency definitions
- **Employees**: Workforce directory with skills, schedules, and certifications
- **Assets**: Equipment and facility inventory with skill requirements
- **Areas**: Facility zones with employee and asset assignments
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

MaintenancePro follows an **industrial engineering aesthetic** with:
- **Deep blue primary color** conveying reliability and technical precision
- **Amber accent color** for high-visibility alerts and critical actions
- **Inter font family** for professional, data-dense interfaces
- **JetBrains Mono** for technical codes and identifiers
- **Grid pattern backgrounds** reinforcing technical/blueprint aesthetic
- **Subtle animations** that confirm actions without slowing power users

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

## 🎯 Roadmap

Future enhancements under consideration:
- Mobile app for field technicians
- QR code asset tagging
- Photo/video attachments for work orders
- PDF generation for work order reports
- Integration with external CMMS systems
- Predictive maintenance using ML
- Advanced reporting with custom dashboards

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
