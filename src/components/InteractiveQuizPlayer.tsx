import { useState, useMemo, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  RotateCcw,
  ClipboardList,
  Medal,
} from 'lucide-react'

export interface ParsedQuestion {
  id: string
  number: number
  text: string
  type: 'multiple-choice' | 'true-false'
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
}

/**
 * Parse quiz/test markdown content into structured questions.
 * Handles:
 *  - **Question N:** text followed by A) B) C) D) options and ✓ Correct Answer: X – explanation
 *  - True/False where the correct answer is bolded (**True** or **False**)
 */
function parseQuizMarkdown(markdown: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Split by question start pattern
  const questionStartRe = /(?=\*\*Question\s+\d+[:.]\*\*)/gi
  const blocks = markdown.split(questionStartRe).filter(b => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    if (!lines.length) continue

    // Extract question number and text from first line
    const firstLine = lines[0]
    const qMatch = firstLine.match(/\*\*Question\s+(\d+)[:.]\*\*\s*(.*)/)
    if (!qMatch) continue

    const questionNum = parseInt(qMatch[1], 10)
    let questionText = qMatch[2] || ''

    const options: { key: string; text: string }[] = []
    let correctAnswer = ''
    let explanation = ''
    let isTrueFalse = false

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Continuation of question text (before any option is encountered)
      const isOption = /^[A-D]\)/.test(line)
      const isAnswerMarker = /✓/.test(line)
      const isTrueFalseBold = /^\*\*(True|False)\*\*/i.test(line)
      const isAnswerPrefix = /^Answer:/i.test(line)
      if (options.length === 0 && !isOption && !isAnswerMarker && !isTrueFalseBold && !isAnswerPrefix) {
        // Skip section headers and other markdown, only append to question text if empty
        const isSectionHeader = /^#+\s/.test(line) || /^\*\*Part\s/i.test(line)
        if (!isSectionHeader && !questionText) {
          questionText += line
        }
        continue
      }

      // Multiple choice option: A) text
      const optMatch = line.match(/^([A-D])\)\s*(.+)$/)
      if (optMatch) {
        options.push({ key: optMatch[1], text: optMatch[2].trim() })
        continue
      }

      // Correct answer line: try patterns in order of specificity
      const ANSWER_PATTERNS = [
        /✓\s*Correct\s*Answer:\s*([A-D])\s*[-–—]\s*(.+)/i,
        /✓\s*([A-D])\s*[-–—]\s*(.+)/i,
        /Correct\s*Answer:\s*([A-D])\b(.*)/i,
      ]
      const answerLineMatch = ANSWER_PATTERNS.reduce<RegExpMatchArray | null>(
        (found, pattern) => found ?? line.match(pattern),
        null
      )
      if (answerLineMatch) {
        correctAnswer = answerLineMatch[1].toUpperCase()
        explanation = answerLineMatch[2]?.replace(/^[\s\-–—]+/, '').trim() || ''
        continue
      }

      // True/False: bolded answer indicates correct choice
      const tfBoldMatch = line.match(/\*\*(True|False)\*\*/i)
      if (tfBoldMatch) {
        isTrueFalse = true
        correctAnswer = tfBoldMatch[1].charAt(0).toUpperCase() + tfBoldMatch[1].slice(1).toLowerCase()
        continue
      }

      // True/False with Answer: prefix
      const tfAnswerMatch = line.match(/^(?:Answer|✓):\s*(True|False)/i)
      if (tfAnswerMatch) {
        isTrueFalse = true
        correctAnswer = tfAnswerMatch[1].charAt(0).toUpperCase() + tfAnswerMatch[1].slice(1).toLowerCase()
        continue
      }
    }

    if (!questionText.trim()) continue

    if (isTrueFalse) {
      questions.push({
        id: uuidv4(),
        number: questionNum,
        text: questionText.trim(),
        type: 'true-false',
        options: [
          { key: 'True', text: 'True' },
          { key: 'False', text: 'False' },
        ],
        correctAnswer,
        explanation,
      })
    } else if (options.length >= 2) {
      questions.push({
        id: uuidv4(),
        number: questionNum,
        text: questionText.trim(),
        type: 'multiple-choice',
        options,
        correctAnswer,
        explanation,
      })
    }
  }

  return questions
}

const PASSING_SCORE = 70 // percentage

export interface QuizCompletionResult {
  correct: number
  total: number
  percentage: number
  passed: boolean
}

interface InteractiveQuizPlayerProps {
  title: string
  content: string
  contentType: 'quiz' | 'test'
  onBack: () => void
  onComplete?: (result: QuizCompletionResult) => void
}

export function InteractiveQuizPlayer({
  title,
  content,
  contentType,
  onBack,
  onComplete,
}: InteractiveQuizPlayerProps) {
  const questions = useMemo(() => parseQuizMarkdown(content), [content])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId → selected key
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[currentIdx]

  // Calculate score after submission
  const score = useMemo(() => {
    if (!submitted || totalQuestions === 0) return null
    let correct = 0
    for (const q of questions) {
      const given = answers[q.id] ?? ''
      const expected = q.correctAnswer ?? ''
      if (given.toLowerCase() === expected.toLowerCase()) correct++
    }
    const percentage = Math.round((correct / totalQuestions) * 100)
    return { correct, total: totalQuestions, percentage }
  }, [submitted, questions, answers, totalQuestions])

  const passed = score ? score.percentage >= PASSING_SCORE : false

  const handleSelectAnswer = useCallback(
    (questionId: string, answer: string) => {
      if (submitted) return
      setAnswers(prev => ({ ...prev, [questionId]: answer }))
    },
    [submitted]
  )

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
    setShowResults(true)
    // Compute and report completion result
    if (onComplete && questions.length > 0) {
      let correct = 0
      for (const q of questions) {
        const given = answers[q.id] ?? ''
        const expected = q.correctAnswer ?? ''
        if (given.toLowerCase() === expected.toLowerCase()) correct++
      }
      const percentage = Math.round((correct / questions.length) * 100)
      onComplete({ correct, total: questions.length, percentage, passed: percentage >= PASSING_SCORE })
    }
  }, [onComplete, questions, answers])

  const handleRetry = useCallback(() => {
    setAnswers({})
    setSubmitted(false)
    setShowResults(false)
    setCurrentIdx(0)
  }, [])

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (totalQuestions === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Library
        </Button>
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
            <ClipboardList className="w-12 h-12 opacity-20" />
            <div>
              <p className="font-medium">No questions could be parsed from this content</p>
              <p className="text-sm mt-1">
                The content may use a format that isn't recognized. Try regenerating with the
                standard quiz prompt.
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

  // ── Results screen ───────────────────────────────────────────────────────────
  if (showResults && score) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Library
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Retake {contentType === 'quiz' ? 'Quiz' : 'Test'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowResults(false)
              setCurrentIdx(0)
            }}
          >
            Review Answers
          </Button>
        </div>

        {/* Score card */}
        <Card
          className={`border-2 ${passed ? 'border-green-500/40 bg-green-50/30 dark:bg-green-950/20' : 'border-red-500/40 bg-red-50/30 dark:bg-red-950/20'}`}
        >
          <CardContent className="py-10 flex flex-col items-center text-center space-y-4">
            {passed ? (
              <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Trophy className="w-14 h-14 text-yellow-500" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <Medal className="w-14 h-14 text-red-500" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{passed ? 'Congratulations!' : 'Keep Studying'}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{title}</p>
            </div>
            <div className="text-5xl font-bold tracking-tight">{score.percentage}%</div>
            <p className="text-muted-foreground">
              {score.correct} out of {score.total} correct
            </p>
            <Badge
              className={`text-sm px-4 py-1 ${passed ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'} text-white`}
            >
              {passed ? '✓ PASSED' : '✗ FAILED'} — {PASSING_SCORE}% required to pass
            </Badge>
            <Progress
              value={score.percentage}
              className={`w-full max-w-sm h-3 ${passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
            />
          </CardContent>
        </Card>

        {/* Per-question summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Summary</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-2">
            {questions.map(q => {
              const given = answers[q.id] ?? ''
              const expected = q.correctAnswer ?? ''
              const isCorrect = given.toLowerCase() === expected.toLowerCase()
              return (
                <div
                  key={q.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800'}`}
                >
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      Q{q.number}: {q.text}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your answer:{' '}
                        <span className="text-red-600 font-medium">{given || 'Not answered'}</span>{' '}
                        · Correct:{' '}
                        <span className="text-green-600 font-medium">{expected}</span>
                      </p>
                    )}
                  </div>
                  <button
                    className="text-xs text-muted-foreground underline underline-offset-2 shrink-0"
                    onClick={() => {
                      setShowResults(false)
                      setCurrentIdx(questions.findIndex(x => x.id === q.id))
                    }}
                  >
                    Review
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Question view ────────────────────────────────────────────────────────────
  const progress = ((currentIdx + 1) / totalQuestions) * 100

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Library
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="outline">{contentType === 'quiz' ? 'Interactive Quiz' : 'Interactive Test'}</Badge>
        {submitted && score && (
          <Badge
            className={`${passed ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'} text-white`}
          >
            {score.percentage}% — {passed ? 'PASSED' : 'FAILED'}
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          {submitted && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowResults(true)}>
                View Results
              </Button>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Retake
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Title + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold truncate">{title}</h2>
          <span className="text-sm text-muted-foreground shrink-0 ml-2">
            {currentIdx + 1} / {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        {!submitted && (
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {totalQuestions} answered
          </p>
        )}
      </div>

      {/* Question dots / nav */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id]
          const isCurrent = idx === currentIdx
          const isCorrectAfterSubmit = submitted
            ? (answers[q.id] ?? '').toLowerCase() === (q.correctAnswer ?? '').toLowerCase()
            : false

          return (
            <button
              key={q.id}
              className={cn(
                'w-7 h-7 rounded-full text-xs font-semibold transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary',
                submitted && isCorrectAfterSubmit && 'bg-green-500 text-white',
                submitted && !isCorrectAfterSubmit && 'bg-red-500 text-white',
                !submitted && isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1',
                !submitted && !isCurrent && isAnswered && 'bg-primary/20 text-primary border border-primary/40',
                !submitted && !isCurrent && !isAnswered && 'bg-muted text-muted-foreground border border-border'
              )}
              onClick={() => setCurrentIdx(idx)}
              title={`Question ${q.number}`}
            >
              {q.number}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      {currentQuestion && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5 text-xs">
                Q{currentQuestion.number}
              </Badge>
              <CardTitle className="text-base font-medium leading-relaxed">
                {currentQuestion.text}
              </CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-2">
            {currentQuestion.options.map(opt => {
              const isSelected = answers[currentQuestion.id] === opt.key
              const isCorrect =
                opt.key.toLowerCase() === (currentQuestion.correctAnswer ?? '').toLowerCase()
              const isWrongSelection = submitted && isSelected && !isCorrect

              return (
                <button
                  key={opt.key}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3',
                    submitted && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200',
                    isWrongSelection && 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200',
                    submitted && !isCorrect && !isSelected && 'border-border bg-muted/30 opacity-60',
                    !submitted && isSelected && 'border-primary bg-primary/5',
                    !submitted && !isSelected && 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                  )}
                  onClick={() => handleSelectAnswer(currentQuestion.id, opt.key)}
                  disabled={submitted}
                >
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      submitted
                        ? isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : isSelected
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-border'
                        : isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm flex-1">{opt.text}</span>
                  {submitted && (
                    <span className="shrink-0 mt-0.5">
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Explanation (shown after submission) */}
            {submitted && currentQuestion.explanation && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Explanation:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Previous
        </Button>

        {currentIdx < totalQuestions - 1 ? (
          <Button onClick={() => setCurrentIdx(prev => prev + 1)}>
            Next
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : !submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Submit {contentType === 'quiz' ? 'Quiz' : 'Test'}
          </Button>
        ) : (
          <Button onClick={() => setShowResults(true)}>View Results</Button>
        )}
      </div>
    </div>
  )
}
