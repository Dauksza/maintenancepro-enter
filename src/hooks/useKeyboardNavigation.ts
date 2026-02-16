import { useEffect } from 'react';

/**
 * Hook to enable arrow key navigation for tabs
 * @param activeTab - The currently active tab
 * @param setActiveTab - Function to change the active tab
 * @param tabs - Array of available tab values
 * @param enabled - Whether keyboard navigation is enabled (default: true)
 */
export function useTabKeyboardNavigation(
  activeTab: string,
  setActiveTab: (tab: string) => void,
  tabs: string[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || tabs.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        setActiveTab(tabs[newIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, setActiveTab, tabs, enabled]);
}

/**
 * Hook to add global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for Cmd/Ctrl + key combinations
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      for (const [key, handler] of Object.entries(shortcuts)) {
        const [keyCombo, ...modifiers] = key.split('+').reverse();
        
        const needsModifier = modifiers.includes('cmd') || modifiers.includes('ctrl');
        const needsShift = modifiers.includes('shift');
        const needsAlt = modifiers.includes('alt');

        if (
          event.key.toLowerCase() === keyCombo.toLowerCase() &&
          (!needsModifier || modifier) &&
          (!needsShift || event.shiftKey) &&
          (!needsAlt || event.altKey)
        ) {
          event.preventDefault();
          handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
