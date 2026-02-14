import { useState } from 'react'
import type { Employee, Message } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ChatCircle, 
  PaperPlaneTilt, 
  Plus,
  EnvelopeOpen,
  Envelope,
  Warning
} from '@phosphor-icons/react'
import { getEmployeeFullName } from '@/lib/employee-utils'
import { toast } from 'sonner'

interface MessagingSystemProps {
  employees: Employee[]
  messages: Message[]
  onSendMessage: (message: Message) => void
}

export function MessagingSystem({
  employees,
  messages,
  onSendMessage
}: MessagingSystemProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [toEmployee, setToEmployee] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal')
  const [isBroadcast, setIsBroadcast] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const currentUser = employees[0]

  const filteredMessages = messages
    .filter(m => filter === 'all' || !m.is_read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleSendMessage = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in subject and message')
      return
    }

    if (!isBroadcast && !toEmployee) {
      toast.error('Please select a recipient')
      return
    }

    const newMessage: Message = {
      message_id: `MSG-${Date.now()}`,
      from_employee_id: currentUser.employee_id,
      to_employee_id: isBroadcast ? null : toEmployee,
      subject,
      body,
      is_read: false,
      is_broadcast: isBroadcast,
      priority,
      created_at: new Date().toISOString(),
      read_at: null
    }

    onSendMessage(newMessage)
    setComposeOpen(false)
    setToEmployee('')
    setSubject('')
    setBody('')
    setPriority('Normal')
    setIsBroadcast(false)
    toast.success('Message sent')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEmployeeById = (id: string) => {
    return employees.find(e => e.employee_id === id)
  }

  const getInitials = (employee: Employee) => {
    return `${employee.first_name[0]}${employee.last_name[0]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Messages
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Unread
            {messages.filter(m => !m.is_read).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messages.filter(m => !m.is_read).length}
              </Badge>
            )}
          </Button>
        </div>

        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Send a message to an employee or broadcast to all
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isBroadcast}
                    onChange={(e) => setIsBroadcast(e.target.checked)}
                    className="rounded"
                  />
                  Broadcast to all employees
                </label>
              </div>

              {!isBroadcast && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Select value={toEmployee} onValueChange={setToEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                          {getEmployeeFullName(emp)} - {emp.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as 'Normal' | 'High' | 'Urgent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <PaperPlaneTilt size={18} />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredMessages.map(message => {
                  const fromEmployee = getEmployeeById(message.from_employee_id)
                  return (
                    <button
                      key={message.message_id}
                      onClick={() => setSelectedMessage(message)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedMessage?.message_id === message.message_id ? 'bg-muted' : ''
                      } ${!message.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {fromEmployee ? getInitials(fromEmployee) : 'SY'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!message.is_read && (
                              <Envelope size={16} className="text-primary" weight="fill" />
                            )}
                            {message.is_read && (
                              <EnvelopeOpen size={16} className="text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm truncate">
                              {fromEmployee ? getEmployeeFullName(fromEmployee) : 'System'}
                            </span>
                          </div>
                          <div className="font-medium text-sm truncate mb-1">
                            {message.subject}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                            {message.priority !== 'Normal' && (
                              <Badge variant="outline" className={`${getPriorityColor(message.priority)} text-xs`}>
                                {message.priority}
                              </Badge>
                            )}
                            {message.is_broadcast && (
                              <Badge variant="outline" className="text-xs">
                                Broadcast
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {filteredMessages.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <ChatCircle size={48} className="mx-auto mb-3 opacity-50" />
                    <div className="text-sm">No messages</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription className="mt-2">
                      From: {getEmployeeById(selectedMessage.from_employee_id) 
                        ? getEmployeeFullName(getEmployeeById(selectedMessage.from_employee_id)!) 
                        : 'System'}
                      {selectedMessage.to_employee_id && (
                        <> • To: {getEmployeeById(selectedMessage.to_employee_id)
                          ? getEmployeeFullName(getEmployeeById(selectedMessage.to_employee_id)!)
                          : 'Unknown'}</>
                      )}
                      {selectedMessage.is_broadcast && ' • To: All Employees'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMessage.priority !== 'Normal' && (
                      <Badge variant="outline" className={getPriorityColor(selectedMessage.priority)}>
                        {selectedMessage.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="text-sm text-muted-foreground mb-4">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {selectedMessage.body}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center text-muted-foreground">
                  <ChatCircle size={64} className="mx-auto mb-4 opacity-50" />
                  <div>Select a message to view</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
