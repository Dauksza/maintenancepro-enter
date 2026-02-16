/**
 * Version History Viewer Component
 * 
 * Displays version history for any entity with diff viewing and revert capability
 */

import React, { useState, useMemo } from 'react'
import { History, RotateCcw, Eye, Tag, GitBranch, FileText } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner'
import { versionHistory, VersionSnapshot, EntityType, FieldChange } from '../lib/version-history'
import { formatDistanceToNow } from 'date-fns'

interface VersionHistoryViewerProps {
  entityType: EntityType
  entityId: string
  entityName: string
  isOpen: boolean
  onClose: () => void
  onRevert?: (versionId: string) => void
}

export function VersionHistoryViewer({
  entityType,
  entityId,
  entityName,
  isOpen,
  onClose,
  onRevert,
}: VersionHistoryViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null)
  const [compareVersion, setCompareVersion] = useState<VersionSnapshot | null>(null)

  const versions = useMemo(() => {
    return versionHistory.getVersionHistory(entityType, entityId)
  }, [entityType, entityId, isOpen])

  const metadata = useMemo(() => {
    return versionHistory.getMetadata(entityType, entityId)
  }, [entityType, entityId, isOpen])

  const handleRevert = (version: VersionSnapshot) => {
    if (!onRevert) {
      toast.error('Revert functionality not available')
      return
    }

    const reverted = versionHistory.revertToVersion(
      version.version_id,
      'CURRENT_USER',
      `Reverted to version ${version.version_number}`
    )

    if (reverted) {
      onRevert(version.version_id)
      toast.success(`Reverted to version ${version.version_number}`)
      onClose()
    } else {
      toast.error('Failed to revert to selected version')
    }
  }

  const handleCompare = (v1: VersionSnapshot, v2: VersionSnapshot) => {
    setSelectedVersion(v1)
    setCompareVersion(v2)
  }

  const getDiff = useMemo(() => {
    if (!selectedVersion || !compareVersion) return []
    return versionHistory.compareVersions(selectedVersion.version_id, compareVersion.version_id)
  }, [selectedVersion, compareVersion])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History: {entityName}
          </DialogTitle>
        </DialogHeader>

        {metadata && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Versions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metadata.total_versions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{new Date(metadata.created_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{new Date(metadata.last_updated_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {metadata.has_draft ? (
                  <Badge variant="secondary">Has Draft</Badge>
                ) : (
                  <Badge variant="default">Published</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="timeline" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="flex-1">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {versions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>No version history available</p>
                  </div>
                ) : (
                  versions.slice().reverse().map((version, index) => (
                    <Card key={version.version_id} className="relative">
                      {index < versions.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="relative z-10">
                              <div className="rounded-full bg-primary p-2">
                                <GitBranch className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                Version {version.version_number}
                                {version.is_draft && (
                                  <Badge variant="secondary" className="ml-2">Draft</Badge>
                                )}
                                {version.is_published && index === 0 && (
                                  <Badge variant="default" className="ml-2">Latest</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {version.changed_by || 'System'} • {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })}
                              </CardDescription>
                              {version.change_reason && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {version.change_reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVersion(version)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {onRevert && index > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevert(version)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Revert
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {version.changes.length > 0 && (
                        <CardContent>
                          <div className="text-sm space-y-1">
                            <p className="font-medium">{version.changes.length} change(s):</p>
                            {version.changes.slice(0, 3).map((change, i) => (
                              <div key={i} className="text-muted-foreground">
                                • {change.field}: {change.change_type}
                              </div>
                            ))}
                            {version.changes.length > 3 && (
                              <div className="text-muted-foreground">
                                • And {version.changes.length - 3} more...
                              </div>
                            )}
                          </div>
                          {version.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {version.tags.map(tag => (
                                <Badge key={tag} variant="outline">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare" className="flex-1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Select Version 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {versions.map(version => (
                        <Button
                          key={version.version_id}
                          variant={selectedVersion?.version_id === version.version_id ? 'default' : 'ghost'}
                          className="w-full justify-start mb-1"
                          onClick={() => setSelectedVersion(version)}
                        >
                          Version {version.version_number}
                        </Button>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Select Version 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {versions.map(version => (
                        <Button
                          key={version.version_id}
                          variant={compareVersion?.version_id === version.version_id ? 'default' : 'ghost'}
                          className="w-full justify-start mb-1"
                          onClick={() => setCompareVersion(version)}
                        >
                          Version {version.version_number}
                        </Button>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {selectedVersion && compareVersion && (
                <Card>
                  <CardHeader>
                    <CardTitle>Differences</CardTitle>
                    <CardDescription>
                      Comparing version {selectedVersion.version_number} with version {compareVersion.version_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      {getDiff.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No differences found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getDiff.map((change, index) => (
                            <DiffRow key={index} change={change} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="flex-1">
            {selectedVersion ? (
              <Card>
                <CardHeader>
                  <CardTitle>Version {selectedVersion.version_number} Details</CardTitle>
                  <CardDescription>
                    {new Date(selectedVersion.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Metadata</h4>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Changed by:</span> {selectedVersion.changed_by || 'System'}</div>
                          <div><span className="font-medium">Status:</span> {selectedVersion.is_draft ? 'Draft' : 'Published'}</div>
                          {selectedVersion.change_reason && (
                            <div><span className="font-medium">Reason:</span> {selectedVersion.change_reason}</div>
                          )}
                        </div>
                      </div>

                      {selectedVersion.changes.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Changes</h4>
                          <div className="space-y-2">
                            {selectedVersion.changes.map((change, index) => (
                              <DiffRow key={index} change={change} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Snapshot</h4>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                          {JSON.stringify(selectedVersion.snapshot, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>Select a version from the timeline to view details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function DiffRow({ change }: { change: FieldChange }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{change.field}</span>
        <Badge variant="outline">{change.change_type}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">Old Value:</div>
          <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900">
            {change.old_value !== null && change.old_value !== undefined
              ? typeof change.old_value === 'object'
                ? JSON.stringify(change.old_value)
                : String(change.old_value)
              : '(none)'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">New Value:</div>
          <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-900">
            {change.new_value !== null && change.new_value !== undefined
              ? typeof change.new_value === 'object'
                ? JSON.stringify(change.new_value)
                : String(change.new_value)
              : '(none)'}
          </div>
        </div>
      </div>
    </div>
  )
}
