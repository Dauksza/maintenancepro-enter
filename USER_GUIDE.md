# MaintenancePro User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Work Order Management](#work-order-management)
3. [SOP Library](#sop-library)
4. [Employee Management](#employee-management)
5. [Certification Tracking](#certification-tracking)
6. [Asset & Area Management](#asset--area-management)
7. [Auto-Scheduler](#auto-scheduler)
8. [Scheduling Views](#scheduling-views)
9. [Analytics](#analytics)
10. [Notifications](#notifications)
11. [Import & Export](#import--export)

---

## Getting Started

### First Time Setup

When you first open MaintenancePro, you'll see an empty workspace. You have two options:

1. **Load Sample Data**: Click the "Load Sample Data" button to populate the system with example work orders, SOPs, employees, and equipment. This is great for exploring features.

2. **Import Your Data**: Click "Import Excel" to bring in your existing maintenance data from Excel spreadsheets.

### Navigation

The main navigation uses tabs at the top of the screen:

- **Tracking**: Main work order grid view
- **Timeline**: Gantt chart view of work orders
- **Resources**: Technician workload visualization
- **Capacity**: Capacity planning and utilization
- **Calendar**: Month/week calendar view
- **Employees**: Workforce management
- **Assets**: Equipment and area management
- **Certs**: Certification tracking
- **SOPs**: Standard operating procedures
- **Analytics**: Reports and dashboards

---

## Work Order Management

### Creating a Work Order

1. Click the **"New Work Order"** button in the header
2. Fill in the required fields:
   - **Work Order ID**: Unique identifier (auto-generated)
   - **Equipment/Area**: What equipment needs maintenance
   - **Task**: Description of the work
   - **Priority**: Low, Medium, High, or Critical
   - **Type**: Maintenance, Inspection, Calibration, or Repair
   - **Scheduled Date**: When the work should be done
   - **Estimated Downtime**: Expected hours
3. Optionally assign a technician or let the auto-scheduler handle it
4. Click **"Create Work Order"**

### Viewing Work Orders

The **Tracking** tab shows all work orders in a grid view:

- **Color Coding**:
  - 🔴 Red: Overdue
  - 🔵 Blue: Scheduled
  - 🟢 Green: Completed
  - ⚫ Gray: Cancelled

- **Filtering**: Use the search box and filter dropdowns to narrow down work orders
- **Sorting**: Click column headers to sort
- **Quick Actions**: Use the dropdown menu on each row for quick status changes

### Editing a Work Order

1. Click on any work order to open the detail panel
2. Edit fields as needed
3. Changes are saved automatically
4. Click **"Mark Complete"** when work is finished

### Cloning a Work Order

If you need to create similar work orders:

1. Open the work order detail
2. Click **"Clone Work Order"**
3. A new work order form opens with pre-filled data
4. Modify as needed and save

---

## SOP Library

### Viewing SOPs

Navigate to the **SOPs** tab to see all standard operating procedures:

- **Search**: Find SOPs by title or keywords
- **Expand**: Click an SOP card to see full details including:
  - Purpose and scope
  - LOTO/PPE requirements
  - Procedure steps
  - PM frequencies
  - Records required

### Generating Preventive Maintenance

SOPs can automatically create recurring work orders:

1. Open an SOP
2. Click **"Generate PM Schedule"**
3. Select frequencies to generate (Daily, Weekly, Monthly, etc.)
4. Review the work orders that will be created
5. Click **"Generate Work Orders"**

Work orders created from SOPs include:
- Pre-filled task descriptions
- LOTO/PPE requirements
- Estimated downtime from spares/labor data
- Links back to the source SOP

---

## Employee Management

### Adding Employees

1. Go to the **Employees** tab
2. Click **"Add Employee"**
3. Complete the wizard:
   - **Step 1**: Basic info (name, email, phone)
   - **Step 2**: Position details (department, shift, hire date)
   - **Step 3**: Emergency contact
   - **Step 4**: Review and confirm
4. After creation, you can add skills and schedules

### Managing Skills

The **Skill Matrix** shows employee competencies:

1. Select an employee
2. Go to the **Skills** tab
3. Click **"Add Skill"**
4. Fill in:
   - Skill category and name
   - Proficiency level (Beginner/Intermediate/Advanced/Expert)
   - Certification status
   - Expiry date (if applicable)
5. Save the skill

**Certification Tracking**:
- Set expiry dates on certifications
- System automatically generates reminders
- Red warning icons show expired certifications
- Orange icons show certifications expiring within 30 days

### Managing Schedules

View and edit employee schedules:

1. Select an employee
2. Go to the **Schedule** tab
3. Add shifts with start time, end time, and notes
4. Weekly hours are calculated automatically

### Messaging System

Send messages to team members:

1. Click **"New Message"** in the Employees tab
2. Select recipient (or choose "Broadcast to All")
3. Write your message
4. Set priority (Normal/High/Urgent)
5. Send
6. Recipients see unread message counts in their inbox

---

## Certification Tracking

### Overview

The **Certs** tab provides a centralized view of all employee certifications:

- **Dashboard Stats**: See counts of expired, expiring soon, and up-to-date certifications
- **Reminder Cards**: All certifications that need attention
- **Priority Levels**:
  - 🔴 **Critical**: Expired or expiring within 7 days
  - 🟠 **High**: Expiring within 30 days
  - 🟡 **Medium**: Expiring within 60 days
  - 🟢 **Low**: Expiring within 120 days

### Renewing Certifications

1. Find the certification reminder card
2. Click **"Renew"**
3. Enter the new expiry date
4. Save
5. The reminder is automatically dismissed

### Notification Settings

Configure how you receive certification alerts:

1. Click the gear icon on the Certs page
2. Enable/disable automatic notifications
3. Set notification intervals (default: 90/60/30/14/7/3/1/0 days before expiry)
4. Choose notification methods (Email, SMS, In-App)
5. Set up manager escalation rules
6. Configure auto-disable for expired employees

---

## Asset & Area Management

### Adding Assets

1. Go to the **Assets** tab
2. Click **"Add Asset"**
3. Complete the wizard:
   - **Step 1**: Basic info (name, type, category)
   - **Step 2**: Classification (manufacturer, model, serial number)
   - **Step 3**: Assignments (area, employees, skills required)
   - **Step 4**: Review
4. Assets can now be linked to work orders

**Asset Categories**:
- Equipment
- Vehicle
- Tool
- Instrument
- Facility

**Asset Status**:
- Operational
- Under Maintenance
- Out of Service
- Decommissioned

### Managing Areas

Areas organize your facility into logical zones:

1. Go to the **Areas** sub-tab in Assets
2. Click **"Add Area"**
3. Enter:
   - Area name
   - Department
   - Zone
   - Assigned employees
   - Daily capacity hours
4. Save

**Benefits**:
- Group work orders by area
- Assign employees to specific zones
- Track assets by location
- Auto-scheduler prioritizes employees in the same area

### Skills Catalog

Define technical skills that can be required for tasks:

1. Go to the **Skills** sub-tab in Assets
2. Click **"Add Skill"**
3. Fill in:
   - Skill name and category
   - Description
   - Whether certification is required
   - Certification duration (if applicable)
4. Link to assets and SOPs as needed

---

## Auto-Scheduler

### How It Works

The intelligent auto-scheduler assigns work orders to technicians based on:

- **Skills**: Does the employee have required skills?
- **Areas**: Is the employee assigned to this area?
- **Availability**: Is the employee active and on shift?
- **Capacity**: Does the employee have available hours?
- **Workload**: Balance work across the team
- **Priority**: Critical work is scheduled first

### Running Auto-Scheduler

1. Click **"Auto-Schedule"** button (appears when there are overdue or unassigned work orders)
2. Choose scheduling options:
   - Date range (default: next 7 days)
   - Prioritization strategy (Priority/Date/Skill Match)
   - Allow partial skill matches
   - Skip weekends
3. Review the preview showing:
   - Number of work orders to schedule
   - Conflicts detected
   - Assignment scores
4. Click **"Confirm Schedule"**
5. Work orders are assigned with notifications sent to technicians

### Interpreting Scores

Each assignment gets a score from 0-100:

- **90-100**: Perfect match (all skills, same area, good capacity)
- **70-89**: Good match (most skills, some area alignment)
- **50-69**: Acceptable match (basic skills, capacity available)
- **Below 50**: Poor match (missing skills or over capacity)

---

## Scheduling Views

### Calendar View

Drag-and-drop visual calendar:

1. Go to the **Calendar** tab
2. Switch between Month and Week views
3. **Reschedule**: Drag a work order card to a new date
4. **View Details**: Click a work order card
5. **Capacity Indicator**: See total downtime hours per day

### Timeline/Gantt View

Continuous timeline visualization:

1. Go to the **Timeline** tab
2. Work orders shown as horizontal bars
3. Color-coded by priority
4. Drag bars to reschedule
5. Hover for details
6. Grouped by equipment or technician

### Resource Allocation

Technician workload heatmap:

1. Go to the **Resources** tab
2. Each row shows one technician
3. **Color Coding** (capacity utilization):
   - 🟢 Green: ≤50% (under-utilized)
   - 🟡 Yellow: 50-75% (optimal)
   - 🟠 Orange: 75-100% (near capacity)
   - 🔴 Red: >100% (over-allocated)
4. **Drag to Reassign**: Drag work orders between technicians
5. **Drag to Reschedule**: Drag horizontally to change dates
6. **Summary Metrics**: Total technicians, workload, and average per tech

### Capacity Planning

Configure and monitor capacity:

1. Go to the **Capacity** tab
2. View utilization heatmap by week
3. **Add Capacity Limits**: Click "Add Capacity Limit"
4. Enter technician name and daily hour limit (default: 8 hours)
5. See warnings when capacity is exceeded
6. Drill down to specific overallocated days

---

## Analytics

### Available Reports

The **Analytics** tab provides:

1. **Work Orders by Status**: Pie chart showing distribution
2. **Work Orders by Priority**: Bar chart of priority breakdown
3. **Downtime by Month**: Trend of equipment downtime hours
4. **Labor Forecast**: Projected maintenance hours
5. **Maintenance by Area**: Which areas need most attention
6. **Completion Rate**: Percentage of on-time completions
7. **Overdue Trend**: Historical trend of overdue tasks

### Filtering Analytics

- Use date range picker to filter timeframe
- Click chart segments for drill-down details
- Export data using the "Export Excel" button

---

## Notifications

### Notification Center

Click the bell icon in the header to view notifications:

- **Unread Badge**: Shows count of unread notifications
- **Notification Types**:
  - Assignment suggestions (skill-matched work orders)
  - Assignment changes
  - Work order created/updated
  - Overdue alerts
  - Priority escalations

### Acting on Notifications

For assignment suggestions:

1. Review the work order details
2. See your match score (0-100)
3. **Accept**: Confirm the assignment
4. **Reject**: Decline the assignment
5. **View Work Order**: Open full details

### Notification Preferences

Configure notification settings:

1. Click the settings icon next to the notification bell
2. Enable/disable notification types:
   - Assignment suggestions
   - Assignment changes
   - Work order created
   - Overdue alerts
   - Priority escalation
3. Set minimum match score for suggestions (default: 60)
4. Enable auto-accept for high-match scores (>90)
5. Control toast notifications and sounds

---

## Import & Export

### Importing Excel Data

MaintenancePro supports importing Excel files with three sheets:

1. Click **"Import Excel"** in the header
2. Select your Excel file
3. System validates:
   - Required sheets (Maintenance Tracking, SOP Library, Spares & Labor)
   - Column headers match expected schema
   - Data types and formats are valid
4. Review preview with any validation errors highlighted
5. Fix errors or proceed with valid rows
6. Click **"Import"**

**Expected Sheets**:

**Maintenance Tracking**:
- work_order_id, equipment_area, priority_level, status, type
- task, comments_description, scheduled_date
- estimated_downtime_hours, assigned_technician, entered_by, terminal

**SOP Library**:
- sop_id, title, revision, effective_date, purpose, scope
- loto_ppe_hazards, pm_frequencies_included, procedure_summary, records_required

**Spares & Labor**:
- class, common_spares, labor_typical

### Exporting Data

Export your data for backup or external analysis:

1. Click **"Export Excel"** in the header
2. Excel file downloads with three sheets containing all current data
3. File can be edited and re-imported (system detects duplicates)

### Re-Import with Diff View

When re-importing data:

1. System detects existing work order IDs
2. Shows diff view comparing old vs. new data
3. Choose to:
   - **Merge**: Update existing records
   - **Create New**: Duplicate with new ID
   - **Skip**: Leave existing unchanged

---

## Tips & Best Practices

### Workflow Optimization

1. **Set Up Core Data First**: Start with employees, skills, and areas before creating work orders
2. **Use SOPs for Recurring Work**: Generate PMs from SOPs instead of manual creation
3. **Let Auto-Scheduler Work**: Run it daily to optimize assignments
4. **Monitor Certifications**: Check the Certs tab weekly
5. **Balance Workload**: Use Resource Allocation view to prevent burnout

### Data Quality

1. **Consistent Naming**: Use standard names for equipment and areas
2. **Complete Employee Profiles**: Fill in all skills and certifications
3. **Realistic Downtime Estimates**: Helps with capacity planning
4. **Link SOPs**: Connect work orders to SOPs for compliance tracking

### Performance

1. **Regular Exports**: Back up your data weekly
2. **Archive Completed Work**: Use filters to focus on active work
3. **Limit Date Ranges**: When viewing timelines, use reasonable date ranges

---

## Troubleshooting

### Work Orders Not Appearing

- Check filters - clear all filters to see everything
- Verify the work order was saved (check for toast notification)
- Refresh the browser

### Auto-Scheduler Failing

- Ensure employees have skills matching work order requirements
- Check that employees are marked as "Active"
- Verify capacity limits aren't too restrictive
- Review conflicts shown in preview

### Notifications Not Showing

- Check notification preferences are enabled
- Verify browser allows notifications
- Check that notification criteria are met (match score threshold)

### Import Errors

- Verify Excel file has all three required sheets
- Check column headers match exactly (case-sensitive)
- Validate date formats (YYYY-MM-DD or ISO 8601)
- Ensure priority and status values match enums exactly

---

## Keyboard Shortcuts

Coming soon...

---

## Support

For questions or issues:
1. Review this user guide
2. Check the NOTIFICATION_SYSTEM.md for notification details
3. Review the PRD.md for feature specifications
4. Check sample data to see expected formats

---

**Version**: 1.0  
**Last Updated**: 2024
