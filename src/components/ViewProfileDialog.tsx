import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  UserCircle, 
  Envelope, 
  IdentificationBadge,
  CalendarBlank,
  ShieldCheck,
  LinkSimple,
  Pencil,
  Check,
  X
} from '@phosphor-icons/react'
import type { UserProfile, Employee } from '@/lib/types'
import { toast } from 'sonner'

interface ViewProfileDialogProps {
  open: boolean
  onClose: () => void
}

export function ViewProfileDialog({ open, onClose }: ViewProfileDialogProps) {
  const [userProfile, setUserProfile] = useKV<UserProfile | null>('user-profile', null)
  const [employees] = useKV<Employee[]>('employees', [])
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (open && userProfile) {
      setEditedProfile({ ...userProfile })
    }
  }, [open, userProfile])

  if (!userProfile) return null

  const linkedEmployee = employees?.find(e => e.employee_id === userProfile.employee_id)

  const handleSave = () => {
    if (!editedProfile) return
    
    setUserProfile(editedProfile)
    setIsEditing(false)
    toast.success('Profile updated successfully')
  }

  const handleCancel = () => {
    setEditedProfile(userProfile ? { ...userProfile } : null)
    setIsEditing(false)
  }

  const handleLinkEmployee = (employeeId: string) => {
    if (!editedProfile) return
    setEditedProfile({
      ...editedProfile,
      employee_id: employeeId || null
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-600'
      case 'Manager': return 'bg-blue-600'
      case 'Supervisor': return 'bg-purple-600'
      case 'Technician': return 'bg-green-600'
      case 'Viewer': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const initials = userProfile.display_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>User Profile</span>
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X size={16} />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check size={16} />
                  Save
                </Button>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            View and manage your user profile and preferences
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={userProfile.avatar_url} alt={userProfile.display_name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-2xl font-semibold">{userProfile.display_name}</h3>
                  <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                </div>
                <Badge className={getRoleColor(userProfile.role)}>
                  {userProfile.role}
                </Badge>
                {userProfile.is_owner && (
                  <Badge variant="outline" className="ml-2">
                    Owner
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <UserCircle size={18} />
                Basic Information
              </h4>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="display-name" className="flex items-center gap-2">
                    <IdentificationBadge size={16} />
                    Display Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="display-name"
                      value={editedProfile?.display_name || ''}
                      onChange={(e) => setEditedProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-muted rounded-md">{userProfile.display_name}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Envelope size={16} />
                    Email
                  </Label>
                  <div className="text-sm px-3 py-2 bg-muted rounded-md">{userProfile.email}</div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    Role
                  </Label>
                  <div className="text-sm px-3 py-2 bg-muted rounded-md">{userProfile.role}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <LinkSimple size={18} />
                Employee Linking
              </h4>

              <div className="grid gap-2">
                <Label htmlFor="linked-employee">Linked Employee Record</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile?.employee_id || 'none'}
                    onValueChange={handleLinkEmployee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No employee linked</SelectItem>
                      {(employees || []).map((emp) => (
                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                          {emp.first_name} {emp.last_name} ({emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm px-3 py-2 bg-muted rounded-md">
                    {linkedEmployee ? (
                      <div>
                        <div className="font-medium">
                          {linkedEmployee.first_name} {linkedEmployee.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {linkedEmployee.department} • {linkedEmployee.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No employee linked</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Link your user account to an employee record to enable personalized dashboards and work order views
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CalendarBlank size={18} />
                Account Activity
              </h4>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-medium">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(userProfile.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium">
                    {new Date(userProfile.last_login_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {linkedEmployee && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Linked Employee Details</h4>
                  <div className="grid gap-2 text-sm bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position</span>
                      <span className="font-medium">{linkedEmployee.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{linkedEmployee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{linkedEmployee.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={linkedEmployee.status === 'Active' ? 'default' : 'secondary'}>
                        {linkedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
