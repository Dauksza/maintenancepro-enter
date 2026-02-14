import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { WorkOrderSuggestion } from '@/lib/work-order-suggestions'
import { Sparkle, TrendUp, Check } from '@phosphor-icons/react'

interface SuggestionPreviewProps {
  suggestions: WorkOrderSuggestion[]
  onApply?: (field: string, value: string) => void
}

export function SuggestionPreview({ suggestions, onApply }: SuggestionPreviewProps) {
  if (suggestions.length === 0) return null

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-accent'
    if (confidence >= 60) return 'text-primary'
    return 'text-muted-foreground'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-accent text-accent-foreground'
    if (confidence >= 60) return 'bg-primary text-primary-foreground'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkle size={16} weight="fill" className="text-accent" />
        <span className="text-sm font-semibold">AI Suggestions Available</span>
      </div>

      {suggestions.slice(0, 3).map((suggestion) => {
        const topSuggestion = suggestion.suggestions[0]
        if (!topSuggestion) return null

        return (
          <Card key={suggestion.field} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium capitalize text-muted-foreground">
                {suggestion.field.replace(/_/g, ' ')}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getConfidenceBadge(topSuggestion.confidence)}`}
              >
                <TrendUp size={10} className="mr-1" />
                {topSuggestion.confidence.toFixed(0)}% match
              </Badge>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate flex-1">
                {topSuggestion.value}
              </span>
              {onApply && (
                <button
                  onClick={() => onApply(suggestion.field, topSuggestion.value)}
                  className="text-accent hover:text-accent/80 transition-colors"
                  title="Apply suggestion"
                >
                  <Check size={16} weight="bold" />
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {topSuggestion.reason}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
