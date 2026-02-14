import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  ClockCounterClockwise,
  MagnifyingGlass,
  Trash,
  User
} from '@phosphor-icons/react'
import { getActivityLog, clearActivityLog, getActionIcon, getResourceTypeLabel } from '@/lib/activity-log'
import type { AuditLogEntry } from '@/lib/types'
import { toast } from 'sonner'

export function ActivityLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, resourceFilter, searchQuery])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const logData = await getActivityLog(200)
      setLogs(logData)
    } catch (error) {
      console.error('Failed to load activity log:', error)
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource_type === resourceFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log =>
        log.resource_name.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.user_name.toLowerCase().includes(query)
      )
    }

    setFilteredLogs(filtered)
  }

  const handleClearLog = async () => {
    if (!confirm('Are you sure you want to clear the entire activity log? This cannot be undone.')) {
      return
    }

    try {
      await clearActivityLog()
      setLogs([])
      toast.success('Activity log cleared')
    } catch (error) {
      console.error('Failed to clear log:', error)
      toast.error('Failed to clear activity log')
    }
  }

  const resourceTypes = Array.from(new Set(logs.map(log => log.resource_type)))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClockCounterClockwise size={20} />
              Activity Log
            </CardTitle>
            <CardDescription>
              View all system activity and changes ({logs.length} entries)
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearLog}
            disabled={logs.length === 0}
          >
            <Trash size={16} />
            Clear Log
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {resourceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getResourceTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activity log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClockCounterClockwise size={48} className="mx-auto mb-4 opacity-50" />
            <p>No activity found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.log_id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {getResourceTypeLabel(log.resource_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {log.resource_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User size={14} />
                    <span>{log.user_name}</span>
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Changes:</div>
                      <div className="space-y-1">
                        {Object.entries(log.changes).map(([field, change]) => (
                          <div key={field} className="text-xs bg-muted/50 rounded p-2">
                            <span className="font-medium">{field}:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-red-600 line-through">
                                {String(change.old)}
                              </span>
                              <span>→</span>
                              <span className="text-green-600">
                                {String(change.new)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
