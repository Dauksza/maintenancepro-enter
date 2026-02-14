# Work Order Notification System

## Overview
A comprehensive notification system for suggested work order assignments to technicians, integrated throughout the MaintenancePro CMMS application.

## Features

### 1. **Notification Types**
- **Assignment Suggestion**: When a technician is matched to a work order based on skills
- **Assignment Changed**: When a work order is reassigned to a different technician
- **Work Order Created**: When new work orders are created
- **Work Order Updated**: When work order details change
- **Work Order Overdue**: When assigned work orders become overdue
- **Work Order Completed**: When work orders are marked complete
- **Priority Escalated**: When work order priority is increased
- **Skill Match**: When a technician's skills match a new work order

### 2. **Notification Components**

#### NotificationCenter (Full-Featured)
- Comprehensive notification management
- Tabbed interface: All / Unread / Assignments
- Accept/Reject assignment suggestions
- View work order details
- Mark as read/dismissed
- Match score visualization
- Critical notification alerts

#### NotificationBell (Quick Access)
- Compact popover interface
- Badge showing unread count
- Quick accept/view actions
- Animated for critical notifications
- Shows top 5 recent notifications

#### NotificationToastManager (Real-time)
- Toast notifications for new alerts
- Priority-based styling (Critical/High/Medium/Low)
- Quick actions in toast
- Auto-dismiss timers

#### NotificationPreferences (Settings)
- Enable/disable notifications
- Toggle toast notifications
- Toggle sound alerts
- Configure notification types
- Set minimum match score threshold
- Auto-accept high-match assignments
- Customizable auto-accept threshold

### 3. **Smart Matching & Scoring**

#### Match Score Calculation
- **Required Skills**: 40 points (matched vs. total required)
- **Skill Level Bonus**: Up to 10 points per skill
  - Expert: 10 points
  - Advanced: 7.5 points
  - Intermediate: 5 points
  - Beginner: 2.5 points
- **Certification Bonus**: 5 points per certified skill
- **Optional Skills**: 3 points each
- **Employee Status**: 
  - Active: +10 points
  - On Leave: -50 points
  - Inactive: -100 points
- **Workload Factor**:
  - <50% capacity: +15 points
  - <75% capacity: +10 points
  - <100% capacity: +5 points
  - Overloaded: -20 points
- **Certification Status**:
  - All Valid: +5 points
  - Some Expiring: -5 points
  - Expired: -30 points
- **Priority Multiplier**: Applied based on work order priority

#### Notification Generation
Notifications are automatically generated when:
- New work orders are created
- Auto-scheduler assigns work orders
- Work orders are manually reassigned
- Work orders become overdue
- Priority is escalated

### 4. **Notification States**
- **Unread**: New notification, not yet viewed
- **Read**: Notification has been viewed
- **Accepted**: Technician accepted the assignment
- **Rejected**: Technician declined the assignment
- **Dismissed**: Notification dismissed without action

### 5. **Visual Features**

#### Priority Colors
- **Critical**: Red background with pulse animation
- **High**: Orange background
- **Medium**: Blue background
- **Low**: Gray background

#### Match Score Display
- Visual progress bar
- Percentage display
- Color-coded:
  - ≥80%: Green (Excellent match)
  - ≥60%: Blue (Good match)
  - <60%: Yellow (Adequate match)

#### Icons & Emojis
Each notification type has a unique icon for quick identification:
- 💡 Assignment Suggestion
- 🔄 Assignment Changed
- ✨ Work Order Created
- 📝 Work Order Updated
- ⚠️ Work Order Overdue
- ✅ Work Order Completed
- 🔴 Priority Escalated
- 🎯 Skill Match

### 6. **User Actions**

#### For Assignment Suggestions
- **Accept**: Assigns the work order to the technician
- **Decline**: Marks notification as rejected
- **View**: Opens work order details

#### For Other Notifications
- **View**: Opens related work order
- **Dismiss**: Removes notification from view
- **Mark as Read**: Updates notification status

### 7. **Preferences & Configuration**

Users can customize:
- Enable/disable entire notification system
- Show/hide toast notifications
- Enable/disable sound alerts
- Choose which notification types to receive
- Set minimum match score (0-100%)
- Enable auto-accept for high matches (80-100%)

### 8. **Data Persistence**

All notification data is persisted using the Spark KV store:
- `work-order-notifications`: Array of all notifications
- `notification-preferences`: User preferences object

### 9. **Integration Points**

The notification system integrates with:
- **Work Order Creation**: Auto-generates notifications for matched technicians
- **Auto-Scheduler**: Notifies assigned technicians after scheduling
- **Skill Matcher**: Uses skill matching algorithm to determine best matches
- **Employee Management**: Considers availability, certifications, and workload
- **Work Order Detail**: Can view related work orders from notifications

### 10. **API Functions**

#### Notification Utils (`/lib/notification-utils.ts`)
- `generateAssignmentSuggestionNotification()`: Create assignment suggestion
- `generateAssignmentChangeNotification()`: Create reassignment notification
- `generateWorkOrderCreatedNotification()`: Create new work order notification
- `generateOverdueNotification()`: Create overdue alert
- `generatePriorityEscalatedNotification()`: Create priority change alert
- `generateSkillMatchNotifications()`: Batch create skill-matched notifications
- `generateAutoSchedulerNotifications()`: Batch create scheduler notifications
- `markNotificationAsRead()`: Update notification to read state
- `markNotificationAsAccepted()`: Update notification to accepted state
- `markNotificationAsRejected()`: Update notification to rejected state
- `markNotificationAsDismissed()`: Update notification to dismissed state
- `getNotificationsByEmployee()`: Filter notifications for specific employee
- `getUnreadNotificationCount()`: Count unread notifications
- `getCriticalNotifications()`: Get all critical priority notifications
- `groupNotificationsByType()`: Group notifications by type

## Usage Example

```typescript
// Create a new work order and notify matched technicians
const newWorkOrder = createWorkOrder(...)
handleCreateWorkOrder(newWorkOrder)
// Automatically generates notifications for top 3 matched technicians

// Accept an assignment
handleAcceptAssignment(notificationId, workOrderId)
// Updates notification status and assigns work order

// Configure preferences
const preferences: NotificationPreferences = {
  enabled: true,
  showToasts: true,
  notifyOnAssignmentSuggestions: true,
  minimumMatchScore: 70,
  autoAcceptHighMatchScore: true,
  autoAcceptThreshold: 90
}
setNotificationPreferences(preferences)
```

## Future Enhancements

Potential future additions:
- Email notifications
- SMS notifications
- Push notifications (mobile)
- Notification scheduling/quiet hours
- Team-based notifications
- Escalation workflows
- Notification analytics dashboard
- Custom notification rules builder
