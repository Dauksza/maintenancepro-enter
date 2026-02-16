import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persistent state management with localStorage fallback
 * Provides seamless data persistence across sessions
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or use initial value
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Hook to remember the last active tab
 */
export function useLastActiveTab(defaultTab: string = 'dashboard') {
  return usePersistentState<string>('maintenancepro-last-tab', defaultTab);
}

/**
 * Hook to persist filter preferences
 */
export function useFilterPreferences<T extends Record<string, any>>(
  key: string,
  defaults: T
): [T, (filters: Partial<T>) => void] {
  const [filters, setFilters] = usePersistentState<T>(
    `maintenancepro-filters-${key}`,
    defaults
  );

  const updateFilters = useCallback(
    (newFilters: Partial<T>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [setFilters]
  );

  return [filters, updateFilters];
}

/**
 * Hook to persist scroll position
 */
export function useScrollPosition(key: string) {
  const [position, setPosition] = usePersistentState<number>(
    `maintenancepro-scroll-${key}`,
    0
  );

  const saveScrollPosition = useCallback(() => {
    const scrollY = window.scrollY;
    setPosition(scrollY);
  }, [setPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (position > 0) {
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  }, [position]);

  return { saveScrollPosition, restoreScrollPosition };
}

/**
 * Hook to persist sort preferences
 */
export function useSortPreferences(key: string, defaultSort: { field: string; direction: 'asc' | 'desc' }) {
  return usePersistentState<{ field: string; direction: 'asc' | 'desc' }>(
    `maintenancepro-sort-${key}`,
    defaultSort
  );
}
