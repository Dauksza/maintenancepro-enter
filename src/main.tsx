import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { registerServiceWorker, setupInstallPrompt } from './lib/pwa-utils'
import { disablePWAForPreview, ensureManifestLink, initializeSparkRuntime, shouldRegisterPWA } from './lib/spark-runtime'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

initializeSparkRuntime()

if (shouldRegisterPWA()) {
  ensureManifestLink()
  registerServiceWorker()
  setupInstallPrompt()
} else {
  disablePWAForPreview().catch((error) => {
    console.warn('[PWA] Cleanup failed:', error)
  })
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
