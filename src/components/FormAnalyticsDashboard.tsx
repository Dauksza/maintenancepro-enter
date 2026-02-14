import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSubmission, FormTemplate } from '@/lib/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'

interface FormAnalyticsDashboardProps {
  submissions: FormSubmission[]
  templates: FormTemplate[]
}

export function FormAnalyticsDashboard({
  submissions,
  templates,
}: FormAnalyticsDashboardProps) {
  const submissionsByStatus = useMemo(() => {
    const statusCounts = submissions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))
  }, [submissions])

  const submissionsByTemplate = useMemo(() => {
    const templateCounts = submissions.reduce((acc, s) => {
      acc[s.template_name] = (acc[s.template_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(templateCounts)
      .map(([template, count]) => ({ template, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [submissions])

  const submissionsTrend = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, 'MMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date)
      }
    })

    return last6Months.map(({ month, start, end }) => {
      const count = submissions.filter(s => {
        const subDate = new Date(s.submission_date)
        return subDate >= start && subDate <= end
      }).length

      return { month, count }
    })
  }, [submissions])

  const averageScore = useMemo(() => {
    const scoredSubmissions = submissions.filter(s => s.score !== undefined)
    if (scoredSubmissions.length === 0) return 0
    const total = scoredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0)
    return Math.round(total / scoredSubmissions.length)
  }, [submissions])

  const complianceRate = useMemo(() => {
    const completedSubmissions = submissions.filter(s => 
      s.status === 'Completed' || s.status === 'Approved'
    )
    if (submissions.length === 0) return 0
    return Math.round((completedSubmissions.length / submissions.length) * 100)
  }, [submissions])

  const totalIssues = useMemo(() => {
    return submissions.reduce((sum, s) => sum + s.issues_identified, 0)
  }, [submissions])

  const pendingActions = useMemo(() => {
    return submissions.reduce((sum, s) => 
      sum + s.corrective_actions_required.length, 0
    )
  }, [submissions])

  const issuesBySeverity = useMemo(() => {
    const severityCounts: Record<string, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Critical': 0
    }

    submissions.forEach(s => {
      Object.values(s.field_responses || {}).forEach(response => {
        if (response.value === 'Minor' || response.value === 'Low') {
          severityCounts['Low']++
        } else if (response.value === 'Moderate' || response.value === 'Medium' || response.value === 'Fair') {
          severityCounts['Medium']++
        } else if (response.value === 'Major' || response.value === 'High' || response.value === 'Severe') {
          severityCounts['High']++
        } else if (response.value === 'Extreme' || response.value === 'Critical') {
          severityCounts['Critical']++
        }
      })
    })

    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count
    }))
  }, [submissions])

  const COLORS = {
    'In Progress': '#3b82f6',
    'Completed': '#10b981',
    'Approved': '#059669',
    'Rejected': '#ef4444',
    'Requires Action': '#f59e0b',
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#f97316',
    'Critical': '#ef4444'
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all completed forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{complianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed / Total submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{totalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Identified across all forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{pendingActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Corrective actions required
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Status</CardTitle>
            <CardDescription>Distribution of submission statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={submissionsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {submissionsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
            <CardDescription>Breakdown of identified issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuesBySeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {issuesBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.severity as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Submission Trend</CardTitle>
            <CardDescription>Submissions over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={submissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Submissions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Most Used Forms</CardTitle>
            <CardDescription>Top 10 forms by submission count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={submissionsByTemplate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="template" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
