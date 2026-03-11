import { useState, useMemo, useCallback } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Trophy,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Star,
  Flame,
  Clock,
  Video,
  Article,
  FileText,
  Presentation,
  Link,
} from '@phosphor-icons/react'
import type { Resource } from './AITrainingModule'

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionType =
  | 'objectives'
  | 'hook'
  | 'content'
  | 'scenarios'
  | 'discussion'
  | 'takeaways'
  | 'further'
  | 'other'

interface LessonSection {
  id: string
  /** Raw heading text including emoji, e.g. "📖 Section 1: Concept Name (15 minutes)" */
  title: string
  /** Clean display title without duration suffix */
  displayTitle: string
  /** Body markdown for this section */
  content: string
  sectionType: SectionType
  /** Section contains an ✏️ Activity sub-section */
  hasActivity: boolean
  /** Section contains a Scenario sub-section */
  hasScenario: boolean
  /** Duration extracted from "(N minutes)" pattern */
  estimatedMinutes?: number
}

// ── Section parsing ────────────────────────────────────────────────────────────

function detectSectionType(title: string): SectionType {
  const lower = title.toLowerCase()
  if (/learning objective|🎯/.test(lower)) return 'objectives'
  if (/opening hook|🚀/.test(lower)) return 'hook'
  if (/scenario|practice|🔬/.test(lower)) return 'scenarios'
  if (/discussion|💬/.test(lower)) return 'discussion'
  if (/takeaway|key takeaway|🏁/.test(lower)) return 'takeaways'
  if (/further|exploration|📚/.test(lower)) return 'further'
  if (/section|📖/.test(lower)) return 'content'
  return 'other'
}

function extractMinutes(title: string): number | undefined {
  const m = title.match(/\((\d+)\s*minutes?\)/i)
  return m ? parseInt(m[1], 10) : undefined
}

/**
 * Parse `##`-level sections from an interactive-lesson markdown document.
 * Content before the first `##` heading (the H1 title) is ignored.
 */
function parseLessonSections(markdown: string): LessonSection[] {
  const sections: LessonSection[] = []
  const lines = markdown.split('\n')
  let currentTitle = ''
  let currentLines: string[] = []

  const pushSection = () => {
    if (!currentTitle) return
    const body = currentLines.join('\n').trim()
    if (!body) return
    const raw = currentTitle.replace(/^##\s*/, '').trim()
    // Strip leading emoji(s) and duration for display title
    const displayTitle = raw
      .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
      .replace(/\s*\(\d+\s*minutes?\)/i, '')
      .trim() || raw
    sections.push({
      id: `section-${sections.length}`,
      title: raw,
      displayTitle,
      content: body,
      sectionType: detectSectionType(raw),
      hasActivity: currentLines.some(l => /###\s*(?:✏️|.*\bactivity\b)/i.test(l)),
      hasScenario: currentLines.some(l => /###\s*Scenario/i.test(l)),
      estimatedMinutes: extractMinutes(raw),
    })
  }

  for (const line of lines) {
    // Match H2 headings only — exactly "## " (two hashes + space, not H3+)
    // The negative lookahead (?!#) ensures there is no third hash.
    if (/^##(?!#)\s/.test(line)) {
      pushSection()
      currentTitle = line
      currentLines = []
    } else if (currentTitle) {
      currentLines.push(line)
    }
  }
  pushSection()

  return sections
}

// ── Section style helpers ─────────────────────────────────────────────────────

function getSectionIcon(type: SectionType): React.ElementType {
  switch (type) {
    case 'objectives': return CheckCircle
    case 'hook': return Flame
    case 'scenarios': return Star
    case 'discussion': return Lightbulb
    case 'takeaways': return Trophy
    case 'further': return GraduationCap
    case 'content': return BookOpen
    default: return BookOpen
  }
}

function getSectionColor(type: SectionType): string {
  switch (type) {
    case 'objectives': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    case 'hook': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    case 'scenarios': return 'bg-green-500/10 text-green-600 dark:text-green-400'
    case 'discussion': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    case 'takeaways': return 'bg-primary/10 text-primary'
    case 'further': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    case 'content': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ── Inner components ──────────────────────────────────────────────────────────

function SectionContent({ markdown }: { markdown: string }) {
  const rawHtml = marked.parse(markdown) as string
  const html = DOMPurify.sanitize(rawHtml)
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none leading-relaxed
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
        prose-p:leading-7 prose-p:mb-3
        prose-ul:my-3 prose-li:my-1
        prose-ol:my-3
        prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/40 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
        prose-table:border prose-table:border-border prose-thead:bg-muted prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2
        prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
        prose-strong:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function getResourceIcon(type: Resource['type']): React.ElementType {
  switch (type) {
    case 'video': return Video
    case 'article': return Article
    case 'slides': return Presentation
    case 'powerpoint': return Presentation
    case 'document': return FileText
    default: return Link
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtube.com' || u.hostname === 'www.youtube.com') {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch { /* ignore */ }
  return null
}

function ResourcesPanel({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Attached Resources</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-4">
        {resources.map(r => {
          const Icon = getResourceIcon(r.type)
          const ytEmbed = r.type === 'video' ? getYouTubeEmbedUrl(r.url) : null
          return (
            <div key={r.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" weight="duotone" />
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-primary truncate"
                >
                  {r.title}
                </a>
              </div>
              {ytEmbed && (
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                  <iframe
                    src={ytEmbed}
                    title={r.title}
                    allowFullScreen
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
              {!ytEmbed && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <Link className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">
                    Open resource
                  </span>
                </a>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export interface InteractiveLessonPlayerProps {
  title: string
  content: string
  resources?: Resource[]
  onBack: () => void
  onComplete?: () => void
}

export function InteractiveLessonPlayer({
  title,
  content,
  resources = [],
  onBack,
  onComplete,
}: InteractiveLessonPlayerProps) {
  const sections = useMemo(() => parseLessonSections(content), [content])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set())
  const [lessonComplete, setLessonComplete] = useState(false)

  const totalSections = sections.length
  const progressPercent =
    totalSections > 0 ? Math.round((completedSections.size / totalSections) * 100) : 0

  const handleNext = useCallback(() => {
    setCompletedSections(prev => new Set([...prev, currentIdx]))
    if (currentIdx < totalSections - 1) {
      setCurrentIdx(prev => prev + 1)
    } else {
      setLessonComplete(true)
      onComplete?.()
    }
  }, [currentIdx, totalSections, onComplete])

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
    }
  }, [currentIdx])

  const handleGoToSection = useCallback((idx: number) => {
    setCurrentIdx(idx)
  }, [])

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (sections.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Library
        </Button>
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
            <BookOpen className="w-12 h-12 opacity-20" weight="duotone" />
            <div>
              <p className="font-medium">No sections found in this lesson</p>
              <p className="text-sm mt-1">
                The content may not use the expected format. Try regenerating the lesson.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Completion screen ────────────────────────────────────────────────────────
  if (lessonComplete) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Library
        </Button>

        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Trophy className="w-16 h-16 text-yellow-500" weight="duotone" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Lesson Complete! 🎉</h2>
              <p className="text-muted-foreground mt-1">{title}</p>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              You've completed all {totalSections} sections of this interactive lesson.{' '}
              {resources.length > 0 && 'Explore the attached resources below to deepen your learning.'}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentIdx(0)
                  setLessonComplete(false)
                }}
              >
                Review Lesson
              </Button>
              <Button onClick={onBack}>
                Back to Library
              </Button>
            </div>
          </CardContent>
        </Card>

        {resources.length > 0 && <ResourcesPanel resources={resources} />}
      </div>
    )
  }

  // ── Main lesson player ───────────────────────────────────────────────────────
  const currentSection = sections[currentIdx]
  const SectionIcon = getSectionIcon(currentSection.sectionType)
  const sectionColor = getSectionColor(currentSection.sectionType)
  const isCurrentCompleted = completedSections.has(currentIdx)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Library
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="outline" className="gap-1">
          <BookOpen className="w-3 h-3" />
          Interactive Lesson
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {currentIdx + 1} / {totalSections}
        </span>
      </div>

      {/* Title + progress bar */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold truncate">{title}</h2>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {completedSections.size} of {totalSections} sections completed
        </p>
      </div>

      {/* Section step indicator */}
      <div className="flex flex-wrap gap-1.5">
        {sections.map((section, idx) => {
          const done = completedSections.has(idx)
          const current = idx === currentIdx
          return (
            <button
              key={section.id}
              className={cn(
                'w-7 h-7 rounded-full text-xs font-semibold transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary',
                current && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1',
                done && !current && 'bg-green-500 text-white',
                !current && !done && 'bg-muted text-muted-foreground border border-border hover:border-primary/50'
              )}
              onClick={() => handleGoToSection(idx)}
              title={section.displayTitle}
            >
              {done && !current ? '✓' : idx + 1}
            </button>
          )
        })}
      </div>

      {/* Current section card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${sectionColor}`}>
              <SectionIcon className="w-5 h-5" weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-snug">{currentSection.title}</CardTitle>
              {currentSection.estimatedMinutes && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentSection.estimatedMinutes} min
                </p>
              )}
            </div>
            {isCurrentCompleted && (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" weight="fill" />
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <ScrollArea className="max-h-[calc(100vh-28rem)] pr-2">
            <SectionContent markdown={currentSection.content} />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity callout */}
      {currentSection.hasActivity && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Lightbulb
                className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                weight="duotone"
              />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Hands-on Activity
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  This section includes activities. Work through them before advancing to the next
                  section.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario callout */}
      {currentSection.hasScenario && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Star
                className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                weight="duotone"
              />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Practice Scenarios
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Apply what you've learned to realistic workplace scenarios before continuing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIdx === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Previous
        </Button>

        {currentIdx < totalSections - 1 ? (
          <Button onClick={handleNext}>
            Next Section
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Trophy className="w-4 h-4 mr-1.5" weight="duotone" />
            Complete Lesson
          </Button>
        )}
      </div>
    </div>
  )
}
