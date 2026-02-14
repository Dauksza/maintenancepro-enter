import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormTemplate } from '@/lib/types'
import { 
  Play, 
  PencilSimple, 
  Trash,
  ShieldCheck,
  ClipboardText,
  Certificate,
  CheckSquare
} from '@phosphor-icons/react'

interface FormTemplateCardProps {
  template: FormTemplate
  onStart: (template: FormTemplate) => void
  onEdit: (template: FormTemplate) => void
  onDelete: (templateId: string) => void
}

export function FormTemplateCard({
  template,
  onStart,
  onEdit,
  onDelete,
}: FormTemplateCardProps) {
  const getTypeIcon = () => {
    switch (template.template_type) {
      case 'JHA':
        return <ShieldCheck size={24} weight="duotone" className="text-destructive" />
      case 'Inspection':
        return <CheckSquare size={24} weight="duotone" className="text-primary" />
      case 'Safety':
        return <ShieldCheck size={24} weight="duotone" className="text-amber-600" />
      case 'Quality':
        return <Certificate size={24} weight="duotone" className="text-blue-600" />
      case 'Audit':
        return <ClipboardText size={24} weight="duotone" className="text-purple-600" />
      default:
        return <ClipboardText size={24} weight="duotone" className="text-muted-foreground" />
    }
  }

  const getTypeBadgeColor = () => {
    switch (template.template_type) {
      case 'JHA':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Inspection':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Safety':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Quality':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'Audit':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <Badge variant="outline" className={getTypeBadgeColor()}>
              {template.template_type}
            </Badge>
          </div>
          {template.is_premade && (
            <Badge variant="secondary" className="text-xs">
              Pre-made
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{template.template_name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Sections:</span>
              <span className="font-medium text-foreground">{template.sections.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Fields:</span>
              <span className="font-medium text-foreground">
                {template.sections.reduce((sum, s) => sum + s.fields.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium text-foreground">{template.category}</span>
            </div>
            {template.requires_approval && (
              <div className="flex justify-between">
                <span>Approval:</span>
                <span className="font-medium text-amber-600">Required</span>
              </div>
            )}
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 4).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onStart(template)}
              className="flex-1 gap-2"
            >
              <Play size={16} weight="fill" />
              Start Form
            </Button>
            {!template.is_premade && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(template)}
                >
                  <PencilSimple size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(template.template_id)}
                >
                  <Trash size={18} />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
