# 🚀 Quick Start Guide - MaintenancePro

## Welcome to MaintenancePro!

This guide will help you get started with your enterprise maintenance management system in under 5 minutes.

---

## 📋 Initial Setup

### Step 1: Load Sample Data (Recommended for First-Time Users)

1. Look for the button in the header or tracking tab
2. Click **"Load Sample Data"**
3. This will populate:
   - 15+ sample work orders
   - 10+ standard operating procedures
   - 12+ sample employees with skills
   - 20+ parts inventory items
   - Equipment classes and labor data
   - Sample assets and areas
   - Pre-made form templates

### Step 2: Set Your User Role

1. Click your avatar/profile menu in the top-right
2. Select a role that matches your position:
   - **Admin**: Full system access
   - **Manager**: Manage teams and approve work
   - **Supervisor**: Oversee operations and assign tasks
   - **Technician**: Execute work orders and submit forms
   - **Viewer**: Read-only access

---

## 🎯 Core Workflows

### Creating a Work Order

**Option 1: Manual Creation**
1. Click **"+ New Work Order"** in the header
2. Fill in the form:
   - Equipment/Area
   - Priority (Low/Medium/High/Critical)
   - Type (Maintenance/Inspection/Calibration/Repair)
   - Task description
   - Scheduled date
   - Estimated downtime
3. Review AI suggestions for:
   - Best-matched technicians
   - Recommended spare parts
   - Similar past work orders
   - Related SOPs
4. Click **"Create Work Order"**

**Option 2: Import from Excel**
1. Click **"Import Excel/CSV"**
2. Upload your file with sheets:
   - Maintenance Tracking
   - SOP Library
   - Spares & Labor
3. Review validation and preview
4. Confirm import

**Option 3: Generate from SOP**
1. Navigate to **SOPs** tab
2. Select an SOP with PM frequencies
3. Click **"Generate PM Schedule"**
4. Select frequency (Daily/Weekly/Monthly/etc.)
5. Review and confirm work orders

### Using the Auto-Scheduler

1. Click **"Auto-Schedule"** button (appears when overdue tasks exist)
2. Configure options:
   - Date range to schedule within
   - Prioritize by: Priority/Date/Duration/Skill Match
   - Toggle skill/area/asset considerations
   - Set minimum skill level required
3. Click **"Generate Schedule"**
4. Review preview showing:
   - Success/failure predictions
   - Match scores for each assignment
   - Detected conflicts
5. Click **"Apply Schedule"** to confirm

### Managing Employees

**Adding New Employee**
1. Navigate to **Employees** tab
2. Click **"Add Employee"**
3. Complete the 6-step wizard:
   - Step 1: Basic Information (name)
   - Step 2: Contact Details (email, phone)
   - Step 3: Employment Info (position, department, shift)
   - Step 4: Emergency Contact
   - Step 5: Certifications (add skills with expiry dates)
   - Step 6: Review & Confirm
4. Click **"Create Employee"**

**Editing Employee**
1. Click employee card in directory
2. Click **"Edit"** button
3. Update any fields
4. Click **"Save Changes"**

### Tracking Certifications

1. Navigate to **Certifications** tab
2. View dashboard showing:
   - Critical reminders (expired or <7 days)
   - High priority (expiring in 30 days)
   - Medium priority (expiring in 60 days)
3. Click **"Renew"** on any certification
4. Enter new expiry date
5. System automatically updates and dismisses reminder

### Managing Parts Inventory

1. Navigate to **Parts** tab
2. View current inventory with stock levels
3. **Add New Part**:
   - Click **"Add Part"**
   - Fill in details (name, category, quantities)
   - Set minimum stock level for alerts
4. **Record Transaction**:
   - Click transaction icon on part
   - Select type (Purchase/Use/Return/Transfer/Adjustment)
   - Enter quantity and details
   - System auto-updates stock levels

### Creating Custom Forms

1. Navigate to **Forms** tab
2. Click **"Create Form"**
3. Use the Form Wizard:
   - Step 1: Basic details (name, type, description)
   - Step 2: Add sections
   - Step 3: Add fields to each section (text, number, checkbox, etc.)
   - Step 4: Review and create
4. Form is now available for submissions

**Using Pre-Made Forms**
- Job Hazard Analysis (JHA)
- Daily Equipment Inspection
- Monthly Safety Inspection
- Incident Report
- LOTO Verification
- Pre-Trip Vehicle Inspection
- Hot Work Permit
- Maintenance Completion Form

---

## 📊 Viewing Your Data

### Dashboard (Customizable)

Shows real-time widgets:
- Quick statistics (total work orders, overdue, completed)
- My assignments (if linked to employee)
- Certification alerts
- Low stock parts
- Upcoming maintenance
- Analytics charts

### Multiple Views

**Tracking Tab**: Grid view with filtering and grouping
**Calendar Tab**: Month/week view with drag-and-drop scheduling
**Timeline Tab**: Gantt chart showing work order timeline
**Resources Tab**: Technician workload with capacity heatmap
**Capacity Tab**: Daily hour limits and utilization tracking

### Search Everything (⌘K or Ctrl+K)

- Press keyboard shortcut anywhere in app
- Search across:
  - Work orders
  - Employees
  - Assets
  - Parts
  - SOPs
  - Forms
- Click result to jump directly to details

---

## 🔔 Notifications

### Configure Your Preferences

1. Click the bell icon in header
2. Select **"Notification Settings"**
3. Configure:
   - Enable/disable notifications
   - Show toast popups
   - Notification types (suggestions, changes, overdue)
   - Minimum skill match score for suggestions
   - Auto-accept high matches

### Responding to Notifications

**Assignment Suggestions**
- Review match score and reasons
- Click **"Accept"** to assign work order to yourself
- Click **"Reject"** to decline suggestion
- Click **"View"** to see work order details

---

## 💡 Pro Tips

### Keyboard Shortcuts
- `⌘K` / `Ctrl+K` - Global search
- Click work order ID anywhere to view details
- Drag work orders in calendar/resource views to reschedule

### Efficient Data Entry
- Use wizards for guided entry (reduces errors)
- Clone existing work orders for recurring tasks
- Import Excel for bulk data migration
- Use AI suggestions when creating work orders

### Capacity Planning
1. Set daily hour limits per technician
2. System color-codes workload:
   - 🟢 Green: ≤50% capacity
   - 🟡 Yellow: 50-75% capacity
   - 🟠 Orange: 75-100% capacity
   - 🔴 Red: >100% (overallocated)
3. Auto-scheduler respects these limits

### Preventive Maintenance
1. Create SOPs with PM frequencies
2. Use "Generate PM Schedule" to auto-create recurring work orders
3. System pre-fills LOTO/PPE requirements from SOP

---

## 🗄️ Data Management

### Backup Your Data

1. Navigate to **Database** tab (Admin only)
2. Click **"Export Database"**
3. Save JSON backup file

### Restore from Backup

1. Navigate to **Database** tab
2. Click **"Import Database"**
3. Select backup file
4. Review preview
5. Confirm import (page will reload)

### Clear All Data

1. Navigate to **Database** tab
2. Click **"Clear All Data"**
3. Confirm action (cannot be undone)
4. Useful for starting fresh or testing

---

## 📈 Analytics & Reporting

### Work Order Analytics
- Status distribution (pie chart)
- Priority breakdown
- Completion rate over time
- Downtime analysis
- Labor hours by equipment class

### Employee Analytics
- Department distribution
- Shift coverage
- Skill coverage heatmap
- Work orders completed per technician

### Form Analytics
- Submissions by status
- Compliance rate
- Average completion time
- Issues by severity
- Corrective actions pending

---

## 🛠️ Common Issues

### "No employees available for scheduling"
- Navigate to Employees tab
- Add employees with required skills
- Ensure employees have "Active" status

### "Skill mismatch" in auto-scheduler
- Check work order required skills
- Add skills to employees in Employees → Skills Matrix
- Or lower minimum skill level in scheduler settings

### Parts showing "Low Stock"
- Click part in Parts tab
- Record a "Purchase" transaction
- Or adjust minimum stock level

### Certification reminders not appearing
- Ensure skill has certification enabled
- Set expiry date on employee skill
- Check that certification is within 120 days of expiry

---

## 🎓 Next Steps

1. ✅ Load sample data (or import your Excel data)
2. ✅ Configure your user role
3. ✅ Add your team in Employees tab
4. ✅ Set up assets and areas
5. ✅ Create or import work orders
6. ✅ Use auto-scheduler to optimize assignments
7. ✅ Configure notification preferences
8. ✅ Set capacity limits per technician
9. ✅ Create custom forms for your workflows
10. ✅ Export database backup regularly

---

## 📚 Additional Resources

- **README.md** - Comprehensive feature documentation
- **USER_GUIDE.md** - Detailed user instructions
- **DATABASE_SCHEMA.md** - Data model reference
- **API_DOCUMENTATION.md** - Function references
- **NOTIFICATION_SYSTEM.md** - Notification configuration

---

## 🆘 Need Help?

All features have been tested and are production-ready. If you encounter any issues:

1. Check the documentation files listed above
2. Use the Database tab to validate data integrity
3. Export a backup before making major changes
4. Review the SYSTEM_VERIFICATION.md for feature checklist

---

**Enjoy using MaintenancePro! 🎉**

*Your comprehensive enterprise maintenance management solution.*
