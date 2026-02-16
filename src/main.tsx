import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { registerServiceWorker, setupInstallPrompt } from './lib/pwa-utils'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Register PWA service worker
registerServiceWorker()
setupInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
