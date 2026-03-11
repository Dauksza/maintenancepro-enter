import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Code, Play, ArrowClockwise, Terminal, Warning } from '@phosphor-icons/react'

// ── Piston API ────────────────────────────────────────────────────────────────

interface PistonRunResult {
  stdout: string
  stderr: string
  exitCode: number
}

async function executePython(code: string): Promise<PistonRunResult> {
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      version: '3.10.0',
      files: [{ name: 'main.py', content: code }],
      run_timeout: 10000,
    }),
  })
  if (!response.ok) {
    throw new Error(`Execution service error: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return {
    stdout: data.run?.stdout ?? '',
    stderr: data.run?.stderr ?? '',
    exitCode: data.run?.code ?? 0,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface PythonPlaygroundProps {
  initialCode?: string
  title?: string
  description?: string
}

export function PythonPlayground({
  initialCode = '# Write your Python code here\nprint("Hello, World!")',
  title = 'Python Playground',
  description,
}: PythonPlaygroundProps) {
  const [code, setCode] = useState(initialCode)
  const [stdout, setStdout] = useState('')
  const [stderr, setStderr] = useState('')
  const [running, setRunning] = useState(false)
  const [ran, setRan] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleRun = useCallback(async () => {
    setRunning(true)
    setStdout('')
    setStderr('')
    abortRef.current = new AbortController()
    try {
      const result = await executePython(code)
      setStdout(result.stdout || (result.exitCode === 0 ? '(no output)' : ''))
      if (result.stderr) setStderr(result.stderr)
    } catch (e) {
      setStderr(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
      setRan(true)
    }
  }, [code])

  const handleReset = useCallback(() => {
    setCode(initialCode)
    setStdout('')
    setStderr('')
    setRan(false)
  }, [initialCode])

  return (
    <Card className="border-violet-200 dark:border-violet-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-violet-600 dark:text-violet-400" weight="duotone" />
            <CardTitle className="text-sm">{title}</CardTitle>
            <Badge
              variant="secondary"
              className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              Python
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleReset}
              disabled={running}
            >
              <ArrowClockwise className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleRun}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="w-3 h-3 mr-1.5 inline-block rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1" weight="fill" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {/* Code editor */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full font-mono text-xs rounded-lg p-3 resize-y bg-zinc-900 text-green-400 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-zinc-950"
          aria-label="Python code editor"
        />

        {/* Output panel */}
        {(ran || running) && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-muted-foreground" weight="duotone" />
              <span className="text-xs font-semibold text-muted-foreground">Output</span>
            </div>
            {running ? (
              <div className="rounded-lg p-3 font-mono text-xs bg-zinc-900 border border-zinc-700 dark:bg-zinc-950">
                <span className="text-zinc-400 animate-pulse">Running…</span>
              </div>
            ) : (
              <div className="space-y-2">
                {stdout && (
                  <pre className="rounded-lg p-3 font-mono text-xs bg-zinc-900 border border-zinc-700 text-green-300 whitespace-pre-wrap overflow-auto dark:bg-zinc-950">
                    {stdout}
                  </pre>
                )}
                {stderr && (
                  <div className="rounded-lg p-3 border border-red-800 bg-red-950/30 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Warning className="w-3.5 h-3.5 text-red-400" weight="fill" />
                      <span className="text-xs font-semibold text-red-400">Error</span>
                    </div>
                    <pre className="font-mono text-xs text-red-300 whitespace-pre-wrap overflow-auto">
                      {stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!ran && !running && (
          <p className="text-xs text-muted-foreground text-center py-1">
            Click <span className="font-semibold">Run</span> to execute this Python code.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
