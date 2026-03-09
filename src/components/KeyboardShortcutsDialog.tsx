import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard, Question } from '@phosphor-icons/react'

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Open search' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Tab'], description: 'Navigate between sections' },
      { keys: ['←', '→'], description: 'Switch tabs (when focused)' },
      { keys: ['Home'], description: 'Go to first tab' },
      { keys: ['End'], description: 'Go to last tab' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['⌘', 'N'], description: 'Create new work order' },
      { keys: ['⌘', 'I'], description: 'Import data' },
      { keys: ['⌘', 'E'], description: 'Export data' },
      { keys: ['Esc'], description: 'Close dialogs' },
    ]
  },
  {
    category: 'Accessibility',
    items: [
      { keys: ['Tab'], description: 'Navigate to next element' },
      { keys: ['Shift', 'Tab'], description: 'Navigate to previous element' },
      { keys: ['Enter'], description: 'Activate focused element' },
      { keys: ['Space'], description: 'Toggle checkboxes/buttons' },
    ]
  }
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={24} />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Learn keyboard shortcuts to navigate and use RoadPro more efficiently
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[500px] overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
          <Question size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> On Windows, use <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">Ctrl</kbd> instead of{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">⌘</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
