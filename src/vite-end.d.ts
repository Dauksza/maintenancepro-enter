/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string
interface SparkKV {
  keys: () => Promise<string[]>
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
}

interface Window {
  spark: {
    kv: SparkKV
    user: () => Promise<{ login: string; email: string; id: number; avatarUrl: string; isOwner: boolean } | null>
    llm: (prompt: string, options?: Record<string, unknown>) => Promise<string>
    llmPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<string>
  }
}
