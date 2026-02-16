/**
 * Undo/Redo Controls Component
 * 
 * Provides UI controls for undo/redo functionality
 */

import React, { useState, useEffect } from 'react'
import { Undo2, Redo2, RotateCcw, Info } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { undoRedoManager, UndoableAction } from '../lib/undo-redo-manager'
import { formatDistanceToNow } from 'date-fns'

interface UndoRedoControlsProps {
  className?: string
  showHistory?: boolean
}

export function UndoRedoControls({ className = '', showHistory = false }: UndoRedoControlsProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [undoDescription, setUndoDescription] = useState<string | null>(null)
  const [redoDescription, setRedoDescription] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([])

  useEffect(() => {
    const updateState = () => {
      setCanUndo(undoRedoManager.canUndo())
      setCanRedo(undoRedoManager.canRedo())
      setUndoDescription(undoRedoManager.getUndoDescription())
      setRedoDescription(undoRedoManager.getRedoDescription())
      setUndoStack(undoRedoManager.getUndoStack())
      setRedoStack(undoRedoManager.getRedoStack())
    }

    updateState()
    const unsubscribe = undoRedoManager.subscribe(updateState)

    return () => unsubscribe()
  }, [])

  const handleUndo = () => {
    const action = undoRedoManager.undo()
    if (action) {
      // You would dispatch the undo action to your state management here
      // For now, we just show the action was undone
      console.log('Undone:', action)
    }
  }

  const handleRedo = () => {
    const action = undoRedoManager.redo()
    if (action) {
      // You would dispatch the redo action to your state management here
      console.log('Redone:', action)
    }
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-8 px-2"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {undoDescription ? `Undo: ${undoDescription}` : 'Nothing to undo'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-8 px-2"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {redoDescription ? `Redo: ${redoDescription}` : 'Nothing to redo'}
          </TooltipContent>
        </Tooltip>

        {showHistory && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View undo history</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Action History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {undoStack.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Undo2 className="h-4 w-4" />
                  Undo Stack ({undoStack.length})
                </h3>
                <ScrollArea className="h-[250px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {undoStack.slice().reverse().map((action, index) => (
                      <ActionItem key={action.action_id} action={action} index={undoStack.length - index} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {redoStack.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Redo2 className="h-4 w-4" />
                  Redo Stack ({redoStack.length})
                </h3>
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {redoStack.slice().reverse().map((action, index) => (
                      <ActionItem key={action.action_id} action={action} index={redoStack.length - index} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {undoStack.length === 0 && redoStack.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Info className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No actions in history</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

function ActionItem({ action, index }: { action: UndoableAction; index: number }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0">
        <Badge variant="secondary" className="text-xs">
          #{index}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{action.description}</div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="capitalize">{action.action_type}</span> • {action.entity_type}
          {action.performed_by && ` • ${action.performed_by}`}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}

// Keyboard shortcut hook for undo/redo
export function useUndoRedoShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (undoRedoManager.canUndo()) {
          undoRedoManager.undo()
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        if (undoRedoManager.canRedo()) {
          undoRedoManager.redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
