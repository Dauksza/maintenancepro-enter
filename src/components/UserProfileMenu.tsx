import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  GearSix, 
  SignOut, 
  ShieldCheck,
  UserCircle,
  CompassTool
} from '@phosphor-icons/react'
import type { UserProfile, UserRole } from '@/lib/types'
import { DEFAULT_USER_PREFERENCES } from '@/lib/permissions'
import { ViewProfileDialog } from '@/components/ViewProfileDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { toast } from 'sonner'

interface UserProfileMenuProps {
  onRoleChange?: (role: UserRole) => void
  onOpenImport?: () => void
  onExportData?: () => void
  onRestartTour?: () => void
}

export function UserProfileMenu({ onRoleChange, onOpenImport, onExportData, onRestartTour }: UserProfileMenuProps) {
  const [userProfile, setUserProfile] = useKV<UserProfile | null>('user-profile', null)
  const [githubUser, setGithubUser] = useState<any>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await window.spark.user()
        if (!user) return
        
        setGithubUser(user)
        
        if (!userProfile) {
          const newProfile: UserProfile = {
            user_id: String(user.id),
            employee_id: null,
            username: user.login,
            display_name: user.login,
            email: user.email || '',
            role: user.isOwner ? 'Admin' : 'Technician',
            avatar_url: user.avatarUrl,
            is_owner: user.isOwner,
            preferences: DEFAULT_USER_PREFERENCES,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login_at: new Date().toISOString()
          }
          setUserProfile(newProfile)
        } else {
          setUserProfile((current) => {
            if (!current) return null
            return {
              ...current,
              last_login_at: new Date().toISOString(),
              avatar_url: user.avatarUrl,
              is_owner: user.isOwner
            }
          })
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    loadUser()
  }, [])

  const handleRoleChange = (newRole: UserRole) => {
    setUserProfile((current) => {
      if (!current) return null
      return {
        ...current,
        role: newRole,
        updated_at: new Date().toISOString()
      }
    })
    onRoleChange?.(newRole)
  }

  const handleSignOut = () => {
    setUserProfile(null)
    toast.success('Signed out successfully')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-red-600'
      case 'Manager': return 'bg-blue-600'
      case 'Supervisor': return 'bg-purple-600'
      case 'Technician': return 'bg-green-600'
      case 'Viewer': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  if (!userProfile) return null

  const initials = userProfile.display_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-tour="user-menu">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={userProfile.avatar_url} alt={userProfile.display_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userProfile.avatar_url} alt={userProfile.display_name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none mb-1">
                  {userProfile.display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>
            <Badge className="bg-green-600">
              Full Access
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="gap-2" onClick={() => setProfileDialogOpen(true)}>
          <UserCircle size={16} />
          View Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem className="gap-2" onClick={() => setSettingsDialogOpen(true)}>
          <GearSix size={16} />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-2" onClick={onRestartTour}>
          <CompassTool size={16} />
          Restart Tour
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => setSignOutDialogOpen(true)}
        >
          <SignOut size={16} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ViewProfileDialog 
        open={profileDialogOpen} 
        onClose={() => setProfileDialogOpen(false)} 
      />

      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        onOpenImport={onOpenImport}
        onExportData={onExportData}
      />

      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? Your data is saved and will be available when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  )
}
