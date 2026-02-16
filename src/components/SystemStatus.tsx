import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { WifiHigh, WifiSlash, Cloud, CloudSlash } from '@phosphor-icons/react'

interface SystemStatusProps {
  className?: string
}

export function SystemStatus({ className = '' }: SystemStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced')

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('syncing')
      // Simulate sync
      setTimeout(() => {
        setSyncStatus('synced')
        setLastSync(new Date())
      }, 1500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Simulate periodic sync checks
    const syncInterval = setInterval(() => {
      if (isOnline) {
        setSyncStatus('syncing')
        setTimeout(() => {
          setSyncStatus('synced')
          setLastSync(new Date())
        }, 500)
      }
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [isOnline])

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (syncStatus === 'syncing') return 'Syncing...'
    return 'All systems operational'
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    if (syncStatus === 'syncing') return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudSlash className="h-3.5 w-3.5" weight="fill" />
    }
    if (syncStatus === 'syncing') {
      return <Cloud className="h-3.5 w-3.5 animate-pulse" weight="fill" />
    }
    return <Cloud className="h-3.5 w-3.5" weight="fill" />
  }

  const getLastSyncText = () => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return 'Over a day ago'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="relative">
            {getStatusIcon()}
            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${
              !isOnline ? 'bg-red-500' : 
              syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 
              'bg-green-500'
            }`} />
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <WifiHigh className="h-4 w-4 text-green-500" weight="fill" />
            ) : (
              <WifiSlash className="h-4 w-4 text-red-500" weight="fill" />
            )}
            <span className="font-semibold">
              {isOnline ? 'Connected' : 'No Internet Connection'}
            </span>
          </div>
          {isOnline && (
            <div className="text-xs text-muted-foreground">
              <div>Last synced: {getLastSyncText()}</div>
              <div className="mt-1">
                {syncStatus === 'syncing' ? 'Syncing data...' : 'Data is up to date'}
              </div>
            </div>
          )}
          {!isOnline && (
            <div className="text-xs text-muted-foreground">
              Working offline. Changes will sync when connection is restored.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function LiveActivityIndicator({ className = '' }: { className?: string }) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="relative">
            <div className={`h-2 w-2 rounded-full bg-green-500 ${pulse ? 'animate-ping absolute' : ''}`} />
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Real-time updates active</p>
      </TooltipContent>
    </Tooltip>
  )
}
