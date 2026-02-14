import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormSubmission, FormTemplate, SubmissionStatus } from '@/lib/types'
import { 
  MagnifyingGlass,
  Eye,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  FunnelSimple
} from '@phosphor-icons/react'
import { format } from 'date-fns'

interface FormSubmissionListProps {
  submissions: FormSubmission[]
  templates: FormTemplate[]
  onViewSubmission: (submission: FormSubmission) => void
  onUpdateSubmission: (submissionId: string, updates: Partial<FormSubmission>) => void
}

export function FormSubmissionList({
  submissions,
  templates,
  onViewSubmission,
  onUpdateSubmission,
}: FormSubmissionListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const statuses: (SubmissionStatus | 'All')[] = ['All', 'In Progress', 'Completed', 'Approved', 'Rejected', 'Requires Action']

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = 
        submission.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.submitted_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.submission_id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'All' || submission.status === statusFilter
      
      return matchesSearch && matchesStatus
    }).sort((a, b) => 
      new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
    )
  }, [submissions, searchQuery, statusFilter])

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={18} weight="fill" className="text-green-600" />
      case 'In Progress':
        return <Clock size={18} weight="fill" className="text-blue-600" />
      case 'Approved':
        return <CheckCircle size={18} weight="fill" className="text-emerald-600" />
      case 'Rejected':
        return <XCircle size={18} weight="fill" className="text-red-600" />
      case 'Requires Action':
        return <Warning size={18} weight="fill" className="text-amber-600" />
    }
  }

  const getStatusBadge = (status: SubmissionStatus) => {
    const baseClass = "font-medium"
    switch (status) {
      case 'Completed':
        return <Badge className={`${baseClass} bg-green-100 text-green-700 border-green-200`}>{status}</Badge>
      case 'In Progress':
        return <Badge className={`${baseClass} bg-blue-100 text-blue-700 border-blue-200`}>{status}</Badge>
      case 'Approved':
        return <Badge className={`${baseClass} bg-emerald-100 text-emerald-700 border-emerald-200`}>{status}</Badge>
      case 'Rejected':
        return <Badge className={`${baseClass} bg-red-100 text-red-700 border-red-200`}>{status}</Badge>
      case 'Requires Action':
        return <Badge className={`${baseClass} bg-amber-100 text-amber-700 border-amber-200`}>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            placeholder="Search submissions by form name, submitter, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <FunnelSimple size={18} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle size={64} className="text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Start filling out forms to see submissions here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map(submission => (
                  <TableRow key={submission.submission_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        {getStatusBadge(submission.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {submission.template_name}
                    </TableCell>
                    <TableCell>{submission.submitted_by_name}</TableCell>
                    <TableCell>
                      {format(new Date(submission.submission_date), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {submission.score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                submission.score >= 80 ? 'bg-green-600' :
                                submission.score >= 60 ? 'bg-amber-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${submission.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{submission.score}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.issues_identified > 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {submission.issues_identified} issue{submission.issues_identified !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSubmission(submission)}
                        className="gap-2"
                      >
                        <Eye size={16} />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
