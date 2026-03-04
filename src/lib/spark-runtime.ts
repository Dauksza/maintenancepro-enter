type SparkKV = {
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
  keys: () => Promise<string[]>
}

function kvStorageKey(key: string) {
  return `spark-kv:${key}`
}

function createLocalKV(): SparkKV {
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const raw = localStorage.getItem(kvStorageKey(key))
      if (raw == null) {
        return undefined
      }
      return JSON.parse(raw) as T
    },
    async set<T>(key: string, value: T): Promise<void> {
      localStorage.setItem(kvStorageKey(key), JSON.stringify(value))
    },
    async delete(key: string): Promise<void> {
      localStorage.removeItem(kvStorageKey(key))
    },
    async keys(): Promise<string[]> {
      const keys: string[] = []
      for (let index = 0; index < localStorage.length; index += 1) {
        const localKey = localStorage.key(index)
        if (!localKey || !localKey.startsWith('spark-kv:')) {
          continue
        }
        keys.push(localKey.replace(/^spark-kv:/, ''))
      }
      return keys
    }
  }
}

export function isCodespacesPreviewHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.app.github.dev')
}

export function shouldUseLocalSparkFallback(): boolean {
  const preferRemoteSpark = import.meta.env.VITE_USE_REMOTE_SPARK === 'true'
  if (preferRemoteSpark) {
    return false
  }
  return import.meta.env.DEV || isCodespacesPreviewHost()
}

export function initializeSparkRuntime() {
  if (!shouldUseLocalSparkFallback()) {
    return
  }

  const globalRef = globalThis as typeof globalThis & {
    spark?: {
      kv: SparkKV
      user: () => Promise<null>
    }
  }

  globalRef.spark = {
    kv: createLocalKV(),
    user: async () => null
  }
}

export function shouldRegisterPWA(): boolean {
  return !isCodespacesPreviewHost()
}

export function ensureManifestLink() {
  if (!shouldRegisterPWA()) {
    return
  }

  const existingManifest = document.querySelector('link[rel="manifest"]')
  if (existingManifest) {
    return
  }

  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = '/manifest.json'
  document.head.appendChild(link)
}

export async function disablePWAForPreview() {
  const manifest = document.querySelector('link[rel="manifest"]')
  if (manifest) {
    manifest.remove()
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}
