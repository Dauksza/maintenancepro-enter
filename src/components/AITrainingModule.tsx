import { useState, useRef, useCallback, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { InteractiveQuizPlayer } from '@/components/InteractiveQuizPlayer'
import type { QuizCompletionResult } from '@/components/InteractiveQuizPlayer'
import { InteractiveLessonPlayer } from '@/components/InteractiveLessonPlayer'
import { PythonPlayground } from '@/components/PythonPlayground'
import {
  Brain,
  BookOpen,
  Question,
  ClipboardText,
  Lightbulb,
  FloppyDisk,
  Trash,
  Eye,
  Sparkle,
  GraduationCap,
  Key,
  ArrowLeft,
  ArrowRight,
  MagnifyingGlass,
  Plus,
  X,
  Play,
  Link,
  FileText,
  Video,
  Article,
  Presentation,
  List,
  CheckSquare,
  Code,
  Globe,
  ArrowClockwise,
  CaretDown,
  CaretUp,
  BookmarkSimple,
  ChartBar,
  CheckCircle,
  Star,
  Trophy,
  Medal,
  Flame,
  Clock,
  Hash,
} from '@phosphor-icons/react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContentType = 'study-guide' | 'quiz' | 'test' | 'interactive-lesson' | 'python-exercise'

export type ResourceType = 'video' | 'article' | 'slides' | 'document' | 'powerpoint'

export interface Resource {
  id: string
  type: ResourceType
  title: string
  url: string
}

export interface TrainingContent {
  id: string
  title: string
  topic: string
  contentType: ContentType
  content: string
  createdAt: string
  tags: string[]
  resources?: Resource[]
}

export interface ProgressRecord {
  id: string
  contentId: string
  contentTitle: string
  contentType: ContentType
  completedAt: string
  score?: number    // percentage (quizzes/tests)
  passed?: boolean  // for quizzes/tests
}

/** Passing threshold — must stay in sync with InteractiveQuizPlayer's PASSING_SCORE */
export const PASSING_SCORE = 70

// ── Achievement badge definitions ────────────────────────────────────────────

interface AchievementDef {
  id: string
  title: string
  description: string
  emoji: string
  check: (library: TrainingContent[], progress: ProgressRecord[]) => boolean
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-save',
    title: 'First Step',
    description: 'Saved your first training item',
    emoji: '🌱',
    check: (lib) => lib.length >= 1,
  },
  {
    id: 'first-quiz',
    title: 'Quiz Taker',
    description: 'Completed your first quiz or test',
    emoji: '📝',
    check: (_, prog) => prog.some(p => p.contentType === 'quiz' || p.contentType === 'test'),
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Achieved 100% on a quiz or test',
    emoji: '🏆',
    check: (_, prog) => prog.some(p => p.score === 100),
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Passed 5 quizzes or tests',
    emoji: '🎓',
    check: (_, prog) => prog.filter(p => p.passed).length >= 5,
  },
  {
    id: 'dedicated',
    title: 'Dedicated Learner',
    description: 'Completed 10 training items',
    emoji: '🔥',
    check: (_, prog) => prog.length >= 10,
  },
  {
    id: 'python-coder',
    title: 'Python Coder',
    description: 'Completed a Python exercise',
    emoji: '🐍',
    check: (_, prog) => prog.some(p => p.contentType === 'python-exercise'),
  },
  {
    id: 'well-rounded',
    title: 'Well-Rounded',
    description: 'Completed all 5 content types',
    emoji: '⭐',
    check: (_, prog) => {
      const types = new Set(prog.map(p => p.contentType))
      return types.size >= 5
    },
  },
  {
    id: 'library-builder',
    title: 'Library Builder',
    description: 'Built a library of 10+ training items',
    emoji: '📚',
    check: (lib) => lib.length >= 10,
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { label: string; icon: React.ElementType; color: string; description: string }
> = {
  'study-guide': {
    label: 'Study Guide',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    description: 'Comprehensive illustrated reference with key concepts, diagrams, and examples',
  },
  quiz: {
    label: 'Quiz',
    icon: Question,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    description: 'Multiple-choice questions — take it interactively and get a score',
  },
  test: {
    label: 'Test',
    icon: ClipboardText,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    description: 'Formal assessment with mixed question types — graded on submission',
  },
  'interactive-lesson': {
    label: 'Interactive Lesson',
    icon: Lightbulb,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    description: 'Step-by-step lesson with activities, scenarios, and discussion prompts',
  },
  'python-exercise': {
    label: 'Python Exercise',
    icon: Code,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    description: 'Interactive Python coding exercises with runnable examples in the browser',
  },
}

const RESOURCE_TYPE_CONFIG: Record<ResourceType, { label: string; icon: React.ElementType; color: string }> = {
  video: {
    label: 'Video',
    icon: Video,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  article: {
    label: 'Article',
    icon: Article,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  slides: {
    label: 'Slides',
    icon: Presentation,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  document: {
    label: 'Document',
    icon: FileText,
    color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  },
  powerpoint: {
    label: 'PowerPoint',
    icon: Presentation,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const CONTENT_PROMPTS: Record<ContentType, (topic: string, context: string) => string> = {
  'study-guide': (topic, context) =>
    `Create a comprehensive, illustrated study guide on "${topic}"${context ? ` for a ${context} context` : ''}. Structure it as follows:

---

# 📘 Study Guide: ${topic}

## 🎯 Learning Objectives
List 4–6 clear, measurable outcomes the learner will achieve.

## 🔍 Overview
A clear, concise 2–3 paragraph introduction. Use a compelling hook.

## 📌 Key Concepts at a Glance
A quick-reference table with two columns: **Concept** | **Definition**

## 🧩 Section 1: [First Major Topic]
In-depth explanation with:
- Bullet-pointed key points
- A real-world example or scenario in a > blockquote callout
- A step-by-step procedure if applicable (numbered list)

## 🧩 Section 2: [Second Major Topic]
In-depth explanation with bullet points, examples, and callouts.

## 🧩 Section 3: [Third Major Topic]
In-depth explanation with bullet points, examples, and callouts.

## ⚠️ Common Mistakes to Avoid
A numbered list of the top 5–7 mistakes and how to avoid them.

## 🗂️ Key Terms Glossary
A table with **Term** | **Definition** columns for 10+ important vocabulary words.

## 💡 Quick Reference Summary
A concise bullet-point recap (10–15 points) of the most critical information.

## ✅ Knowledge Check Questions
5 self-test questions (no answers shown) so the learner can test themselves.

## 📚 Further Learning
Suggest 3–5 topics, standards, or procedures the learner should explore next.

---

Use rich Markdown throughout: headers, tables, bold/italic emphasis, blockquote callouts (> ⚠️ **Warning:** ...), and numbered/bulleted lists. Make it visually organized and as long as needed to be truly comprehensive.`,

  quiz: (topic, context) =>
    `Create an interactive quiz on "${topic}"${context ? ` relevant to a ${context} context` : ''}. Include exactly 15 multiple-choice questions.

Use EXACTLY this format for every question (this format is required for the interactive quiz player):

**Question 1:** [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
✓ Correct Answer: [A/B/C/D] – [Brief 1–2 sentence explanation of why this is correct]

**Question 2:** [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
✓ Correct Answer: [A/B/C/D] – [explanation]

[Continue for all 15 questions]

Rules:
- Questions must be clear, unambiguous, and test real understanding
- All four options must be plausible (no obviously wrong distractors)
- Vary the difficulty (5 easy, 7 medium, 3 hard)
- Include scenario-based questions where appropriate
- Explanations must be informative and educational`,

  test: (topic, context) =>
    `Create a formal assessment test on "${topic}"${context ? ` for a ${context} environment` : ''}.

## 📋 Test: ${topic}

---

### Part 1: Multiple Choice (10 questions — 2 points each)
Use EXACTLY this format for every question:

**Question 1:** [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
✓ Correct Answer: [A/B/C/D] – [explanation]

[Questions 1–10 in this exact format]

---

### Part 2: True / False (5 questions — 1 point each)
Use EXACTLY this format:

**Question 11:** [Statement]
A) True
B) False
✓ Correct Answer: [A/B] – [explanation]

[Questions 11–15 in this exact format]

---

### Part 3: Short Answer (3 questions — 5 points each)
**Question 16:** [Open-ended question]
Model Answer: [Comprehensive model answer]

**Question 17:** [Open-ended question]
Model Answer: [Comprehensive model answer]

**Question 18:** [Open-ended question]
Model Answer: [Comprehensive model answer]

---

### Part 4: Scenario / Essay (1 question — 10 points)
**Question 19:** [Realistic workplace scenario requiring detailed response]

**Grading Criteria (strong answer should cover):**
- [Key point 1]
- [Key point 2]
- [Key point 3]
- [Key point 4]
- [Key point 5]

---

**Total: 40 points | Passing Score: 28 points (70%)**`,

  'interactive-lesson': (topic, context) =>
    `Create a fully interactive lesson plan on "${topic}"${context ? ` for a ${context} setting` : ''}. Make it highly engaging, illustrated with examples, and as comprehensive as needed.

---

# 🎓 Interactive Lesson: ${topic}

## 🎯 Learning Objectives
By the end of this lesson, learners will be able to:
1. [Objective 1 — measurable action verb]
2. [Objective 2]
3. [Objective 3]
4. [Objective 4]
5. [Objective 5]

---

## 🚀 Opening Hook (5 minutes)
An engaging opening scenario, surprising fact, or provocative question to capture interest.

> 💬 **Discussion Prompt:** [Thought-provoking question for the class to consider before starting]

---

## 📖 Section 1: [First Core Concept] (15 minutes)

### What is it?
[Explanation with clear, accessible language]

### Why does it matter?
[Real-world relevance and consequences of not understanding this]

### How does it work?
[Step-by-step breakdown if procedural, or key principles if conceptual]

> 📌 **Key Point:** [Highlight the single most important takeaway from this section]

### ✏️ Activity 1: [Activity Name]
**Instructions:** [Clear step-by-step instructions for a hands-on activity, role-play, or problem-solving exercise]
**Time:** [X minutes]
**Materials:** [Any needed materials or information]
**Debrief Questions:**
- [Question 1]
- [Question 2]

---

## 📖 Section 2: [Second Core Concept] (15 minutes)

[Same structure as Section 1]

### ✏️ Activity 2: [Activity Name]
[Activity instructions, time, materials, debrief questions]

---

## 📖 Section 3: [Third Core Concept] (15 minutes)

[Same structure as Section 1]

### ✏️ Activity 3: [Activity Name]
[Activity instructions, time, materials, debrief questions]

---

## 🔬 Practice Scenarios (20 minutes)
Apply knowledge to realistic workplace situations.

### Scenario 1: [Scenario Title]
**Situation:** [Detailed realistic scenario description]
**Your Task:** [What the learner must do or decide]
**Discussion Questions:**
- [Question 1]
- [Question 2]
**Ideal Response:** [What a strong response looks like]

### Scenario 2: [Scenario Title]
[Same format]

### Scenario 3: [Scenario Title]
[Same format]

---

## 💬 Group Discussion (10 minutes)
1. [Broad discussion question connecting the topic to learners' experience]
2. [Question exploring edge cases or exceptions]
3. [Question about implications or future applications]

---

## 🏁 Key Takeaways
- ✅ [Takeaway 1]
- ✅ [Takeaway 2]
- ✅ [Takeaway 3]
- ✅ [Takeaway 4]
- ✅ [Takeaway 5]

---

## 📚 Further Exploration
| Resource Type | Topic | Why It's Valuable |
|---|---|---|
| [Standard/Regulation] | [Name] | [Relevance] |
| [Procedure/SOP] | [Name] | [Relevance] |
| [Concept] | [Name] | [Relevance] |

---

**Estimated Lesson Duration:** [X hours Y minutes]
**Recommended Class Size:** [X–Y learners]
**Prerequisites:** [Any required prior knowledge]`,

  'python-exercise': (topic, context) =>
    `Create a comprehensive Python coding exercise on "${topic}"${context ? ` for ${context}` : ''}. Include clear explanations, runnable examples, and hands-on exercises.

---

# 🐍 Python Exercise: ${topic}

## 🎯 Learning Objectives
By the end of this exercise, you will be able to:
1. [Objective 1 — measurable action verb]
2. [Objective 2]
3. [Objective 3]
4. [Objective 4]

---

## 📖 Concept Introduction
[Clear, accessible explanation of the concept with real-world context and why it matters.]

---

## 💻 Example 1: [Basic Example Title]
[Brief explanation of what this code demonstrates and why it's important.]

\`\`\`python
# [Example 1 — complete, runnable Python code with inline comments]
# Each line should be clearly commented to aid understanding

[complete Python code here]
\`\`\`

**Expected Output:**
\`\`\`
[exact expected output]
\`\`\`

**What's happening:** [1–2 sentences explaining the key concept demonstrated]

---

## 💻 Example 2: [Intermediate Example Title]
[Explanation]

\`\`\`python
# [Example 2 — slightly more advanced, building on Example 1]

[complete Python code]
\`\`\`

**Expected Output:**
\`\`\`
[expected output]
\`\`\`

---

## 💻 Example 3: [Advanced Example Title]
[Explanation]

\`\`\`python
# [Example 3 — practical real-world application]

[complete Python code]
\`\`\`

**Expected Output:**
\`\`\`
[expected output]
\`\`\`

---

## ✏️ Exercise 1: [Exercise Name] *(Beginner)*
**Task:** [Clear, specific description of what to implement]

**Starter Code:**
\`\`\`python
# Complete this function
def [function_name]([params]):
    """[Docstring explaining what the function should do]"""
    # Your code here
    pass

# Test your solution
[test calls — e.g., print(function_name(args))]
\`\`\`

> 💡 **Hint:** [Helpful hint without giving away the answer]

**Solution:**
\`\`\`python
def [function_name]([params]):
    """[Docstring]"""
    [complete solution]

# Test
[test calls with expected output in comments]
\`\`\`

---

## ✏️ Exercise 2: [Exercise Name] *(Intermediate)*
**Task:** [Description]

**Starter Code:**
\`\`\`python
[starter code with TODO comments]
\`\`\`

> 💡 **Hint:** [Hint]

**Solution:**
\`\`\`python
[complete solution]
\`\`\`

---

## ✏️ Exercise 3: [Exercise Name] *(Advanced)*
**Task:** [Description — a more challenging, real-world inspired problem]

**Starter Code:**
\`\`\`python
[starter code]
\`\`\`

> 💡 **Hint:** [Hint]

**Solution:**
\`\`\`python
[complete solution]
\`\`\`

---

## 🔬 Mini-Project: [Project Name]
**Description:** [A small but complete project that applies all the concepts from this exercise]

\`\`\`python
# Complete mini-project solution
[complete, well-commented Python program]
\`\`\`

---

## 🏁 Key Takeaways
- ✅ [Key concept 1]
- ✅ [Key concept 2]
- ✅ [Key concept 3]
- ✅ [Key concept 4]

## 📚 Further Exploration
- [Related Python topic or standard library module to explore next]
- [Real-world application domain where this skill is used]
- [Advanced concept that builds on this exercise]

---

**Difficulty:** [Beginner / Intermediate / Advanced]
**Prerequisites:** [Required Python knowledge]
**Estimated Time:** [X–Y minutes]`,
}

// ── Small components ──────────────────────────────────────────────────────────

function ContentTypeCard({
  type,
  selected,
  onClick,
}: {
  type: ContentType
  selected: boolean
  onClick: () => void
}) {
  const cfg = CONTENT_TYPE_CONFIG[type]
  const Icon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${cfg.color}`}>
          <Icon className="w-5 h-5" weight="duotone" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{cfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cfg.description}</p>
        </div>
      </div>
    </button>
  )
}

function ContentBadge({ type }: { type: ContentType }) {
  const cfg = CONTENT_TYPE_CONFIG[type]
  const Icon = cfg.icon
  return (
    <Badge variant="secondary" className={`gap-1 ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  )
}

interface RenderedContentProps {
  markdown: string
}

function RenderedContent({ markdown }: RenderedContentProps) {
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

/** Extract ```python … ``` code blocks from Markdown, paired with a title. */
function extractPythonCodeBlocks(markdown: string): Array<{ title: string; code: string }> {
  const blocks: Array<{ title: string; code: string }> = []
  const lines = markdown.split('\n')
  let inBlock = false
  let currentCode: string[] = []
  let currentTitle = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inBlock && /^```python\s*$/i.test(line.trim())) {
      inBlock = true
      currentCode = []
      // Look back for a title (heading, bold, or comment on the preceding non-empty line)
      let prevLine = ''
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim()) {
          prevLine = lines[j].trim()
          break
        }
      }
      currentTitle = prevLine
        .replace(/^#+\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/^💻\s*/, '')
        .trim()
      continue
    }
    if (inBlock && line.trim() === '```') {
      inBlock = false
      const code = currentCode.join('\n').trim()
      if (code) blocks.push({ title: currentTitle, code })
      continue
    }
    if (inBlock) currentCode.push(line)
  }

  return blocks
}

/** Convert a YouTube watch URL to an embed URL. Returns null if not YouTube. */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    const isYouTubeHost =
      u.hostname === 'youtube.com' ||
      u.hostname === 'www.youtube.com' ||
      u.hostname === 'm.youtube.com'
    if (isYouTubeHost) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    // not a valid URL
  }
  return null
}

/** Convert a Google Slides edit URL to an embed URL. */
function getSlidesEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'docs.google.com' && u.pathname.includes('/presentation/')) {
      const match = u.pathname.match(/\/presentation\/d\/([^/]+)/)
      if (match) return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false`
    }
  } catch {
    // not a valid URL
  }
  return null
}

/** Embed any publicly accessible .pptx using Microsoft Office Online Viewer. */
function getPowerPointEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Already an Office Online viewer URL
    if (u.hostname === 'view.officeapps.live.com') return url
    // Any URL ending in .pptx in the pathname — wrap with the viewer
    if (/\.pptx$/i.test(u.pathname)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
    }
  } catch {
    // not a valid URL
  }
  return null
}

// ── Reading time & table-of-contents utilities ────────────────────────────────

/** Estimate reading time based on word count (~200 words/min for technical content). */
function estimateReadingTime(markdown: string): string {
  const words = markdown.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

interface TocEntry {
  level: number
  text: string
  id: string
}

/** Extract headings (H1–H3) from markdown for a table of contents. */
function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = []
  for (const line of markdown.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+)$/)
    if (!m) continue
    const text = m[2].replace(/[*_`[\]]/g, '').replace(/:\s*$/, '').trim()
    if (!text) continue
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    entries.push({ level: m[1].length, text, id })
  }
  return entries
}

// ── Table of Contents component ───────────────────────────────────────────────

function TableOfContents({ entries, contentRef }: { entries: TocEntry[]; contentRef: React.RefObject<HTMLDivElement | null> }) {
  if (entries.length < 3) return null

  const handleClick = (id: string) => {
    if (!contentRef.current) return
    // Find heading element by text match since marked doesn't add ids by default
    const headings = contentRef.current.querySelectorAll('h1, h2, h3')
    for (const heading of headings) {
      const headingId = heading.textContent
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      if (headingId === id) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" weight="duotone" />
          Contents
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 pb-3">
        <nav className="space-y-0.5">
          {entries.map((entry, i) => (
            <button
              key={i}
              onClick={() => handleClick(entry.id)}
              className={`w-full text-left text-xs py-1 px-2 rounded hover:bg-muted/60 transition-colors truncate
                ${entry.level === 1 ? 'font-semibold' : entry.level === 2 ? 'pl-4 text-muted-foreground' : 'pl-6 text-muted-foreground/70'}`}
            >
              {entry.text}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}

// ── Resource card ──────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onDelete,
}: {
  resource: Resource
  onDelete?: () => void
}) {
  const cfg = RESOURCE_TYPE_CONFIG[resource.type]
  const Icon = cfg.icon
  const youtubeEmbed = resource.type === 'video' ? getYouTubeEmbedUrl(resource.url) : null
  const slidesEmbed = resource.type === 'slides' ? getSlidesEmbedUrl(resource.url) : null
  const pptEmbed = resource.type === 'powerpoint' ? getPowerPointEmbedUrl(resource.url) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${cfg.color}`}>
          <Icon className="w-4 h-4" weight="duotone" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{resource.title}</p>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary truncate block"
          >
            {resource.url}
          </a>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
            onClick={onDelete}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Embed iframe for YouTube videos */}
      {youtubeEmbed && (
        <div className="aspect-video w-full rounded-lg overflow-hidden border">
          <iframe
            src={youtubeEmbed}
            title={resource.title}
            allowFullScreen
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Embed iframe for Google Slides */}
      {slidesEmbed && (
        <div className="aspect-video w-full rounded-lg overflow-hidden border">
          <iframe
            src={slidesEmbed}
            title={resource.title}
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Embed iframe for PowerPoint via Office Online Viewer */}
      {pptEmbed && (
        <div className="aspect-video w-full rounded-lg overflow-hidden border">
          <iframe
            src={pptEmbed}
            title={resource.title}
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}
      {!youtubeEmbed && !slidesEmbed && !pptEmbed && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
        >
          <Link className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">
            Open {cfg.label}
          </span>
        </a>
      )}
    </div>
  )
}

// ── Add-resource dialog ───────────────────────────────────────────────────────

function AddResourceDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (resource: Omit<Resource, 'id'>) => void
}) {
  const [type, setType] = useState<ResourceType>('video')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) return
    onAdd({ type, title: title.trim(), url: url.trim() })
    setTitle('')
    setUrl('')
    setType('video')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Attach a video, article, slides, or document to this content item.
        </p>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Resource Type</Label>
            <Select value={type} onValueChange={v => setType(v as ResourceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESOURCE_TYPE_CONFIG) as ResourceType[]).map(t => (
                  <SelectItem key={t} value={t}>
                    {RESOURCE_TYPE_CONFIG[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-title" className="text-xs">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="res-title"
              placeholder={
                type === 'video'
                  ? 'e.g. LOTO Safety Training Video'
                  : type === 'article'
                    ? 'e.g. OSHA 1910.147 Overview'
                    : type === 'slides'
                      ? 'e.g. Module 3 Slides'
                      : type === 'powerpoint'
                        ? 'e.g. Safety Training Presentation'
                        : 'e.g. Reference Manual PDF'
              }
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-url" className="text-xs">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="res-url"
              type="url"
              placeholder={
                type === 'video'
                  ? 'https://www.youtube.com/watch?v=...'
                  : type === 'slides'
                    ? 'https://docs.google.com/presentation/d/...'
                    : type === 'powerpoint'
                      ? 'https://example.com/presentation.pptx'
                      : 'https://...'
              }
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            {type === 'video' && (
              <p className="text-xs text-muted-foreground">
                YouTube videos will be embedded directly in the lesson viewer.
              </p>
            )}
            {type === 'slides' && (
              <p className="text-xs text-muted-foreground">
                Google Slides links will be embedded directly. Other slide formats will open in a
                new tab.
              </p>
            )}
            {type === 'powerpoint' && (
              <p className="text-xs text-muted-foreground">
                Public .pptx files are embedded via Microsoft Office Online Viewer.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!title.trim() || !url.trim()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AITrainingModule() {
  // KV state
  const [library, setLibrary] = useKV<TrainingContent[]>('ai-training-library', [])
  const [apiKey, setApiKey] = useKV<string>('mistral-api-key', '')
  const [progressRecords, setProgressRecords] = useKV<ProgressRecord[]>('ai-training-progress', [])

  // Generator panel
  const [contentType, setContentType] = useState<ContentType>('study-guide')
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // API key
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)

  // Generation flow
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const contentViewerRef = useRef<HTMLDivElement | null>(null)

  // View: generator | library | viewer | quiz-player | lesson-player | dashboard
  const [activeView, setActiveView] = useState<'generator' | 'library' | 'viewer' | 'quiz-player' | 'lesson-player' | 'dashboard'>(
    'generator'
  )
  const [viewingItem, setViewingItem] = useState<TrainingContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [libraryTab, setLibraryTab] = useState<ContentType | 'all'>('all')

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Resource management
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false)

  // Web research (Wikipedia)
  const [webResearchOpen, setWebResearchOpen] = useState(false)
  const [wikiQuery, setWikiQuery] = useState('')
  const [wikiResults, setWikiResults] = useState<Array<{ title: string; description: string; url: string }>>([])
  const [isSearchingWiki, setIsSearchingWiki] = useState(false)
  const [wikiSummaries, setWikiSummaries] = useState<Record<string, string>>({})
  const [selectedWikiTitles, setSelectedWikiTitles] = useState<Set<string>>(new Set())

  // ── Web research helpers ──────────────────────────────────────────────────────

  const handleWikiSearch = useCallback(async () => {
    const q = wikiQuery.trim() || topic.trim()
    if (!q) return
    setIsSearchingWiki(true)
    setWikiResults([])
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=6&format=json&origin=*`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Wikipedia search failed')
      const data = await res.json() as [string, string[], string[], string[]]
      setWikiResults(
        data[1].map((t, i) => ({
          title: t,
          description: data[2][i] || '',
          url: data[3][i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(t)}`,
        }))
      )
    } catch {
      toast.error('Wikipedia search failed — check your internet connection')
    } finally {
      setIsSearchingWiki(false)
    }
  }, [wikiQuery, topic])

  const handleToggleWikiContext = useCallback(async (result: { title: string; description: string; url: string }) => {
    if (selectedWikiTitles.has(result.title)) {
      setSelectedWikiTitles(prev => {
        const next = new Set(prev)
        next.delete(result.title)
        return next
      })
      return
    }
    // Fetch full summary if not cached
    if (!wikiSummaries[result.title]) {
      try {
        const encodedTitle = encodeURIComponent(result.title)
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`)
        if (res.ok) {
          const data = await res.json() as { extract?: string }
          setWikiSummaries(prev => ({ ...prev, [result.title]: data.extract || result.description }))
        }
      } catch {
        setWikiSummaries(prev => ({ ...prev, [result.title]: result.description }))
      }
    }
    setSelectedWikiTitles(prev => new Set([...prev, result.title]))
  }, [selectedWikiTitles, wikiSummaries])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // ── Progress tracking helpers ─────────────────────────────────────────────

  const safeProgress = progressRecords || []

  const handleQuizComplete = useCallback(
    (result: QuizCompletionResult) => {
      if (!viewingItem) return
      const record: ProgressRecord = {
        id: uuidv4(),
        contentId: viewingItem.id,
        contentTitle: viewingItem.title,
        contentType: viewingItem.contentType,
        completedAt: new Date().toISOString(),
        score: result.percentage,
        passed: result.passed,
      }
      setProgressRecords(prev => [record, ...(prev || [])])
      if (result.passed) {
        toast.success(`✓ Passed with ${result.percentage}%! Progress recorded.`)
      } else {
        toast.info(`Score: ${result.percentage}%. Keep practicing!`)
      }
    },
    [viewingItem, setProgressRecords]
  )

  const handleMarkViewed = useCallback(() => {
    if (!viewingItem) return
    // Avoid duplicate completion records for non-quiz content
    const alreadyCompleted = safeProgress.some(p => p.contentId === viewingItem.id)
    if (alreadyCompleted) {
      toast.info('Already marked as completed')
      return
    }
    const record: ProgressRecord = {
      id: uuidv4(),
      contentId: viewingItem.id,
      contentTitle: viewingItem.title,
      contentType: viewingItem.contentType,
      completedAt: new Date().toISOString(),
    }
    setProgressRecords(prev => [record, ...(prev || [])])
    toast.success('✓ Marked as completed!')
  }, [viewingItem, safeProgress, setProgressRecords])

  // Computed analytics
  const analytics = useMemo(() => {
    const safe = safeProgress
    const quizAttempts = safe.filter(p => p.contentType === 'quiz' || p.contentType === 'test')
    const passed = quizAttempts.filter(p => p.passed)
    const scores = quizAttempts.map(p => p.score ?? 0)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const completedIds = new Set(safe.map(p => p.contentId))
    // By type
    const byType: Partial<Record<ContentType, number>> = {}
    for (const p of safe) {
      byType[p.contentType] = (byType[p.contentType] ?? 0) + 1
    }
    return {
      total: safe.length,
      quizAttempts: quizAttempts.length,
      passed: passed.length,
      avgScore,
      completedIds,
      byType,
      recent: safe.slice(0, 8),
    }
  }, [safeProgress])

  const earnedBadges = useMemo(() => {
    const safeLib = library || []
    return ACHIEVEMENTS.filter(a => a.check(safeLib, safeProgress))
  }, [library, safeProgress])

  const isCompleted = useCallback(
    (contentId: string) => safeProgress.some(p => p.contentId === contentId),
    [safeProgress]
  )

  const bestScore = useCallback(
    (contentId: string) => {
      const attempts = safeProgress.filter(p => p.contentId === contentId && p.score != null)
      if (attempts.length === 0) return null
      return Math.max(...attempts.map(p => p.score ?? 0))
    },
    [safeProgress]
  )

  const handleSaveApiKey = useCallback(() => {
    setApiKey(apiKeyInput.trim())
    toast.success('API key saved')
  }, [apiKeyInput, setApiKey])

  const handleAddTag = useCallback(() => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      toast.error('Please save your Mistral API key first')
      return
    }
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setGenerating(true)
    setGeneratedContent('')
    setStreamingContent('')

    // Build web context from selected Wikipedia articles
    const webContextParts = Array.from(selectedWikiTitles)
      .map(t => wikiSummaries[t] ? `**${t}**: ${wikiSummaries[t]}` : '')
      .filter(Boolean)
    const fullContext = [
      context.trim(),
      webContextParts.length > 0 ? `Web research context:\n${webContextParts.join('\n\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const prompt = CONTENT_PROMPTS[contentType](topic.trim(), fullContext)
    abortRef.current = new AbortController()

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert instructional designer and subject-matter educator. Create high-quality, well-structured training content using rich Markdown formatting. Be thorough, accurate, and engaging. For quizzes and tests, always follow the exact format specified — this is critical for the interactive quiz player to work correctly.',
            },
            { role: 'user', content: prompt },
          ],
          stream: true,
          // 8192 tokens allows comprehensive content (study guides, full-length tests, detailed lessons)
          max_tokens: 8192,
          temperature: 0.7,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(err?.message || `API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                setStreamingContent(fullContent)
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      }

      setGeneratedContent(fullContent)
      setStreamingContent('')
      toast.success('Content generated successfully')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        toast.info('Generation cancelled')
      } else {
        const message = err instanceof Error ? err.message : 'Failed to generate content'
        toast.error(message)
      }
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }, [apiKey, contentType, topic, context, selectedWikiTitles, wikiSummaries])

  const handleCancelGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleSaveToLibrary = useCallback(() => {
    const finalTitle = title.trim() || `${CONTENT_TYPE_CONFIG[contentType].label}: ${topic.trim()}`
    const item: TrainingContent = {
      id: uuidv4(),
      title: finalTitle,
      topic: topic.trim(),
      contentType,
      content: generatedContent,
      createdAt: new Date().toISOString(),
      tags,
      resources: [],
    }
    setLibrary(prev => [item, ...(prev || [])])
    toast.success('Saved to library')
    setGeneratedContent('')
    setStreamingContent('')
    setTitle('')
    setTags([])
  }, [title, contentType, topic, generatedContent, tags, setLibrary])

  const handleDeleteItem = useCallback(
    (id: string) => {
      setLibrary(prev => (prev || []).filter(item => item.id !== id))
      if (viewingItem?.id === id) {
        setViewingItem(null)
        setActiveView('library')
      }
      setDeleteConfirmId(null)
      toast.success('Removed from library')
    },
    [setLibrary, viewingItem]
  )

  const handleViewItem = useCallback((item: TrainingContent) => {
    setViewingItem(item)
    setActiveView('viewer')
  }, [])

  const handleTakeQuiz = useCallback((item: TrainingContent) => {
    setViewingItem(item)
    setActiveView('quiz-player')
  }, [])

  const handleStartLesson = useCallback((item: TrainingContent) => {
    setViewingItem(item)
    setActiveView('lesson-player')
  }, [])

  const handleLessonComplete = useCallback(() => {
    if (!viewingItem) return
    const alreadyCompleted = safeProgress.some(p => p.contentId === viewingItem.id)
    if (alreadyCompleted) {
      toast.info('Lesson already marked as completed')
      return
    }
    const record: ProgressRecord = {
      id: uuidv4(),
      contentId: viewingItem.id,
      contentTitle: viewingItem.title,
      contentType: viewingItem.contentType,
      completedAt: new Date().toISOString(),
    }
    setProgressRecords(prev => [record, ...(prev || [])])
    toast.success('🎉 Lesson completed! Progress recorded.')
  }, [viewingItem, safeProgress, setProgressRecords])

  const handleAddResource = useCallback(
    (resource: Omit<Resource, 'id'>) => {
      if (!viewingItem) return
      const newResource: Resource = { ...resource, id: uuidv4() }
      const updatedItem: TrainingContent = {
        ...viewingItem,
        resources: [...(viewingItem.resources || []), newResource],
      }
      setLibrary(prev => (prev || []).map(item => (item.id === updatedItem.id ? updatedItem : item)))
      setViewingItem(updatedItem)
      toast.success('Resource added')
    },
    [viewingItem, setLibrary]
  )

  const handleRemoveResource = useCallback(
    (resourceId: string) => {
      if (!viewingItem) return
      const updatedItem: TrainingContent = {
        ...viewingItem,
        resources: (viewingItem.resources || []).filter(r => r.id !== resourceId),
      }
      setLibrary(prev => (prev || []).map(item => (item.id === updatedItem.id ? updatedItem : item)))
      setViewingItem(updatedItem)
      toast.success('Resource removed')
    },
    [viewingItem, setLibrary]
  )

  const displayContent = streamingContent || generatedContent

  const safeLibrary = library || []
  const filteredLibrary = safeLibrary.filter(item => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = libraryTab === 'all' || item.contentType === libraryTab
    return matchesSearch && matchesType
  })

  // Count items per content type (for tab badges)
  const libCountByType = useMemo(() => {
    const counts: Partial<Record<ContentType | 'all', number>> = { all: safeLibrary.length }
    for (const item of safeLibrary) {
      counts[item.contentType] = (counts[item.contentType] ?? 0) + 1
    }
    return counts
  }, [safeLibrary])

  // Viewer navigation: find adjacent items within the currently filtered library view
  const viewerNeighbors = useMemo(() => {
    if (!viewingItem) return { prev: null, next: null }
    const idx = filteredLibrary.findIndex(item => item.id === viewingItem.id)
    if (idx === -1) {
      // Item not in current filter — fall back to full library
      const fullIdx = safeLibrary.findIndex(item => item.id === viewingItem.id)
      return {
        prev: fullIdx > 0 ? safeLibrary[fullIdx - 1] : null,
        next: fullIdx < safeLibrary.length - 1 ? safeLibrary[fullIdx + 1] : null,
      }
    }
    return {
      prev: idx > 0 ? filteredLibrary[idx - 1] : null,
      next: idx < filteredLibrary.length - 1 ? filteredLibrary[idx + 1] : null,
    }
  }, [viewingItem, filteredLibrary, safeLibrary])

  // Table of contents for the current viewer item (memoized on content string)
  const viewerToc = useMemo(() => {
    if (!viewingItem) return []
    if (viewingItem.contentType !== 'study-guide' && viewingItem.contentType !== 'interactive-lesson') return []
    return extractToc(viewingItem.content)
  }, [viewingItem?.content, viewingItem?.contentType])

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="w-6 h-6 text-primary" weight="duotone" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Training Studio</h2>
            <p className="text-sm text-muted-foreground">
              Generate illustrated study guides, interactive lessons, and graded quizzes with AI
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'generator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('generator')}
          >
            <Sparkle className="w-4 h-4 mr-1.5" />
            Generate
          </Button>
          <Button
            variant={
              activeView === 'library' || activeView === 'viewer' || activeView === 'quiz-player' || activeView === 'lesson-player'
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => setActiveView('library')}
          >
            <GraduationCap className="w-4 h-4 mr-1.5" />
            Library
            {safeLibrary.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {safeLibrary.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('dashboard')}
          >
            <ChartBar className="w-4 h-4 mr-1.5" />
            Progress
            {analytics.total > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {analytics.total}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ── Generator View ─────────────────────────────────────────────────────── */}
      {activeView === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Config */}
          <div className="lg:col-span-1 space-y-4">
            {/* API Key */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  Mistral API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setShowApiKey(v => !v)}
                    title={showApiKey ? 'Hide' : 'Show'}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                >
                  Save Key
                </Button>
                {apiKey ? (
                  <p className="text-xs text-green-600 dark:text-green-400">✓ API key saved</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Get your key at <span className="font-medium">console.mistral.ai</span>
                  </p>
                )}
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Your key is stored in this session only and sent directly from your browser.
                </p>
              </CardContent>
            </Card>

            {/* Content Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Content Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map(type => (
                  <ContentTypeCard
                    key={type}
                    type={type}
                    selected={contentType === type}
                    onClick={() => setContentType(type)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Topic & Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Topic & Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="topic" className="text-xs">
                    Topic <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g. Lockout/Tagout procedures"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="context" className="text-xs">
                    Context / Audience (optional)
                  </Label>
                  <Input
                    id="context"
                    placeholder="e.g. maintenance technicians"
                    value={context}
                    onChange={e => setContext(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">
                    Custom Title (optional)
                  </Label>
                  <Input
                    id="title"
                    placeholder="Leave blank for auto-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag…"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                      className="text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 text-xs cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {generating ? (
                  <Button className="w-full" variant="destructive" onClick={handleCancelGeneration}>
                    Cancel Generation
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={!topic.trim() || !apiKey}
                  >
                    <Sparkle className="w-4 h-4 mr-1.5" />
                    Generate Content
                    {selectedWikiTitles.size > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                        +{selectedWikiTitles.size} web
                      </Badge>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Web Research */}
            <Card>
              <CardHeader
                className="pb-3 cursor-pointer select-none"
                onClick={() => setWebResearchOpen(v => !v)}
              >
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Web Research
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedWikiTitles.size > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedWikiTitles.size} in context
                      </Badge>
                    )}
                    {webResearchOpen ? (
                      <CaretUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <CaretDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {webResearchOpen && (
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Search Wikipedia to retrieve real-world context. Selected articles are included
                    in the AI prompt, giving the model access to up-to-date information for more
                    accurate and comprehensive content.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder={topic.trim() || 'Search topic…'}
                      value={wikiQuery}
                      onChange={e => setWikiQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleWikiSearch()}
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleWikiSearch}
                      disabled={isSearchingWiki}
                      title="Search Wikipedia"
                    >
                      {isSearchingWiki ? (
                        <ArrowClockwise className="w-4 h-4 animate-spin" />
                      ) : (
                        <MagnifyingGlass className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {wikiResults.length > 0 && (
                    <div className="space-y-2">
                      {wikiResults.map(result => {
                        const selected = selectedWikiTitles.has(result.title)
                        return (
                          <div
                            key={result.title}
                            className={`p-2.5 rounded-lg border text-xs transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{result.title}</p>
                                {result.description && (
                                  <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant={selected ? 'default' : 'outline'}
                                size="sm"
                                className="h-6 text-xs shrink-0"
                                onClick={() => handleToggleWikiContext(result)}
                              >
                                <BookmarkSimple
                                  className="w-3 h-3 mr-1"
                                  weight={selected ? 'fill' : 'regular'}
                                />
                                {selected ? 'In Context' : 'Add to Context'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {selectedWikiTitles.size > 0 && (
                    <p className="text-xs text-primary font-medium">
                      ✓ {selectedWikiTitles.size} article{selectedWikiTitles.size !== 1 ? 's' : ''}{' '}
                      will be included as context when generating content.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right: Content Output */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Generated Content</CardTitle>
                  {generating && (
                    <Badge variant="secondary" className="gap-1 animate-pulse">
                      <Sparkle className="w-3 h-3" />
                      Generating…
                    </Badge>
                  )}
                </div>
                {generatedContent && !generating && (
                  <Button size="sm" onClick={handleSaveToLibrary}>
                    <FloppyDisk className="w-4 h-4 mr-1.5" />
                    Save to Library
                  </Button>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4 overflow-hidden">
                {displayContent ? (
                  <ScrollArea className="h-[calc(100vh-22rem)] pr-2">
                    <RenderedContent markdown={displayContent} />
                  </ScrollArea>
                ) : (
                  <div className="h-[calc(100vh-22rem)] flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                    <Brain className="w-12 h-12 opacity-20" weight="duotone" />
                    <div>
                      <p className="font-medium">Ready to generate</p>
                      <p className="text-sm mt-1">
                        Select a content type, enter a topic, and click{' '}
                        <span className="font-semibold">Generate Content</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-left mt-4 max-w-sm">
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="font-semibold flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Study Guide
                        </p>
                        <p className="text-muted-foreground mt-1">Illustrated, comprehensive reference</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="font-semibold flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5" /> Interactive Quiz
                        </p>
                        <p className="text-muted-foreground mt-1">Take it digitally, get scored</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="font-semibold flex items-center gap-1">
                          <List className="w-3.5 h-3.5" /> Formal Test
                        </p>
                        <p className="text-muted-foreground mt-1">Mixed questions, graded assessment</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="font-semibold flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5" /> Interactive Lesson
                        </p>
                        <p className="text-muted-foreground mt-1">Activities, scenarios, discussions</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="font-semibold flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> Python Exercise
                        </p>
                        <p className="text-muted-foreground mt-1">Runnable coding exercises in-browser</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Library View ──────────────────────────────────────────────────────── */}
      {activeView === 'library' && (
        <div className="space-y-4">
          {/* Search bar + New Content button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search library…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setActiveView('generator')}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Content
            </Button>
          </div>

          {/* Content-type tab filter */}
          <Tabs
            value={libraryTab}
            onValueChange={v => setLibraryTab(v as ContentType | 'all')}
            className="space-y-4"
          >
            <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="all" className="text-xs gap-1.5">
                <List className="w-3.5 h-3.5" />
                All
                {(libCountByType.all ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="study-guide" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Study Guides
                {(libCountByType['study-guide'] ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType['study-guide']}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interactive-lesson" className="text-xs gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Lessons
                {(libCountByType['interactive-lesson'] ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType['interactive-lesson']}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs gap-1.5">
                <Question className="w-3.5 h-3.5" />
                Quizzes
                {(libCountByType['quiz'] ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType['quiz']}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="test" className="text-xs gap-1.5">
                <ClipboardText className="w-3.5 h-3.5" />
                Tests
                {(libCountByType['test'] ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType['test']}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="python-exercise" className="text-xs gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Python
                {(libCountByType['python-exercise'] ?? 0) > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5">
                    {libCountByType['python-exercise']}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab content panels — share the same card grid */}
            {(['all', 'study-guide', 'interactive-lesson', 'quiz', 'test', 'python-exercise'] as const).map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                {filteredLibrary.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                      <GraduationCap className="w-12 h-12 opacity-20" weight="duotone" />
                      <div>
                        <p className="font-medium">
                          {safeLibrary.length === 0 ? 'Your library is empty' : 'No results found'}
                        </p>
                        <p className="text-sm mt-1">
                          {safeLibrary.length === 0
                            ? 'Generate content and save it here for future reference'
                            : 'Try adjusting your search or switching tabs'}
                        </p>
                      </div>
                      {safeLibrary.length === 0 && (
                        <Button variant="outline" size="sm" onClick={() => setActiveView('generator')}>
                          <Sparkle className="w-4 h-4 mr-1.5" />
                          Generate your first item
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredLibrary.map(item => {
                      const cfg = CONTENT_TYPE_CONFIG[item.contentType]
                      const Icon = cfg.icon
                      const isQuizOrTest = item.contentType === 'quiz' || item.contentType === 'test'
                      const completed = isCompleted(item.id)
                      const best = bestScore(item.id)
                      const readTime = estimateReadingTime(item.content)
                      return (
                        <Card
                          key={item.id}
                          className="flex flex-col hover:shadow-md transition-shadow group"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className={`p-2 rounded-lg ${cfg.color} shrink-0`}>
                                <Icon className="w-4 h-4" weight="duotone" />
                              </div>
                              <div className="flex items-center gap-1">
                                {completed && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-xs gap-1 bg-green-500/10 text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3" weight="fill" />
                                    Done
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setDeleteConfirmId(item.id)
                                  }}
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <CardTitle className="text-sm mt-2 leading-snug line-clamp-2">
                              {item.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                            <p className="text-xs text-muted-foreground">
                              Topic: <span className="font-medium">{item.topic}</span>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <ContentBadge type={item.contentType} />
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {readTime}
                              </span>
                            </div>
                            {best !== null && (
                              <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-yellow-500" weight="fill" />
                                <span className="text-xs font-medium">Best: {best}%</span>
                                {best >= PASSING_SCORE && (
                                  <Badge className="h-4 px-1.5 text-xs bg-green-600 hover:bg-green-600 text-white">Pass</Badge>
                                )}
                              </div>
                            )}
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {(item.resources?.length ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {item.resources?.length} resource{item.resources?.length !== 1 ? 's' : ''}{' '}
                                attached
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-auto pt-2">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => handleViewItem(item)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                              {isQuizOrTest && (
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleTakeQuiz(item)}
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" weight="fill" />
                                  {item.contentType === 'quiz' ? 'Take Quiz' : 'Take Test'}
                                </Button>
                              )}
                              {item.contentType === 'interactive-lesson' && (
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
                                  onClick={() => handleStartLesson(item)}
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" weight="fill" />
                                  Start Lesson
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* ── Viewer View ───────────────────────────────────────────────────────── */}
      {activeView === 'viewer' && viewingItem && (
        <div className="space-y-4">
          {/* Top bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setActiveView('library')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Library
            </Button>
            {viewerNeighbors.prev && (
              <Button variant="ghost" size="sm" onClick={() => viewerNeighbors.prev && handleViewItem(viewerNeighbors.prev)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
            )}
            {viewerNeighbors.next && (
              <Button variant="ghost" size="sm" onClick={() => viewerNeighbors.next && handleViewItem(viewerNeighbors.next)}>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Separator orientation="vertical" className="h-4" />
            <ContentBadge type={viewingItem.contentType} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {estimateReadingTime(viewingItem.content)}
            </span>
            {viewingItem.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            <div className="ml-auto flex gap-2">
              {viewingItem.contentType !== 'quiz' && viewingItem.contentType !== 'test' && (
                <Button
                  size="sm"
                  variant={isCompleted(viewingItem.id) ? 'secondary' : 'outline'}
                  className={isCompleted(viewingItem.id) ? 'text-green-600' : ''}
                  onClick={handleMarkViewed}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" weight={isCompleted(viewingItem.id) ? 'fill' : 'regular'} />
                  {isCompleted(viewingItem.id) ? 'Completed' : 'Mark Complete'}
                </Button>
              )}
              {(viewingItem.contentType === 'quiz' || viewingItem.contentType === 'test') && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleTakeQuiz(viewingItem)}
                >
                  <Play className="w-4 h-4 mr-1.5" weight="fill" />
                  {viewingItem.contentType === 'quiz' ? 'Take Quiz' : 'Take Test'}
                </Button>
              )}
              {viewingItem.contentType === 'interactive-lesson' && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleStartLesson(viewingItem)}
                >
                  <Play className="w-4 h-4 mr-1.5" weight="fill" />
                  Start Lesson
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirmId(viewingItem.id)}
              >
                <Trash className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main content */}
            <div className={viewingItem.contentType === 'python-exercise' ? 'xl:col-span-3' : 'xl:col-span-2'}>
              <Card>
                <CardHeader>
                  <CardTitle>{viewingItem.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Topic: <span className="font-medium">{viewingItem.topic}</span> · Created{' '}
                    {new Date(viewingItem.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <ScrollArea className="h-[calc(100vh-18rem)] pr-2">
                    <div ref={contentViewerRef}>
                      <RenderedContent markdown={viewingItem.content} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Python Playgrounds (one per code block) */}
              {viewingItem.contentType === 'python-exercise' &&
                extractPythonCodeBlocks(viewingItem.content).map((block, idx) => (
                  <div key={idx} className="mt-4">
                    <PythonPlayground
                      initialCode={block.code}
                      title={block.title || `Runnable Example ${idx + 1}`}
                      description="Edit and run this Python code directly in your browser."
                    />
                  </div>
                ))}

              {/* Free-form playground for python exercises */}
              {viewingItem.contentType === 'python-exercise' && (
                <div className="mt-4">
                  <PythonPlayground
                    title="Free Python Playground"
                    description="Experiment freely — write and run any Python code here."
                  />
                </div>
              )}
            </div>

            {/* Resources sidebar — hidden for python-exercise (full-width layout) */}
            {viewingItem.contentType !== 'python-exercise' && (
            <div className="xl:col-span-1 space-y-4">
              {/* Table of contents for study guides and lessons */}
              {viewerToc.length >= 3 && (
                <TableOfContents entries={viewerToc} contentRef={contentViewerRef} />
              )}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Attached Resources</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAddResourceDialogOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {(viewingItem.resources?.length ?? 0) === 0 ? (
                    <div className="text-center py-6 text-muted-foreground space-y-2">
                      <Link className="w-8 h-8 mx-auto opacity-20" />
                      <p className="text-xs">No resources attached yet</p>
                      <p className="text-xs">
                        Add videos, articles, slides, or documents to enrich this content
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setAddResourceDialogOpen(true)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Resource
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {viewingItem.resources?.map(resource => (
                        <div key={resource.id}>
                          <ResourceCard
                            resource={resource}
                            onDelete={() => handleRemoveResource(resource.id)}
                          />
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick tip for quiz/test */}
              {(viewingItem.contentType === 'quiz' || viewingItem.contentType === 'test') && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Play
                        className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                        weight="fill"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Ready to test your knowledge?
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Take this {viewingItem.contentType} interactively and get an instant score.
                          70% or above to pass.
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                          onClick={() => handleTakeQuiz(viewingItem)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" weight="fill" />
                          Start Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick tip for interactive lesson */}
              {viewingItem.contentType === 'interactive-lesson' && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Play
                        className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5"
                        weight="fill"
                      />
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Ready to learn?
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          Step through this lesson section by section with activities and
                          hands-on practice.
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs h-7"
                          onClick={() => handleStartLesson(viewingItem)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" weight="fill" />
                          Start Lesson
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quiz / Test Player ────────────────────────────────────────────────── */}
      {activeView === 'quiz-player' && viewingItem && (
        <InteractiveQuizPlayer
          title={viewingItem.title}
          content={viewingItem.content}
          contentType={viewingItem.contentType as 'quiz' | 'test'}
          onBack={() => setActiveView('library')}
          onComplete={handleQuizComplete}
        />
      )}

      {/* ── Interactive Lesson Player ─────────────────────────────────────────── */}
      {activeView === 'lesson-player' && viewingItem && (
        <InteractiveLessonPlayer
          title={viewingItem.title}
          content={viewingItem.content}
          resources={viewingItem.resources}
          onBack={() => setActiveView('library')}
          onComplete={handleLessonComplete}
        />
      )}

      {/* ── Progress Dashboard ────────────────────────────────────────────────── */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">{analytics.completedIds.size}</p>
                <p className="text-xs text-muted-foreground mt-1">Items Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-orange-500">{analytics.quizAttempts}</p>
                <p className="text-xs text-muted-foreground mt-1">Quiz Attempts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-green-600">{analytics.passed}</p>
                <p className="text-xs text-muted-foreground mt-1">Quizzes Passed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 text-center">
                <p className={`text-3xl font-bold ${analytics.avgScore >= PASSING_SCORE ? 'text-green-600' : analytics.avgScore > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {analytics.avgScore > 0 ? `${analytics.avgScore}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievement Badges */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" weight="duotone" />
                  Achievement Badges
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {earnedBadges.length} / {ACHIEVEMENTS.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {ACHIEVEMENTS.map(achievement => {
                    const earned = earnedBadges.some(b => b.id === achievement.id)
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          earned
                            ? 'border-yellow-300 bg-yellow-50/40 dark:bg-yellow-950/20 dark:border-yellow-700'
                            : 'border-border bg-muted/20 opacity-50'
                        }`}
                      >
                        <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{achievement.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content type breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChartBar className="w-4 h-4 text-muted-foreground" weight="duotone" />
                  Completions by Content Type
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {(() => {
                  const maxCount = Math.max(...Object.values(analytics.byType).map(v => v ?? 0), 1)
                  return (Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map(type => {
                    const cfg = CONTENT_TYPE_CONFIG[type]
                    const Icon = cfg.icon
                    const count = analytics.byType[type] ?? 0
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Icon className="w-3.5 h-3.5" weight="duotone" />
                            {cfg.label}
                          </span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={(count / maxCount) * 100} className="h-2" />
                      </div>
                    )
                  })
                })()}
                {analytics.total === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No completions yet — start learning to see your progress!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" weight="duotone" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {analytics.recent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <Medal className="w-10 h-10 mx-auto opacity-20" weight="duotone" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs">Complete quizzes, read lessons, or run Python exercises to track your progress</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveView('library')}>
                    Go to Library
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.recent.map(record => {
                    const cfg = CONTENT_TYPE_CONFIG[record.contentType]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                      >
                        <div className={`p-1.5 rounded-md ${cfg.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{record.contentTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.completedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {record.score != null && (
                            <Badge
                              className={`text-xs ${
                                record.passed
                                  ? 'bg-green-600 hover:bg-green-600 text-white'
                                  : 'bg-red-500 hover:bg-red-500 text-white'
                              }`}
                            >
                              {record.score}% {record.passed ? '✓' : '✗'}
                            </Badge>
                          )}
                          {record.score == null && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle className="w-3 h-3" weight="fill" />
                              Viewed
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Add Resource Dialog ───────────────────────────────────────────────── */}
      <AddResourceDialog
        open={addResourceDialogOpen}
        onClose={() => setAddResourceDialogOpen(false)}
        onAdd={handleAddResource}
      />

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Library?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the item from your training library. This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteItem(deleteConfirmId)}
            >
              <Trash className="w-4 h-4 mr-1.5" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
