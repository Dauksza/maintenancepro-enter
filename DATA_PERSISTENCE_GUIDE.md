# Data Persistence Guide

## Overview

MaintenancePro uses **automatic persistent storage** for all application data. Everything you create, edit, or delete is automatically saved and will be available when you return to the application.

## What Gets Persisted

All of the following data is automatically saved:

### Core Data
- ✅ **Work Orders** - All maintenance tasks, schedules, and assignments
- ✅ **SOPs** - Standard operating procedures library
- ✅ **Employees** - Employee directory, contact info, and roles
- ✅ **Skills** - Skill matrix, certifications, and proficiency levels
- ✅ **Schedules** - Employee availability and shift schedules
- ✅ **Assets** - Equipment, machinery, and physical assets
- ✅ **Areas** - Work areas, zones, and departments
- ✅ **Parts** - Spare parts inventory and stock levels
- ✅ **Part Transactions** - Inventory transaction history
- ✅ **Forms** - Inspection templates and JHA forms
- ✅ **Form Submissions** - Completed inspections and checklists

### System Data
- ✅ **Notifications** - Work order notifications and alerts
- ✅ **Messages** - Internal employee messaging
- ✅ **Certification Reminders** - Upcoming certification renewals
- ✅ **User Profile** - Your role and preferences
- ✅ **Dashboard Layout** - Your customized dashboard widgets
- ✅ **Notification Settings** - Your notification preferences

## How It Works

### Automatic Saving
- **No "Save" button needed** - All changes are saved automatically
- **Instant persistence** - Data is saved within milliseconds
- **No internet required** - Works completely offline
- **Browser-based storage** - Uses your browser's local storage

### Data Synchronization
- Changes take effect immediately
- No manual sync or refresh needed
- All data persists between sessions
- Survives browser restarts and device reboots

## Database Management Features

Access the **Database** tab (Admin/Manager roles) to:

### 1. Export Database Backup
Download a complete JSON backup of all your data:
- Click "Export Database Backup"
- Save the `.json` file to your computer
- Backup file includes timestamp and version
- Can be imported later to restore data

### 2. Import Database Backup
Restore data from a previous backup:
- Click "Import Database Backup"
- Select your backup `.json` file
- Confirm import (will replace current data)
- Page reloads automatically with restored data

### 3. Data Statistics
View real-time statistics about your data:
- Total work orders by status
- Employee counts and active staff
- Parts inventory status (in stock, low stock, out of stock)
- Forms and submissions
- Assets and areas

### 4. Data Integrity Validation
Check data quality and relationships:
- Click "Validate Data Integrity"
- System checks for:
  - Missing required fields
  - Broken relationships (e.g., work order references non-existent employee)
  - Invalid data values
  - Orphaned records
- Shows errors (critical issues) and warnings (potential issues)

### 5. Auto-Repair
Fix common data issues automatically:
- Click "Auto-Repair Issues" after validation
- System will:
  - Generate missing IDs
  - Fix negative quantities
  - Update incorrect status values
  - Set missing timestamps
- Shows list of actions taken

### 6. Clear All Data
⚠️ **Danger Zone** - Permanently delete all data:
- Requires confirmation
- Cannot be undone
- Consider exporting backup first
- Useful for starting fresh or testing

## Best Practices

### Regular Backups
1. **Export weekly backups** for important production data
2. **Store backups securely** on your computer or cloud storage
3. **Test backups** by importing to a test environment
4. **Label backups clearly** with date and purpose

### Data Integrity
1. **Run validation monthly** to catch issues early
2. **Review warnings** even if no errors found
3. **Use auto-repair** for automatic fixes
4. **Export before major changes** (bulk imports, etc.)

### Performance
1. **Browser storage limits** - Typically 5-10MB per domain
2. **Large datasets** - Consider periodic cleanup of old data
3. **Export old data** before archiving/deleting
4. **Keep active data** lean for best performance

## Data Structure

### Primary Keys
All records use unique IDs:
- Work Orders: `WO-YYYY-MM-DD-XXXXX`
- Employees: `EMP-XXXXX`
- Parts: `PART-XXXXX`
- Assets: `ASSET-XXXXX`
- Forms: `FORM-XXXXX`

### Relationships
Data is linked via ID references:
- Work orders → Employees (assigned technician)
- Work orders → Assets (equipment)
- Parts → Transactions (inventory history)
- Skills → Employees (skill matrix)
- Forms → Submissions (completed forms)

### Timestamps
All records include:
- `created_at` - When record was created
- `updated_at` - Last modification time
- Additional timestamps (e.g., `completed_at`, `submitted_at`)

## Import/Export Formats

### JSON Backup Format
```json
{
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "workOrders": [...],
    "employees": [...],
    "parts": [...],
    ...
  }
}
```

### Excel Import
The application supports Excel import for:
- Work Orders
- SOPs
- Spares & Labor

Use the "Import Excel/CSV" button in relevant tabs.

## Troubleshooting

### Data Not Persisting
1. Check browser storage is not disabled
2. Check browser storage quota not exceeded
3. Try exporting and re-importing data
4. Clear browser cache and reload

### Data Integrity Issues
1. Run "Validate Data Integrity"
2. Review errors and warnings
3. Use "Auto-Repair" for automatic fixes
4. Export backup before manual fixes

### Lost Data
1. Check if browser storage was cleared
2. Restore from most recent backup
3. Check if using private/incognito mode (data doesn't persist)
4. Verify same browser and profile used

### Import Fails
1. Verify backup file is valid JSON
2. Check file not corrupted
3. Ensure backup version compatible
4. Try smaller import if file very large

## Storage Limits

### Browser Limits
- **Chrome/Edge**: ~10MB per domain
- **Firefox**: ~10MB per domain
- **Safari**: ~5MB per domain

### Practical Limits
- **Work Orders**: ~5,000-10,000 records
- **Employees**: ~1,000-2,000 records
- **Parts**: ~2,000-5,000 records
- **Total Data**: ~5-10MB recommended

### What to Do If Limits Reached
1. Export old/completed work orders
2. Archive historical data externally
3. Delete unnecessary records
4. Consider data cleanup/archival strategy

## Security & Privacy

### Data Location
- Stored locally in your browser
- Never sent to external servers
- Not shared between users
- Tied to your browser profile

### Data Access
- Only accessible from your browser
- Protected by browser security
- No cloud synchronization
- No external backups (you must export)

### Multi-User
- Each user has separate data store
- No built-in sharing or collaboration
- Export/import to share datasets
- Consider using same browser profile for team

## Advanced Features

### Database API
For developers, direct access via `spark.kv` API:

```typescript
// Get data
const data = await spark.kv.get<Type[]>('key-name')

// Set data
await spark.kv.set('key-name', data)

// Delete data
await spark.kv.delete('key-name')

// List all keys
const keys = await spark.kv.keys()
```

### Backup Automation
Export backups programmatically:

```typescript
import { exportDatabase, downloadSnapshot } from '@/lib/database-manager'

const snapshot = await exportDatabase()
downloadSnapshot(snapshot)
```

## Support

### Getting Help
1. Check this guide first
2. Review Database Statistics for data overview
3. Run Data Integrity validation
4. Export backup before major changes
5. Contact support with backup file if issues persist

### Reporting Issues
Include in your report:
- Database statistics
- Data integrity validation results
- Steps to reproduce
- Browser and version
- Backup file (if comfortable sharing)
