import { usePersistentState } from '@/hooks/usePersistentState'

export function useKV<T>(key: string, initialValue: T) {
  return usePersistentState<T>(`spark-kv:${key}`, initialValue)
}
