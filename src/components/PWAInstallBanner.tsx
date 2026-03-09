import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { X, DownloadSimple, CheckCircle } from '@phosphor-icons/react'
import { promptInstall, isInstallable, isStandalone } from '@/lib/pwa-utils'

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (isStandalone()) {
      setIsInstalled(true)
      return
    }

    // Check if install prompt is available
    const checkInstallable = () => {
      if (isInstallable()) {
        setShowBanner(true)
      }
    }

    // Listen for install availability
    window.addEventListener('pwa-install-available', checkInstallable)
    
    // Listen for successful installation
    window.addEventListener('pwa-installed', () => {
      setIsInstalled(true)
      setShowBanner(false)
    })

    // Check on mount
    checkInstallable()

    return () => {
      window.removeEventListener('pwa-install-available', checkInstallable)
    }
  }, [])

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Store dismissal in localStorage to not show again for 7 days
    localStorage.setItem('maintenancepro-install-dismissed', Date.now().toString())
  }

  // Don't show if dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('maintenancepro-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setShowBanner(false)
      }
    }
  }, [])

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
        <Card className="p-4 bg-green-500/10 border-green-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" weight="fill" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              App installed successfully
            </span>
          </div>
        </Card>
      </div>
    )
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 backdrop-blur-sm shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DownloadSimple className="h-6 w-6 text-primary" weight="bold" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Install RoadPro</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Access offline and get a better experience
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
              >
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                Not Now
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  )
}
