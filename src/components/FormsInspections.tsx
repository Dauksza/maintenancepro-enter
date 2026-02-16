import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormTemplate, FormSubmission } from '@/lib/types'
import { 
  ClipboardText, 
  Plus, 
  MagnifyingGlass,
  FileText,
  CheckCircle,
  Warning,
  ChartBar,
  FunnelSimple
} from '@phosphor-icons/react'
import { FormTemplateCard } from './FormTemplateCard'
import { FormSubmissionList } from './FormSubmissionList'
import { FormWizardDialog } from './FormWizardDialog'
import { FormSubmissionDialog } from './FormSubmissionDialog'
import { FormAnalyticsDashboard } from './FormAnalyticsDashboard'

interface FormsInspectionsProps {
  templates: FormTemplate[]
  submissions: FormSubmission[]
  onCreateTemplate: (template: FormTemplate) => void
  onUpdateTemplate: (templateId: string, updates: Partial<FormTemplate>) => void
  onDeleteTemplate: (templateId: string) => void
  onCreateSubmission: (submission: FormSubmission) => void
  onUpdateSubmission: (submissionId: string, updates: Partial<FormSubmission>) => void
}

export function FormsInspections({
  templates,
  submissions,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateSubmission,
  onUpdateSubmission,
}: FormsInspectionsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [activeTab, setActiveTab] = useState('templates')

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category))
    return ['All', ...Array.from(cats)]
  }, [templates])

  const types = ['All', 'JHA', 'Inspection', 'Safety', 'Quality', 'Audit', 'Custom']

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = 
        template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = categoryFilter === 'All' || template.category === categoryFilter
      const matchesType = typeFilter === 'All' || template.template_type === typeFilter
      
      return matchesSearch && matchesCategory && matchesType
    })
  }, [templates, searchQuery, categoryFilter, typeFilter])

  const premadeTemplates = useMemo(() => 
    filteredTemplates.filter(t => t.is_premade), 
    [filteredTemplates]
  )

  const customTemplates = useMemo(() => 
    filteredTemplates.filter(t => !t.is_premade), 
    [filteredTemplates]
  )

  const recentSubmissions = useMemo(() => 
    [...submissions].sort((a, b) => 
      new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
    ).slice(0, 10),
    [submissions]
  )

  const handleStartForm = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setSubmissionDialogOpen(true)
  }

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template)
    setWizardOpen(true)
  }

  const handleViewSubmission = (submission: FormSubmission) => {
    const template = templates.find(t => t.template_id === submission.template_id)
    if (template) {
      setSelectedTemplate(template)
      setSelectedSubmission(submission)
      setSubmissionDialogOpen(true)
    }
  }

  const stats = useMemo(() => {
    const totalSubmissions = submissions.length
    const completed = submissions.filter(s => s.status === 'Completed').length
    const inProgress = submissions.filter(s => s.status === 'In Progress').length
    const requiresAction = submissions.filter(s => s.status === 'Requires Action').length
    const issuesIdentified = submissions.reduce((sum, s) => sum + s.issues_identified, 0)

    return { totalSubmissions, completed, inProgress, requiresAction, issuesIdentified }
  }, [submissions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Forms & Inspections</h2>
          <p className="text-muted-foreground">
            Job Hazard Analysis, safety inspections, and custom forms
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus size={18} weight="bold" />
          Create Custom Form
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText size={32} className="text-primary" weight="duotone" />
              <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle size={32} className="text-green-600" weight="duotone" />
              <div className="text-3xl font-bold">{stats.completed}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Requires Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Warning size={32} className="text-amber-600" weight="duotone" />
              <div className="text-3xl font-bold">{stats.requiresAction}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Issues Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ChartBar size={32} className="text-destructive" weight="duotone" />
              <div className="text-3xl font-bold">{stats.issuesIdentified}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <ClipboardText size={18} />
            Form Templates
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <FileText size={18} />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <ChartBar size={18} />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                placeholder="Search forms by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <FunnelSimple size={18} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <FunnelSimple size={18} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {premadeTemplates.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Pre-made Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Ready-to-use forms for common safety and inspection tasks
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {premadeTemplates.map(template => (
                  <FormTemplateCard
                    key={template.template_id}
                    template={template}
                    onStart={handleStartForm}
                    onEdit={handleEditTemplate}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {customTemplates.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Custom Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Forms you've created for your specific needs
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customTemplates.map(template => (
                  <FormTemplateCard
                    key={template.template_id}
                    template={template}
                    onStart={handleStartForm}
                    onEdit={handleEditTemplate}
                    onDelete={onDeleteTemplate}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardText size={64} className="text-muted-foreground mb-4" weight="duotone" />
                <h3 className="text-xl font-semibold mb-2">No forms found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchQuery || categoryFilter !== 'All' || typeFilter !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Create your first custom form to get started'}
                </p>
                {!searchQuery && categoryFilter === 'All' && typeFilter === 'All' && (
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus size={18} />
                    Create Custom Form
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <FormSubmissionList
            submissions={submissions}
            templates={templates}
            onViewSubmission={handleViewSubmission}
            onUpdateSubmission={onUpdateSubmission}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <FormAnalyticsDashboard
            submissions={submissions}
            templates={templates}
          />
        </TabsContent>
      </Tabs>

      <FormWizardDialog
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false)
          setEditingTemplate(null)
        }}
        onCreateTemplate={onCreateTemplate}
        onUpdateTemplate={onUpdateTemplate}
        editingTemplate={editingTemplate}
      />

      {selectedTemplate && (
        <FormSubmissionDialog
          open={submissionDialogOpen}
          onClose={() => {
            setSubmissionDialogOpen(false)
            setSelectedTemplate(null)
            setSelectedSubmission(null)
          }}
          template={selectedTemplate}
          submission={selectedSubmission}
          onCreateSubmission={onCreateSubmission}
          onUpdateSubmission={onUpdateSubmission}
        />
      )}
    </div>
  )
}
