/**
 * Audit Log Viewer Component
 * 
 * Displays comprehensive audit logs with filtering and search
 */

import React, { useState, useMemo } from 'react'
import { FileText, Filter, Download, Search, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { auditLogger, AuditLogEntry, AuditSearchFilters, AuditAction, AuditEntityType, AuditSeverity } from '../lib/audit-logger'
import { formatDistanceToNow } from 'date-fns'

export function AuditLogViewer() {
  const [searchFilters, setSearchFilters] = useState<AuditSearchFilters>({})
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const allLogs = useMemo(() => auditLogger.getAllLogs(), [])
  const filteredLogs = useMemo(() => auditLogger.search(searchFilters), [searchFilters, allLogs])
  const statistics = useMemo(() => auditLogger.getStatistics(), [allLogs])

  const handleExportLogs = () => {
    const json = auditLogger.exportLogs()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityBadge = (severity: AuditSeverity) => {
    const variants: Record<AuditSeverity, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'default',
      info: 'secondary',
    }
    return <Badge variant={variants[severity]}>{severity}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Complete history of all system actions and changes
          </p>
        </div>
        <Button onClick={handleExportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_entries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.success_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.average_duration_ms.toFixed(0)}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.entries_by_severity.critical || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchFilters.search_text || ''}
                  onChange={e => setSearchFilters({ ...searchFilters, search_text: e.target.value || undefined })}
                />
              </div>
            </div>

            <div>
              <Label>Severity</Label>
              <Select
                value={searchFilters.severities?.[0] || 'all'}
                onValueChange={value =>
                  setSearchFilters({
                    ...searchFilters,
                    severities: value === 'all' ? undefined : [value as AuditSeverity],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Entity Type</Label>
              <Select
                value={searchFilters.entity_types?.[0] || 'all'}
                onValueChange={value =>
                  setSearchFilters({
                    ...searchFilters,
                    entity_types: value === 'all' ? undefined : [value as AuditEntityType],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="work_order">Work Orders</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                  <SelectItem value="sop">SOPs</SelectItem>
                  <SelectItem value="part">Parts</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select
                value={searchFilters.actions?.[0] || 'all'}
                onValueChange={value =>
                  setSearchFilters({
                    ...searchFilters,
                    actions: value === 'all' ? undefined : [value as AuditAction],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="ASSIGN">Assign</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchFilters.search_text || searchFilters.severities || searchFilters.entity_types || searchFilters.actions) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {allLogs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>No audit logs found matching your filters</p>
                </div>
              ) : (
                filteredLogs.slice(0, 500).map(entry => (
                  <div
                    key={entry.log_id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(entry)
                      setDetailsOpen(true)
                    }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(entry.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(entry.severity)}
                        <Badge variant="outline">{entry.action}</Badge>
                        <Badge variant="secondary">{entry.entity_type}</Badge>
                        {!entry.success && <Badge variant="destructive">Failed</Badge>}
                      </div>
                      <div className="text-sm font-medium">{entry.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.user_name || 'System'} •{' '}
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <div className="mt-1">{selectedEntry.action}</div>
                </div>
                <div>
                  <Label>Entity Type</Label>
                  <div className="mt-1">{selectedEntry.entity_type}</div>
                </div>
                <div>
                  <Label>Entity ID</Label>
                  <div className="mt-1 font-mono text-xs">{selectedEntry.entity_id || 'N/A'}</div>
                </div>
                <div>
                  <Label>Entity Name</Label>
                  <div className="mt-1">{selectedEntry.entity_name || 'N/A'}</div>
                </div>
                <div>
                  <Label>User</Label>
                  <div className="mt-1">{selectedEntry.user_name || 'System'}</div>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <div className="mt-1">{new Date(selectedEntry.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedEntry.severity)}</div>
                </div>
                <div>
                  <Label>Success</Label>
                  <div className="mt-1">
                    {selectedEntry.success ? (
                      <Badge variant="default">Success</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedEntry.error_message && (
                <div>
                  <Label>Error Message</Label>
                  <div className="mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                    {selectedEntry.error_message}
                  </div>
                </div>
              )}

              {selectedEntry.changes.length > 0 && (
                <div>
                  <Label>Changes</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEntry.changes.map((change, index) => (
                      <div key={index} className="border rounded p-2 text-sm">
                        <div className="font-medium">{change.field_name}</div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <div className="text-xs text-muted-foreground">Old:</div>
                            <div className="bg-red-50 dark:bg-red-950/20 p-1 rounded text-xs">
                              {change.old_value !== null ? String(change.old_value) : '(none)'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">New:</div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-1 rounded text-xs">
                              {change.new_value !== null ? String(change.new_value) : '(none)'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="mt-2 bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
