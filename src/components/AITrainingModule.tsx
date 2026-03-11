import { useState, useRef, useCallback } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  MagnifyingGlass,
  Plus,
  X,
  Desktop,
  Cloud,
  Cpu,
  Info,
  ArrowsClockwise,
} from '@phosphor-icons/react'

export type ContentType = 'study-guide' | 'quiz' | 'test' | 'interactive-lesson'

export interface TrainingContent {
  id: string
  title: string
  topic: string
  contentType: ContentType
  content: string
  createdAt: string
  tags: string[]
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  'study-guide': {
    label: 'Study Guide',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    description: 'Comprehensive reference material with key concepts and explanations',
  },
  'quiz': {
    label: 'Quiz',
    icon: Question,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    description: 'Multiple-choice questions to test knowledge retention',
  },
  'test': {
    label: 'Test',
    icon: ClipboardText,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    description: 'Formal assessment with mixed question types',
  },
  'interactive-lesson': {
    label: 'Interactive Lesson',
    icon: Lightbulb,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    description: 'Step-by-step lesson with activities and discussion prompts',
  },
}

const CONTENT_PROMPTS: Record<ContentType, (topic: string, context: string) => string> = {
  'study-guide': (topic, context) =>
    `Create a comprehensive study guide on "${topic}"${context ? ` for a ${context} context` : ''}. Structure it with:

1. **Overview** – A clear, concise introduction to the topic
2. **Key Concepts** – Bullet-pointed list of essential ideas with brief explanations
3. **Detailed Sections** – In-depth coverage of each key concept with examples
4. **Key Terms / Glossary** – Important vocabulary with definitions
5. **Summary** – A concise recap of the most important points
6. **Review Questions** – 5 questions to self-test understanding

Use well-structured Markdown formatting with headers, bullet points, and bold text for emphasis.`,

  'quiz': (topic, context) =>
    `Create an interactive quiz on "${topic}"${context ? ` relevant to a ${context} context` : ''}. Include:

- **15 multiple-choice questions** with 4 answer options each (A, B, C, D)
- After each question, clearly mark the correct answer with **✓ Correct Answer: [letter]**
- Provide a **brief explanation** (1-2 sentences) for why the answer is correct

Format each question like:
**Question N:** [question text]
A) option
B) option
C) option
D) option
✓ Correct Answer: [letter] – [explanation]

Use well-structured Markdown throughout.`,

  'test': (topic, context) =>
    `Create a formal assessment test on "${topic}"${context ? ` for a ${context} environment` : ''}. Include:

### Part 1: Multiple Choice (5 questions)
- 4 options each, mark correct with ✓

### Part 2: True / False (5 questions)
- Mark correct answer in bold

### Part 3: Short Answer (3 questions)
- Provide a model answer for each

### Part 4: Essay / Scenario (1 question)
- Include grading criteria (what a strong answer should cover)

Use well-structured Markdown with clear section headers.`,

  'interactive-lesson': (topic, context) =>
    `Create an interactive lesson plan on "${topic}"${context ? ` for a ${context} setting` : ''}. Structure it with:

1. **Learning Objectives** – 3-5 clear, measurable outcomes
2. **Introduction / Hook** – An engaging opening scenario or question
3. **Section 1** – First concept with explanation + embedded activity or reflection prompt
4. **Section 2** – Second concept with explanation + embedded activity
5. **Section 3** – Third concept (if applicable) + embedded activity
6. **Practice Scenarios** – 2-3 realistic scenarios for learners to apply knowledge
7. **Group Discussion Questions** – 3 questions to stimulate conversation
8. **Key Takeaways** – Bullet-pointed summary of the lesson
9. **Further Exploration** – Suggested resources or next steps

Use well-structured Markdown with clear headers and engaging language throughout.`,
}

// ---------------------------------------------------------------------------
// Local edge-model support
// ---------------------------------------------------------------------------

export type AIProvider = 'mistral' | 'local'

export const RECOMMENDED_LOCAL_MODELS = [
  {
    id: 'phi3:mini',
    name: 'Phi-3 Mini',
    params: '3.8B',
    size: '~2.3 GB',
    vendor: 'Microsoft',
    notes: 'Best quality-to-speed balance on CPU',
  },
  {
    id: 'phi3.5',
    name: 'Phi-3.5 Mini',
    params: '3.8B',
    size: '~2.2 GB',
    vendor: 'Microsoft',
    notes: 'Improved reasoning over Phi-3',
  },
  {
    id: 'gemma2:2b',
    name: 'Gemma 2',
    params: '2B',
    size: '~1.6 GB',
    vendor: 'Google',
    notes: 'Lightweight with solid comprehension',
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2',
    params: '3B',
    size: '~2.0 GB',
    vendor: 'Meta',
    notes: 'Versatile, well-rounded instruction model',
  },
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 (1B)',
    params: '1B',
    size: '~1.3 GB',
    vendor: 'Meta',
    notes: 'Smallest Llama, fastest inference',
  },
  {
    id: 'qwen2.5:1.5b',
    name: 'Qwen 2.5',
    params: '1.5B',
    size: '~1.0 GB',
    vendor: 'Alibaba',
    notes: 'Tiny footprint, multilingual support',
  },
  {
    id: 'deepseek-r1:1.5b',
    name: 'DeepSeek-R1',
    params: '1.5B',
    size: '~1.1 GB',
    vendor: 'DeepSeek',
    notes: 'Strong reasoning capabilities',
  },
] as const

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1'
const MISTRAL_MODEL = 'mistral-large-latest'
const DEFAULT_LOCAL_ENDPOINT = 'http://localhost:11434/v1'
const DEFAULT_LOCAL_MODEL = 'phi3:mini'

const SYSTEM_MESSAGE = {
  role: 'system',
  content:
    'You are an expert instructional designer and subject-matter educator. Create high-quality, well-structured training content using clear Markdown formatting. Be thorough, accurate, and engaging.',
}

/** Shared SSE streaming helper – works with Mistral and any OpenAI-compatible API (Ollama, LM Studio, Jan). */
async function streamChatCompletion(
  baseEndpoint: string,
  model: string,
  authHeader: string | null,
  messages: Array<{ role: string; content: string }>,
  signal: AbortSignal,
  onChunk: (fullContent: string) => void
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) headers['Authorization'] = authHeader

  const response = await fetch(`${baseEndpoint}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal,
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
            onChunk(fullContent)
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }

  return fullContent
}

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
      className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function AITrainingModule() {
  // KV state
  const [library, setLibrary] = useKV<TrainingContent[]>('ai-training-library', [])
  const [apiKey, setApiKey] = useKV<string>('mistral-api-key', '')
  const [aiProvider, setAiProvider] = useKV<AIProvider>('ai-provider', 'mistral')
  const [localEndpoint, setLocalEndpoint] = useKV<string>('local-model-endpoint', DEFAULT_LOCAL_ENDPOINT)
  const [localModel, setLocalModel] = useKV<string>('local-model-name', DEFAULT_LOCAL_MODEL)
  const [enableFallback, setEnableFallback] = useKV<boolean>('ai-fallback-enabled', false)

  // Local state – Generator panel
  const [contentType, setContentType] = useState<ContentType>('study-guide')
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Local state – API key
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [localEndpointInput, setLocalEndpointInput] = useState(localEndpoint || DEFAULT_LOCAL_ENDPOINT)
  const [localModelInput, setLocalModelInput] = useState(localModel || DEFAULT_LOCAL_MODEL)

  // Local state – Generation flow
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Local state – View
  const [activeView, setActiveView] = useState<'generator' | 'library' | 'viewer'>('generator')
  const [viewingItem, setViewingItem] = useState<TrainingContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all')

  // Local state – Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleSaveApiKey = useCallback(() => {
    setApiKey(apiKeyInput.trim())
    toast.success('API key saved')
  }, [apiKeyInput, setApiKey])

  const handleSaveLocalConfig = useCallback(() => {
    setLocalEndpoint(localEndpointInput.trim() || DEFAULT_LOCAL_ENDPOINT)
    setLocalModel(localModelInput.trim() || DEFAULT_LOCAL_MODEL)
    toast.success('Local model configuration saved')
  }, [localEndpointInput, localModelInput, setLocalEndpoint, setLocalModel])

  const handleSelectRecommendedModel = useCallback(
    (modelId: string) => {
      setLocalModelInput(modelId)
      setLocalModel(modelId)
      if (aiProvider !== 'local') setAiProvider('local')
      toast.success(`Switched to ${modelId}`)
    },
    [aiProvider, setAiProvider, setLocalModel]
  )

  const handleAddTag = useCallback(() => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (aiProvider === 'mistral' && !apiKey) {
      toast.error('Please save your Mistral API key first')
      return
    }
    if (aiProvider === 'local' && !localEndpoint) {
      toast.error('Please configure your local model endpoint first')
      return
    }
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setGenerating(true)
    setGeneratedContent('')
    setStreamingContent('')

    const prompt = CONTENT_PROMPTS[contentType](topic.trim(), context.trim())
    const messages = [SYSTEM_MESSAGE, { role: 'user', content: prompt }]

    abortRef.current = new AbortController()

    try {
      let fullContent = ''

      if (aiProvider === 'mistral') {
        try {
          fullContent = await streamChatCompletion(
            MISTRAL_BASE_URL,
            MISTRAL_MODEL,
            `Bearer ${apiKey}`,
            messages,
            abortRef.current.signal,
            text => setStreamingContent(text)
          )
          toast.success('Content generated successfully')
        } catch (mistralErr) {
          if (mistralErr instanceof Error && mistralErr.name === 'AbortError') throw mistralErr
          if (enableFallback && localEndpoint) {
            toast.warning('Mistral API unavailable — falling back to local model…')
            setStreamingContent('')
            fullContent = await streamChatCompletion(
              localEndpoint,
              localModel || DEFAULT_LOCAL_MODEL,
              null,
              messages,
              abortRef.current.signal,
              text => setStreamingContent(text)
            )
            toast.success(`Content generated via local model (${localModel || DEFAULT_LOCAL_MODEL})`)
          } else {
            throw mistralErr
          }
        }
      } else {
        fullContent = await streamChatCompletion(
          localEndpoint || DEFAULT_LOCAL_ENDPOINT,
          localModel || DEFAULT_LOCAL_MODEL,
          null,
          messages,
          abortRef.current.signal,
          text => setStreamingContent(text)
        )
        toast.success(`Content generated via local model (${localModel || DEFAULT_LOCAL_MODEL})`)
      }

      setGeneratedContent(fullContent)
      setStreamingContent('')
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
  }, [aiProvider, apiKey, localEndpoint, localModel, enableFallback, contentType, topic, context])

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
    }
    setLibrary(prev => [item, ...(prev || [])])
    toast.success('Saved to library')
    // Reset form
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

  const displayContent = streamingContent || generatedContent

  const safeLibrary = library || []
  const filteredLibrary = safeLibrary.filter(item => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || item.contentType === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="w-6 h-6 text-primary" weight="duotone" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Training Studio</h2>
            <p className="text-sm text-muted-foreground">
              Generate study guides, quizzes, tests, and interactive lessons with Mistral AI or a local edge model
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
            variant={activeView === 'library' || activeView === 'viewer' ? 'default' : 'outline'}
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
        </div>
      </div>

      {/* Generator View */}
      {activeView === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Config */}
          <div className="lg:col-span-1 space-y-4">
            {/* AI Provider Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  AI Provider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Provider toggle */}
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setAiProvider('mistral')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                      aiProvider === 'mistral'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    Mistral AI
                  </button>
                  <button
                    onClick={() => setAiProvider('local')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                      aiProvider === 'local'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Desktop className="w-3.5 h-3.5" />
                    Local Model
                  </button>
                </div>

                {/* Mistral config */}
                {aiProvider === 'mistral' && (
                  <>
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
                      <Key className="w-3.5 h-3.5 mr-1.5" />
                      Save Key
                    </Button>
                    {apiKey ? (
                      <p className="text-xs text-green-600 dark:text-green-400">✓ API key saved</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Get your key at{' '}
                        <span className="font-medium">console.mistral.ai</span>
                      </p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Your key is stored in this session only and sent directly from your browser.
                    </p>
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium flex items-center gap-1">
                          <ArrowsClockwise className="w-3.5 h-3.5" />
                          Fallback to local model
                        </p>
                        <p className="text-xs text-muted-foreground">Retry locally if API unavailable</p>
                      </div>
                      <Switch checked={enableFallback} onCheckedChange={setEnableFallback} />
                    </div>
                    {enableFallback && (
                      <p className="text-xs text-muted-foreground">
                        Will use <span className="font-mono font-medium">{localModel || DEFAULT_LOCAL_MODEL}</span> as fallback
                      </p>
                    )}
                  </>
                )}

                {/* Local model config */}
                {aiProvider === 'local' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">API Endpoint</Label>
                      <Input
                        placeholder={DEFAULT_LOCAL_ENDPOINT}
                        value={localEndpointInput}
                        onChange={e => setLocalEndpointInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Model Name</Label>
                      <Input
                        placeholder={DEFAULT_LOCAL_MODEL}
                        value={localModelInput}
                        onChange={e => setLocalModelInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleSaveLocalConfig}
                      disabled={!localEndpointInput.trim() || !localModelInput.trim()}
                    >
                      Save Configuration
                    </Button>
                    {localEndpoint && localModel && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Using <span className="font-mono">{localModel}</span>
                      </p>
                    )}
                    <div className="flex gap-1.5 p-2 rounded-lg bg-muted/50">
                      <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Requires <span className="font-medium">Ollama</span> running locally.
                          Install at <span className="font-medium">ollama.ai</span>, then pull the model:
                        </p>
                        <code className="block font-mono bg-background px-1.5 py-0.5 rounded">
                          ollama pull {localModelInput || DEFAULT_LOCAL_MODEL}
                        </code>
                        <p className="text-muted-foreground/70">
                          Also compatible with LM Studio and Jan (OpenAI-compatible endpoints).
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recommended Edge Models */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Desktop className="w-4 h-4 text-muted-foreground" />
                  Recommended Edge Models
                </CardTitle>
                <p className="text-xs text-muted-foreground">CPU-only · No GPU required · Click to use</p>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {RECOMMENDED_LOCAL_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectRecommendedModel(m.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      (localModel || DEFAULT_LOCAL_MODEL) === m.id && aiProvider === 'local'
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {m.name}
                          <span className="ml-1.5 text-muted-foreground font-normal">{m.vendor}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{m.params} · {m.size}</p>
                      </div>
                      <code className="text-xs font-mono text-muted-foreground shrink-0 hidden sm:block">
                        {m.id}
                      </code>
                    </div>
                  </button>
                ))}
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
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleCancelGeneration}
                  >
                    Cancel Generation
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                    !topic.trim() ||
                    (aiProvider === 'mistral' && !apiKey) ||
                    (aiProvider === 'local' && !localEndpoint)
                  }
                  >
                    <Sparkle className="w-4 h-4 mr-1.5" />
                    Generate Content
                  </Button>
                )}
              </CardContent>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Library View */}
      {activeView === 'library' && (
        <div className="space-y-4">
          {/* Filters */}
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
            <Select
              value={filterType}
              onValueChange={v => setFilterType(v as ContentType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map(type => (
                  <SelectItem key={type} value={type}>
                    {CONTENT_TYPE_CONFIG[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setActiveView('generator')}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Content
            </Button>
          </div>

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
                      : 'Try adjusting your search or filter'}
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
                return (
                  <Card
                    key={item.id}
                    className="flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleViewItem(item)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2 rounded-lg ${cfg.color} shrink-0`}>
                          <Icon className="w-4 h-4" weight="duotone" />
                        </div>
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
                      <CardTitle className="text-sm mt-2 leading-snug line-clamp-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Topic: <span className="font-medium">{item.topic}</span>
                      </p>
                      <ContentBadge type={item.contentType} />
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-auto pt-2">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Viewer View */}
      {activeView === 'viewer' && viewingItem && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveView('library')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Library
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <ContentBadge type={viewingItem.contentType} />
            {viewingItem.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            <div className="ml-auto">
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
              <ScrollArea className="h-[calc(100vh-20rem)] pr-2">
                <RenderedContent markdown={viewingItem.content} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Library?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the item from your training library. This action cannot
            be undone.
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
