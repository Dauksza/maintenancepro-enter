/**
 * Undo/Redo Manager
 * 
 * Provides comprehensive undo/redo functionality for all CMMS operations
 */

export interface UndoableAction {
  action_id: string
  action_type: string
  entity_type: string
  entity_id: string
  description: string
  timestamp: string
  undo_data: any
  redo_data: any
  performed_by: string | null
}

export interface UndoRedoState {
  undo_stack: UndoableAction[]
  redo_stack: UndoableAction[]
  max_stack_size: number
}

/**
 * Undo/Redo Manager
 */
export class UndoRedoManager {
  private static instance: UndoRedoManager
  private undoStack: UndoableAction[] = []
  private redoStack: UndoableAction[] = []
  private maxStackSize: number = 100
  private listeners: Set<() => void> = new Set()

  private constructor() {}

  static getInstance(): UndoRedoManager {
    if (!UndoRedoManager.instance) {
      UndoRedoManager.instance = new UndoRedoManager()
    }
    return UndoRedoManager.instance
  }

  /**
   * Record an undoable action
   */
  recordAction(
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    undoData: any,
    redoData: any,
    performedBy: string | null = null
  ): void {
    const action: UndoableAction = {
      action_id: crypto.randomUUID(),
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      description,
      timestamp: new Date().toISOString(),
      undo_data: this.deepClone(undoData),
      redo_data: this.deepClone(redoData),
      performed_by: performedBy,
    }

    // Add to undo stack
    this.undoStack.push(action)

    // Clear redo stack when new action is recorded
    this.redoStack = []

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }

    this.notifyListeners()
  }

  /**
   * Undo the last action
   */
  undo(): UndoableAction | null {
    const action = this.undoStack.pop()
    if (!action) return null

    // Move to redo stack
    this.redoStack.push(action)

    this.notifyListeners()
    return action
  }

  /**
   * Redo the last undone action
   */
  redo(): UndoableAction | null {
    const action = this.redoStack.pop()
    if (!action) return null

    // Move back to undo stack
    this.undoStack.push(action)

    this.notifyListeners()
    return action
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Get undo stack
   */
  getUndoStack(): UndoableAction[] {
    return [...this.undoStack]
  }

  /**
   * Get redo stack
   */
  getRedoStack(): UndoableAction[] {
    return [...this.redoStack]
  }

  /**
   * Get last action description for UI
   */
  getUndoDescription(): string | null {
    const action = this.undoStack[this.undoStack.length - 1]
    return action ? action.description : null
  }

  /**
   * Get last redo action description for UI
   */
  getRedoDescription(): string | null {
    const action = this.redoStack[this.redoStack.length - 1]
    return action ? action.description : null
  }

  /**
   * Clear all undo/redo history
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notifyListeners()
  }

  /**
   * Clear redo stack only
   */
  clearRedoStack(): void {
    this.redoStack = []
    this.notifyListeners()
  }

  /**
   * Set max stack size
   */
  setMaxStackSize(size: number): void {
    this.maxStackSize = Math.max(1, size)
    
    // Trim stacks if needed
    while (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }
    while (this.redoStack.length > this.maxStackSize) {
      this.redoStack.shift()
    }
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current state for persistence
   */
  getState(): UndoRedoState {
    return {
      undo_stack: [...this.undoStack],
      redo_stack: [...this.redoStack],
      max_stack_size: this.maxStackSize,
    }
  }

  /**
   * Restore state from persistence
   */
  setState(state: UndoRedoState): void {
    this.undoStack = [...state.undo_stack]
    this.redoStack = [...state.redo_stack]
    this.maxStackSize = state.max_stack_size
    this.notifyListeners()
  }

  /**
   * Export history to JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.getState())
  }

  /**
   * Import history from JSON
   */
  importHistory(json: string): void {
    const state = JSON.parse(json)
    this.setState(state)
  }

  // Private helpers

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Export singleton instance
export const undoRedoManager = UndoRedoManager.getInstance()

// Helper functions for common operations

export function recordCreate(
  entityType: string,
  entity: any,
  performedBy: string | null = null
): void {
  undoRedoManager.recordAction(
    'CREATE',
    entityType,
    entity.id || entity.work_order_id || entity.asset_id || entity.employee_id,
    `Create ${entityType}`,
    { action: 'delete', entity_id: entity.id },
    { action: 'create', entity },
    performedBy
  )
}

export function recordUpdate(
  entityType: string,
  entityId: string,
  oldState: any,
  newState: any,
  performedBy: string | null = null
): void {
  undoRedoManager.recordAction(
    'UPDATE',
    entityType,
    entityId,
    `Update ${entityType}`,
    { action: 'update', entity: oldState },
    { action: 'update', entity: newState },
    performedBy
  )
}

export function recordDelete(
  entityType: string,
  entity: any,
  performedBy: string | null = null
): void {
  undoRedoManager.recordAction(
    'DELETE',
    entityType,
    entity.id || entity.work_order_id || entity.asset_id || entity.employee_id,
    `Delete ${entityType}`,
    { action: 'create', entity },
    { action: 'delete', entity_id: entity.id },
    performedBy
  )
}
