/**
 * Version History System
 * 
 * Provides comprehensive versioning and change tracking for all entities
 * in the CMMS system. Implements a snapshot-based approach with diff tracking.
 */

import { v4 as uuidv4 } from 'uuid'

// Generic version history types
export interface VersionSnapshot<T = any> {
  version_id: string
  entity_type: EntityType
  entity_id: string
  version_number: number
  snapshot: T
  changes: FieldChange[]
  changed_by: string | null
  change_reason: string | null
  timestamp: string
  parent_version_id: string | null
  is_draft: boolean
  is_published: boolean
  tags: string[]
}

export interface FieldChange {
  field: string
  old_value: any
  new_value: any
  change_type: 'created' | 'updated' | 'deleted'
}

export type EntityType =
  | 'work_order'
  | 'asset'
  | 'employee'
  | 'sop'
  | 'skill'
  | 'area'
  | 'part'
  | 'schedule'
  | 'form'
  | 'message'

export interface VersionHistoryMetadata {
  entity_type: EntityType
  entity_id: string
  total_versions: number
  first_version_id: string
  latest_version_id: string
  created_at: string
  last_updated_at: string
  has_draft: boolean
}

export interface ConflictResolution {
  conflict_id: string
  entity_type: EntityType
  entity_id: string
  local_version_id: string
  remote_version_id: string
  local_changes: FieldChange[]
  remote_changes: FieldChange[]
  conflicting_fields: string[]
  resolution_strategy: 'manual' | 'local_wins' | 'remote_wins' | 'merge'
  resolved_snapshot: any
  resolved_by: string | null
  resolved_at: string | null
  status: 'pending' | 'resolved'
}

/**
 * Version History Manager
 * Handles creation, retrieval, and comparison of entity versions
 */
export class VersionHistoryManager {
  private static instance: VersionHistoryManager
  private versionStore: Map<string, VersionSnapshot[]> = new Map()
  private metadataStore: Map<string, VersionHistoryMetadata> = new Map()
  private conflictStore: Map<string, ConflictResolution> = new Map()

  private constructor() {}

  static getInstance(): VersionHistoryManager {
    if (!VersionHistoryManager.instance) {
      VersionHistoryManager.instance = new VersionHistoryManager()
    }
    return VersionHistoryManager.instance
  }

  /**
   * Create a new version snapshot
   */
  createVersion<T>(
    entityType: EntityType,
    entityId: string,
    currentSnapshot: T,
    previousSnapshot: T | null,
    changedBy: string | null,
    changeReason: string | null = null,
    isDraft: boolean = false
  ): VersionSnapshot<T> {
    const key = `${entityType}:${entityId}`
    const versions = this.versionStore.get(key) || []
    
    // Calculate version number
    const versionNumber = versions.length + 1
    
    // Calculate changes
    const changes = previousSnapshot
      ? this.calculateChanges(previousSnapshot, currentSnapshot)
      : this.createInitialChanges(currentSnapshot)

    // Get parent version
    const parentVersionId = versions.length > 0 
      ? versions[versions.length - 1].version_id 
      : null

    // Create version snapshot
    const version: VersionSnapshot<T> = {
      version_id: uuidv4(),
      entity_type: entityType,
      entity_id: entityId,
      version_number: versionNumber,
      snapshot: this.deepClone(currentSnapshot),
      changes,
      changed_by: changedBy,
      change_reason: changeReason,
      timestamp: new Date().toISOString(),
      parent_version_id: parentVersionId,
      is_draft: isDraft,
      is_published: !isDraft,
      tags: [],
    }

    // Store version
    versions.push(version)
    this.versionStore.set(key, versions)

    // Update metadata
    this.updateMetadata(entityType, entityId, version)

    return version
  }

  /**
   * Get all versions for an entity
   */
  getVersionHistory(entityType: EntityType, entityId: string): VersionSnapshot[] {
    const key = `${entityType}:${entityId}`
    return this.versionStore.get(key) || []
  }

  /**
   * Get a specific version
   */
  getVersion(versionId: string): VersionSnapshot | null {
    for (const versions of this.versionStore.values()) {
      const version = versions.find(v => v.version_id === versionId)
      if (version) return version
    }
    return null
  }

  /**
   * Get the latest published version
   */
  getLatestVersion(entityType: EntityType, entityId: string): VersionSnapshot | null {
    const versions = this.getVersionHistory(entityType, entityId)
    const publishedVersions = versions.filter(v => v.is_published)
    return publishedVersions.length > 0 ? publishedVersions[publishedVersions.length - 1] : null
  }

  /**
   * Get the current draft version if it exists
   */
  getDraftVersion(entityType: EntityType, entityId: string): VersionSnapshot | null {
    const versions = this.getVersionHistory(entityType, entityId)
    return versions.find(v => v.is_draft) || null
  }

  /**
   * Publish a draft version
   */
  publishDraft(versionId: string, publishedBy: string): VersionSnapshot | null {
    const version = this.getVersion(versionId)
    if (!version || !version.is_draft) return null

    version.is_draft = false
    version.is_published = true
    version.changed_by = publishedBy
    version.timestamp = new Date().toISOString()

    return version
  }

  /**
   * Compare two versions and get differences
   */
  compareVersions(versionId1: string, versionId2: string): FieldChange[] {
    const version1 = this.getVersion(versionId1)
    const version2 = this.getVersion(versionId2)

    if (!version1 || !version2) return []

    return this.calculateChanges(version1.snapshot, version2.snapshot)
  }

  /**
   * Revert to a previous version
   */
  revertToVersion<T>(
    versionId: string,
    revertedBy: string,
    reason: string
  ): VersionSnapshot<T> | null {
    const version = this.getVersion(versionId)
    if (!version) return null

    // Create a new version with the old snapshot
    return this.createVersion(
      version.entity_type,
      version.entity_id,
      version.snapshot,
      this.getLatestVersion(version.entity_type, version.entity_id)?.snapshot || null,
      revertedBy,
      `Reverted to version ${version.version_number}: ${reason}`,
      false
    ) as VersionSnapshot<T>
  }

  /**
   * Get metadata for an entity's version history
   */
  getMetadata(entityType: EntityType, entityId: string): VersionHistoryMetadata | null {
    const key = `${entityType}:${entityId}`
    return this.metadataStore.get(key) || null
  }

  /**
   * Detect conflicts between two versions
   */
  detectConflict(
    entityType: EntityType,
    entityId: string,
    localVersionId: string,
    remoteVersionId: string
  ): ConflictResolution | null {
    const localVersion = this.getVersion(localVersionId)
    const remoteVersion = this.getVersion(remoteVersionId)

    if (!localVersion || !remoteVersion) return null

    // Get changes since common ancestor
    const localChanges = localVersion.changes
    const remoteChanges = remoteVersion.changes

    // Find conflicting fields
    const localFields = new Set(localChanges.map(c => c.field))
    const remoteFields = new Set(remoteChanges.map(c => c.field))
    const conflictingFields = Array.from(localFields).filter(f => remoteFields.has(f))

    if (conflictingFields.length === 0) {
      return null // No conflicts
    }

    const conflict: ConflictResolution = {
      conflict_id: uuidv4(),
      entity_type: entityType,
      entity_id: entityId,
      local_version_id: localVersionId,
      remote_version_id: remoteVersionId,
      local_changes: localChanges,
      remote_changes: remoteChanges,
      conflicting_fields,
      resolution_strategy: 'manual',
      resolved_snapshot: null,
      resolved_by: null,
      resolved_at: null,
      status: 'pending',
    }

    this.conflictStore.set(conflict.conflict_id, conflict)
    return conflict
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflictId: string,
    strategy: ConflictResolution['resolution_strategy'],
    resolvedBy: string,
    customSnapshot?: any
  ): ConflictResolution | null {
    const conflict = this.conflictStore.get(conflictId)
    if (!conflict) return null

    const localVersion = this.getVersion(conflict.local_version_id)
    const remoteVersion = this.getVersion(conflict.remote_version_id)

    if (!localVersion || !remoteVersion) return null

    let resolvedSnapshot: any

    switch (strategy) {
      case 'local_wins':
        resolvedSnapshot = localVersion.snapshot
        break
      case 'remote_wins':
        resolvedSnapshot = remoteVersion.snapshot
        break
      case 'merge':
        resolvedSnapshot = this.mergeSnapshots(
          localVersion.snapshot,
          remoteVersion.snapshot,
          conflict.conflicting_fields
        )
        break
      case 'manual':
        resolvedSnapshot = customSnapshot
        break
    }

    conflict.resolution_strategy = strategy
    conflict.resolved_snapshot = resolvedSnapshot
    conflict.resolved_by = resolvedBy
    conflict.resolved_at = new Date().toISOString()
    conflict.status = 'resolved'

    return conflict
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(entityType?: EntityType, entityId?: string): ConflictResolution[] {
    const conflicts = Array.from(this.conflictStore.values()).filter(
      c => c.status === 'pending'
    )

    if (entityType && entityId) {
      return conflicts.filter(
        c => c.entity_type === entityType && c.entity_id === entityId
      )
    }

    if (entityType) {
      return conflicts.filter(c => c.entity_type === entityType)
    }

    return conflicts
  }

  /**
   * Tag a version
   */
  tagVersion(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId)
    if (!version) return false

    if (!version.tags.includes(tag)) {
      version.tags.push(tag)
    }

    return true
  }

  /**
   * Get versions by tag
   */
  getVersionsByTag(tag: string): VersionSnapshot[] {
    const versions: VersionSnapshot[] = []
    for (const versionList of this.versionStore.values()) {
      versions.push(...versionList.filter(v => v.tags.includes(tag)))
    }
    return versions
  }

  // Private helper methods

  private calculateChanges(oldObj: any, newObj: any): FieldChange[] {
    const changes: FieldChange[] = []
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const oldValue = oldObj[key]
      const newValue = newObj[key]

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          old_value: oldValue,
          new_value: newValue,
          change_type: oldValue === undefined ? 'created' : 'updated',
        })
      }
    }

    return changes
  }

  private createInitialChanges(obj: any): FieldChange[] {
    return Object.keys(obj).map(key => ({
      field: key,
      old_value: null,
      new_value: obj[key],
      change_type: 'created' as const,
    }))
  }

  private updateMetadata(
    entityType: EntityType,
    entityId: string,
    version: VersionSnapshot
  ): void {
    const key = `${entityType}:${entityId}`
    let metadata = this.metadataStore.get(key)

    if (!metadata) {
      metadata = {
        entity_type: entityType,
        entity_id: entityId,
        total_versions: 1,
        first_version_id: version.version_id,
        latest_version_id: version.version_id,
        created_at: version.timestamp,
        last_updated_at: version.timestamp,
        has_draft: version.is_draft,
      }
    } else {
      metadata.total_versions++
      metadata.latest_version_id = version.version_id
      metadata.last_updated_at = version.timestamp
      metadata.has_draft = metadata.has_draft || version.is_draft
    }

    this.metadataStore.set(key, metadata)
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  private mergeSnapshots(local: any, remote: any, conflictingFields: string[]): any {
    const merged = { ...local }

    // For non-conflicting fields, use remote values if they're newer
    for (const key in remote) {
      if (!conflictingFields.includes(key)) {
        merged[key] = remote[key]
      }
    }

    // For conflicting fields, keep local values (can be customized)
    return merged
  }

  /**
   * Clear all version history (for testing or reset)
   */
  clearAll(): void {
    this.versionStore.clear()
    this.metadataStore.clear()
    this.conflictStore.clear()
  }

  /**
   * Export version history to JSON
   */
  exportVersionHistory(): string {
    return JSON.stringify({
      versions: Array.from(this.versionStore.entries()),
      metadata: Array.from(this.metadataStore.entries()),
      conflicts: Array.from(this.conflictStore.entries()),
    })
  }

  /**
   * Import version history from JSON
   */
  importVersionHistory(json: string): void {
    const data = JSON.parse(json)
    this.versionStore = new Map(data.versions)
    this.metadataStore = new Map(data.metadata)
    this.conflictStore = new Map(data.conflicts)
  }
}

// Export singleton instance
export const versionHistory = VersionHistoryManager.getInstance()
